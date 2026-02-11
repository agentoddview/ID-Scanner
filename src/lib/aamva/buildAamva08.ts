import type { Aamva08FormInput } from "../../types/barcode";

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

export function buildAamva08Payload(form: Aamva08FormInput): string {
  const firstName = requireField("First name", form.firstName).toUpperCase();
  const lastName = requireField("Last name", form.lastName).toUpperCase();
  const documentNumber = requireField("Document number", form.documentNumber).toUpperCase();
  const issuerIIN = sanitizeAlphaNum(requireField("Issuer IIN", form.issuerIIN).toUpperCase());

  if (!/^\d{6}$/.test(issuerIIN)) {
    throw new Error("Issuer IIN must be exactly 6 digits.");
  }

  const dob = toMmddyyyy(form.dob, "Date of birth");
  const expiry = toMmddyyyy(form.expiry, "Expiry date");
  const issue = toMmddyyyy(new Date().toISOString().slice(0, 10), "Issue date");

  const address1 = (form.address1 ?? "UNKNOWN ADDRESS").trim().toUpperCase();
  const city = (form.city ?? "UNKNOWN").trim().toUpperCase();
  const jurisdictionCode = (form.jurisdictionCode ?? "CA").trim().toUpperCase();
  const postalCode = (form.postalCode ?? "00000").trim().toUpperCase();

  const lines = [
    "@",
    `ANSI ${issuerIIN}080102DL00410288ZA03290015DL`,
    `DAQ${documentNumber}`,
    `DCS${lastName}`,
    `DAC${firstName}`,
    `DBB${dob}`,
    `DBA${expiry}`,
    `DBD${issue}`,
    `DBC${normalizeSex(form.sex)}`,
    `DAG${address1}`,
    `DAI${city}`,
    `DAJ${jurisdictionCode}`,
    `DAK${postalCode}`,
    `DCF${documentNumber}`,
    "DCGUSA",
  ];

  return `${lines.join("\n")}\n`;
}
