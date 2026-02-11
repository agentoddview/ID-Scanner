import { BrowserPDF417Reader } from "@zxing/browser";
import type { DecodeResult } from "../../types/barcode";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown image decoding error";
};

export async function decodeFromImage(file: File): Promise<DecodeResult> {
  const reader = new BrowserPDF417Reader();
  const url = URL.createObjectURL(file);

  try {
    const result = await reader.decodeFromImageUrl(url);

    return {
      rawText: result.getText(),
      format: "PDF_417",
      source: "image-upload",
      timestampIso: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  } finally {
    URL.revokeObjectURL(url);
  }
}
