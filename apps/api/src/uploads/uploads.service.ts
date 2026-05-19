import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadsService {
  getCandidateDocuments() {
    return [
      {
        id: "doc-001",
        type: "CV",
        storageProvider: "supabase",
      },
    ];
  }

  registerDocument(payload: Record<string, unknown>) {
    return {
      message: "Base de registro documental creada. Pendiente carga real a Supabase Storage o S3.",
      payload,
    };
  }
}
