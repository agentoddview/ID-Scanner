import { AAMVA_FIELD_ORDER, AAMVA_REQUIRED_CORE_CODES, AAMVA_WA_DEFAULTS } from "./fieldCatalog";
import type { Aamva08FieldBuildInput, Aamva08FormInput, AamvaCustomField } from "../../types/barcode";

const requireField = (name: string, value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${name} is required.`);
  }

  return trimmed;
};

const toMmddyyyy = (isoDate: string, fieldName: string): string => {
  const trimmed = requireField(fieldName, isoDate);
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const [, year, month, day] = match;
  return `${month}${day}${year}`;
};

const normalizeSex = (value: string | undefined): string => {
  if (!value) {
    return "9";
  }

  const normalized = value.trim().toUpperCase();

  if (["1", "M", "MALE"].includes(normalized)) {
    return "1";
  }

  if (["2", "F", "FEMALE"].includes(normalized)) {
    return "2";
  }

  return "9";
};

const sanitizeAlphaNum = (value: string): string => value.replace(/[^A-Z0-9]/g, "");

const normalizeAamvaDate = (value: string, fieldName: string): string => {
  const trimmed = requireField(fieldName, value);
  if (/^\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  return toMmddyyyy(trimmed, fieldName);
};

const sanitizeFieldCode = (code: string): string => code.trim().toUpperCase();

const sanitizeFieldValue = (value: string): string => value.trim().toUpperCase();

const normalizeFieldValue = (code: string, value: string): string => {
  if (!value.trim()) {
    return "";
  }

  if (["DBA", "DBB", "DBD", "DBE", "DBL", "PAB", "PAD", "DDC", "DDH", "DDI", "DDJ"].includes(code)) {
    return normalizeAamvaDate(value, code);
  }

  return sanitizeFieldValue(value);
};

const mergeFields = (fields: Record<string, string>, customFields: AamvaCustomField[] = []): Record<string, string> => {
  const merged: Record<string, string> = {};

  for (const [code, value] of Object.entries(fields)) {
    const nextCode = sanitizeFieldCode(code);
    const nextValue = normalizeFieldValue(nextCode, value);
    if (nextCode && nextValue) {
      merged[nextCode] = nextValue;
    }
  }

  for (const entry of customFields) {
    const nextCode = sanitizeFieldCode(entry.code);
    const nextValue = normalizeFieldValue(nextCode, entry.value);
    if (!nextCode || !nextValue) {
      continue;
    }

    if (!/^[A-Z0-9]{3}$/.test(nextCode)) {
      throw new Error(`Custom field code "${entry.code}" must be exactly 3 letters/numbers.`);
    }

    merged[nextCode] = nextValue;
  }

  return merged;
};

const sortFieldCodes = (fieldCodes: string[]): string[] => {
  const known = fieldCodes
    .filter((code) => AAMVA_FIELD_ORDER.includes(code))
    .sort((left, right) => AAMVA_FIELD_ORDER.indexOf(left) - AAMVA_FIELD_ORDER.indexOf(right));
  const unknown = fieldCodes.filter((code) => !AAMVA_FIELD_ORDER.includes(code)).sort();
  return [...known, ...unknown];
};

export function buildAamva08PayloadFromFields(input: Aamva08FieldBuildInput): string {
  const issuerIIN = sanitizeAlphaNum(requireField("Issuer IIN", input.issuerIIN).toUpperCase());

  if (!/^\d{6}$/.test(issuerIIN)) {
    throw new Error("Issuer IIN must be exactly 6 digits.");
  }

  const merged = mergeFields({ ...AAMVA_WA_DEFAULTS, ...input.fields }, input.customFields);

  for (const requiredCode of AAMVA_REQUIRED_CORE_CODES) {
    if (!merged[requiredCode]) {
      throw new Error(`Field ${requiredCode} is required.`);
    }
  }

  if (!merged.DBD) {
    merged.DBD = toMmddyyyy(new Date().toISOString().slice(0, 10), "Issue date");
  }

  const orderedCodes = sortFieldCodes(Object.keys(merged));
  const lines = ["@", `ANSI ${issuerIIN}080102DL00410288ZA03290015DL`];

  for (const code of orderedCodes) {
    lines.push(`${code}${merged[code]}`);
  }

  return `${lines.join("\n")}\n`;
}

export function buildAamva08Payload(form: Aamva08FormInput): string {
  return buildAamva08PayloadFromFields({
    issuerIIN: form.issuerIIN,
    fields: {
      DAC: requireField("First name", form.firstName),
      DCS: requireField("Last name", form.lastName),
      DAQ: requireField("Document number", form.documentNumber),
      DBB: toMmddyyyy(form.dob, "Date of birth"),
      DBA: toMmddyyyy(form.expiry, "Expiry date"),
      DBC: normalizeSex(form.sex),
      DAG: (form.address1 ?? "UNKNOWN ADDRESS").trim().toUpperCase(),
      DAI: (form.city ?? "UNKNOWN").trim().toUpperCase(),
      DAJ: (form.jurisdictionCode ?? "WA").trim().toUpperCase(),
      DAK: (form.postalCode ?? "00000").trim().toUpperCase(),
      DCF: requireField("Document number", form.documentNumber),
      DCG: "USA",
    },
  });
}
