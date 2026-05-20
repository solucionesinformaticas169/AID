import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DocumentType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import path from "node:path";

type UploadableFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const ALLOWED_TYPES: Record<
  DocumentType,
  { mimeTypes: string[]; extensions: string[]; maxSizeMb?: number }
> = {
  CV: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  CERTIFICATE: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: [".pdf", ".png", ".jpg", ".jpeg"],
  },
  ID: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: [".pdf", ".png", ".jpg", ".jpeg"],
  },
  LICENSE: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: [".pdf", ".png", ".jpg", ".jpeg"],
  },
  OTHER: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: [".pdf", ".png", ".jpg", ".jpeg"],
  },
};

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".dll",
  ".ps1",
  ".sh",
  ".php",
  ".js",
  ".jar",
  ".svg",
  ".html",
  ".htm",
]);

@Injectable()
export class SupabaseStorageService {
  private readonly supabase: SupabaseClient | null;
  private readonly bucket: string;
  private readonly maxUploadMb: number;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>("SUPABASE_URL");
    const serviceRoleKey = this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    this.bucket =
      this.configService.get<string>("SUPABASE_STORAGE_BUCKET") ??
      this.configService.get<string>("SUPABASE_BUCKET") ??
      "candidate-documents";
    this.maxUploadMb = Number(this.configService.get<string>("MAX_UPLOAD_MB") ?? "8");

    this.supabase =
      url && serviceRoleKey
        ? createClient(url, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          })
        : null;
  }

  async uploadCandidateDocument(input: {
    candidateProfileId: string;
    documentType: DocumentType;
    file: UploadableFile;
  }) {
    this.ensureConfigured();
    this.validateFile(input.documentType, input.file);

    const safeFileName = this.buildSafeFileName(input.file.originalname);
    const storagePath = [
      "candidate-documents",
      input.candidateProfileId,
      input.documentType.toLowerCase(),
      `${randomUUID()}-${safeFileName}`,
    ].join("/");

    const { error } = await this.supabase!.storage.from(this.bucket).upload(storagePath, input.file.buffer, {
      contentType: input.file.mimetype,
      upsert: false,
      cacheControl: "3600",
    });

    if (error) {
      throw new InternalServerErrorException(
        `No se pudo subir el archivo a Supabase Storage: ${error.message}`,
      );
    }

    return {
      storagePath,
      fileName: input.file.originalname,
      mimeType: input.file.mimetype,
      size: input.file.size,
    };
  }

  async createSignedUrl(storagePath: string, download = false) {
    this.ensureConfigured();

    const { data, error } = await this.supabase!.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, 60 * 10, {
        download,
      });

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        `No se pudo generar la URL firmada del documento: ${error?.message ?? "sin detalle"}`,
      );
    }

    return data.signedUrl;
  }

  async removeObject(storagePath: string) {
    this.ensureConfigured();
    const { error } = await this.supabase!.storage.from(this.bucket).remove([storagePath]);

    if (error) {
      throw new InternalServerErrorException(
        `No se pudo eliminar el archivo en Supabase Storage: ${error.message}`,
      );
    }
  }

  private validateFile(documentType: DocumentType, file: UploadableFile) {
    const rules = ALLOWED_TYPES[documentType];

    if (!rules) {
      throw new BadRequestException(`No existe una politica de carga para ${documentType}.`);
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const maxBytes = this.maxUploadMb * 1024 * 1024;
    const detectedMimeType = this.detectMimeType(file.buffer);
    const safeOriginalName = path.basename(file.originalname);

    if (safeOriginalName !== file.originalname || file.originalname.length > 180) {
      throw new BadRequestException("El nombre del archivo contiene caracteres o rutas no permitidas.");
    }

    if (BLOCKED_EXTENSIONS.has(extension)) {
      throw new BadRequestException("La extension del archivo esta bloqueada por seguridad.");
    }

    if (!rules.extensions.includes(extension)) {
      throw new BadRequestException(
        `La extension ${extension || "desconocida"} no esta permitida para ${documentType}.`,
      );
    }

    if (!rules.mimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `El tipo MIME ${file.mimetype} no esta permitido para ${documentType}.`,
      );
    }

    if (!detectedMimeType || !rules.mimeTypes.includes(detectedMimeType)) {
      throw new BadRequestException("El contenido real del archivo no coincide con un tipo permitido.");
    }

    if (file.size > maxBytes) {
      throw new BadRequestException(
        `El archivo supera el tamano maximo permitido de ${this.maxUploadMb} MB.`,
      );
    }
  }

  private ensureConfigured() {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase Storage no esta configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
  }

  private buildSafeFileName(fileName: string) {
    const extension = path.extname(fileName).toLowerCase();
    const baseName = path
      .basename(fileName, extension)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return `${baseName || "documento"}${extension}`;
  }

  private detectMimeType(buffer: Buffer) {
    if (buffer.length >= 5 && buffer.subarray(0, 5).toString("utf8") === "%PDF-") {
      return "application/pdf";
    }

    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png";
    }

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    return null;
  }
}
