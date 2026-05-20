type BackendRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  accessToken?: string | null;
  body?: unknown;
  headers?: HeadersInit;
};

const DEFAULT_BACKEND_API_URL = "http://localhost:4000/api";

export function getBackendApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BACKEND_API_URL).replace(/\/$/, "");
}

export function buildBackendUrl(path: string) {
  return `${getBackendApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function backendJsonRequest<T>(path: string, options: BackendRequestOptions = {}) {
  const response = await fetch(buildBackendUrl(path), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    throw new Error(message);
  }

  return payload as T;
}

export async function backendRawRequest(path: string, options: BackendRequestOptions = {}) {
  const response = await fetch(buildBackendUrl(path), {
    method: options.method ?? "GET",
    headers: {
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(extractErrorMessage(payload, response.status));
  }

  return response;
}

function extractErrorMessage(payload: unknown, status: number) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload
  ) {
    const message = (payload as { message?: string | string[] }).message;

    if (Array.isArray(message)) {
      return message.join(". ");
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return `No se pudo completar la solicitud (${status}).`;
}
