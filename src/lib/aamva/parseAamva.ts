import { GetVersion, Parse, type ParsedLicense } from "aamva-parser";
import type { ParsedAamva } from "../../types/barcode";

const AAMVA_HINT_PATTERN = /(ANSI\s+\d{6}\d{2}|\bDCS\b|\bDAC\b|\bDAQ\b)/;

const formatDate = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toFieldRecord = (license: ParsedLicense): Record<string, string> => {
  const fields: Record<string, string> = {};

  for (const [key, value] of Object.entries(license)) {
    if (value === null || value === undefined || typeof value === "function") {
      continue;
    }

    if (key === "pdf417") {
      continue;
    }

    if (value instanceof Date) {
      fields[key] = formatDate(value);
      continue;
    }

    if (typeof value === "boolean") {
      if (value) {
        fields[key] = "true";
      }
      continue;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      if (!normalized || normalized.toLowerCase() === "unknown") {
        continue;
      }
      fields[key] = normalized;
      continue;
    }

    fields[key] = String(value);
  }

  return fields;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown AAMVA parse failure";
};

export function parseAamva(rawText: string): ParsedAamva {
  const warnings: string[] = [];
  const trimmed = rawText.trim();

  if (!trimmed) {
    return {
      isLikelyAamva: false,
      fields: {},
      warnings: ["Decoded payload is empty."],
    };
  }

  const hasAamvaHints = AAMVA_HINT_PATTERN.test(trimmed);

  try {
    const parsed = Parse(trimmed);
    const fields = toFieldRecord(parsed);
    const version = GetVersion(trimmed) || parsed.version || undefined;
    const hasSignalData = Boolean(
      fields.firstName ||
        fields.lastName ||
        fields.driversLicenseId ||
        fields.dateOfBirth ||
        fields.expirationDate,
    );

    if (!hasAamvaHints) {
      warnings.push("Payload does not include typical AAMVA markers.");
    }

    if (Object.keys(fields).length === 0) {
      warnings.push("AAMVA parse returned no recognizable fields.");
    }

    return {
      isLikelyAamva: hasAamvaHints || hasSignalData,
      version: version ?? undefined,
      fields,
      warnings,
    };
  } catch (error) {
    return {
      isLikelyAamva: false,
      fields: {},
      warnings: [`AAMVA parse failed: ${getErrorMessage(error)}`],
    };
  }
}
