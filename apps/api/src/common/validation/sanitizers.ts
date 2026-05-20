import { Transform } from "class-transformer";

function sanitizeScalar(value: string) {
  return value
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "");
}

export function NormalizeEmail() {
  return Transform(({ value }) => {
    if (typeof value !== "string") {
      return value;
    }

    return sanitizeScalar(value).toLowerCase();
  });
}

export function SanitizeText() {
  return Transform(({ value }) => {
    if (typeof value !== "string") {
      return value;
    }

    return sanitizeScalar(value);
  });
}

export function SanitizeStringArray() {
  return Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => sanitizeScalar(item))
      .filter(Boolean);
  });
}
