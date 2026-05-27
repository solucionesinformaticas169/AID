"use client";

export type CandidateDocument = {
  id: string;
  type: "CV" | "CERTIFICATE" | "ID" | "LICENSE" | "OTHER";
  storageProvider: "SUPABASE" | "S3";
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type SignedDocumentUrlResponse = {
  documentId: string;
  signedUrl: string;
  expiresInSeconds: number;
};

type UploadDocumentResponse = {
  message: string;
  document: CandidateDocument;
};

const DOCUMENTS_API_BASE = "/api/documents";

export function buildDocumentFileUrl(documentId: string, options?: { download?: boolean }) {
  return `${DOCUMENTS_API_BASE}/${documentId}/file?download=${options?.download === true}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(". ")
      : payload.message ?? "No se pudo completar la operacion.";

    throw new Error(message);
  }

  return payload;
}

export async function getMyDocuments() {
  const response = await fetch(`${DOCUMENTS_API_BASE}/me`, {
    cache: "no-store",
    credentials: "include",
  });

  return parseJsonResponse<CandidateDocument[]>(response);
}

export async function getCandidateDocumentsByProfile(candidateProfileId: string) {
  const response = await fetch(`/api/documents/candidate-profile/${candidateProfileId}`, {
    cache: "no-store",
    credentials: "include",
  });

  return parseJsonResponse<CandidateDocument[]>(response);
}

export async function uploadDocument(input: {
  documentType: CandidateDocument["type"];
  file: File;
}) {
  const formData = new FormData();
  formData.append("documentType", input.documentType);
  formData.append("file", input.file);

  const response = await fetch(DOCUMENTS_API_BASE, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return parseJsonResponse<UploadDocumentResponse>(response);
}

export async function getSignedDocumentUrl(documentId: string, options?: { download?: boolean }) {
  const response = await fetch(
    `${DOCUMENTS_API_BASE}/${documentId}/url?download=${options?.download === true}`,
    {
      cache: "no-store",
      credentials: "include",
    },
  );

  return parseJsonResponse<SignedDocumentUrlResponse>(response);
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`${DOCUMENTS_API_BASE}/${documentId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJsonResponse<{ message: string }>(response);
}
