import { BrowserPDF417Reader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
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

const createPdf417Reader = (): BrowserPDF417Reader => {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
  return new BrowserPDF417Reader(hints);
};

const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for decoding."));
    };
    image.src = url;
  });

const drawRotated = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, angle: number): void => {
  const radians = (angle * Math.PI) / 180;
  const swapDimensions = angle === 90 || angle === 270;
  const width = swapDimensions ? image.naturalHeight : image.naturalWidth;
  const height = swapDimensions ? image.naturalWidth : image.naturalHeight;

  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.restore();
};

const decodeWithRotationFallback = async (reader: BrowserPDF417Reader, blob: Blob): Promise<string | null> => {
  const image = await loadImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  for (const angle of [0, 90, 180, 270]) {
    try {
      drawRotated(ctx, image, angle);
      const result = reader.decodeFromCanvas(canvas);
      return result.getText();
    } catch {
      continue;
    }
  }

  return null;
};

export async function decodeFromImage(file: File): Promise<DecodeResult> {
  const reader = createPdf417Reader();
  const decodeBlob = await convertHeicIfNeeded(file);
  const url = URL.createObjectURL(decodeBlob);

  try {
    let text: string | null = null;

    try {
      const result = await reader.decodeFromImageUrl(url);
      text = result.getText();
    } catch {
      text = await decodeWithRotationFallback(reader, decodeBlob);
    }

    if (!text) {
      throw new Error("No PDF417 barcode was detected in this image.");
    }

    return {
      rawText: text,
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
