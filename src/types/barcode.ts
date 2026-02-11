export type DecodeSource = "camera" | "image-upload";

export type DecodeStatus =
  | "idle"
  | "requesting-permission"
  | "scanning"
  | "paused"
  | "success"
  | "error";

export interface ParsedAamva {
  isLikelyAamva: boolean;
  version?: string;
  fields: Record<string, string>;
  warnings: string[];
}

export interface DecodeResult {
  rawText: string;
  format: "PDF_417";
  source: DecodeSource;
  timestampIso: string;
  parsedAamva?: ParsedAamva;
}

export interface Pdf417GenerateInput {
  payload: string;
  scale: number;
  height: number;
  includetext: false;
  padding: number;
}

export interface Aamva08FormInput {
  firstName: string;
  lastName: string;
  dob: string;
  expiry: string;
  documentNumber: string;
  issuerIIN: string;
  sex?: string;
  address1?: string;
  city?: string;
  jurisdictionCode?: string;
  postalCode?: string;
}
