import { BrowserPDF417Reader } from "@zxing/browser";
import type { DecodeResult } from "../../types/barcode";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown image decoding error";
};

const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const HEIC_EXTENSION_PATTERN = /\.(heic|heif)$/i;

const isHeicLikeFile = (file: File): boolean =>
  HEIC_MIME_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSION_PATTERN.test(file.name);

const convertHeicIfNeeded = async (file: File): Promise<Blob> => {
  if (!isHeicLikeFile(file)) {
    return file;
  }

  const { default: heic2any } = await import("heic2any");

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  if (Array.isArray(converted)) {
    if (!converted[0]) {
      throw new Error("HEIC conversion produced no output image.");
    }
    return converted[0];
  }

  return converted;
};

export async function decodeFromImage(file: File): Promise<DecodeResult> {
  const reader = new BrowserPDF417Reader();
  const decodeBlob = await convertHeicIfNeeded(file);
  const url = URL.createObjectURL(decodeBlob);

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
