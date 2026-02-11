import bwipjs from "bwip-js/browser";
import type { Pdf417GenerateInput } from "../../types/barcode";

const MIN_SCALE = 1;
const MAX_SCALE = 12;
const MIN_HEIGHT = 3;
const MAX_HEIGHT = 40;
const MIN_PADDING = 0;
const MAX_PADDING = 30;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 30;
const MIN_ROWS = 3;
const MAX_ROWS = 90;
const MIN_ERROR_LEVEL = 0;
const MAX_ERROR_LEVEL = 8;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function generatePdf417Svg(input: Pdf417GenerateInput): string {
  const payload = input.payload.trim();

  if (!payload) {
    throw new Error("Payload is required to generate a PDF417 barcode.");
  }

  const scale = clamp(Math.round(input.scale), MIN_SCALE, MAX_SCALE);
  const height = clamp(Math.round(input.height), MIN_HEIGHT, MAX_HEIGHT);
  const padding = clamp(Math.round(input.padding), MIN_PADDING, MAX_PADDING);
  const columns = input.columns ? clamp(Math.round(input.columns), MIN_COLUMNS, MAX_COLUMNS) : undefined;
  const rows = input.rows ? clamp(Math.round(input.rows), MIN_ROWS, MAX_ROWS) : undefined;
  const errorCorrectionLevel = input.errorCorrectionLevel ?? undefined;

  if (errorCorrectionLevel !== undefined && (errorCorrectionLevel < MIN_ERROR_LEVEL || errorCorrectionLevel > MAX_ERROR_LEVEL)) {
    throw new Error("Error correction level must be between 0 and 8.");
  }

  return bwipjs.toSVG({
    bcid: input.compact ? "pdf417compact" : "pdf417",
    text: payload,
    scale,
    height,
    includetext: false,
    paddingwidth: padding,
    paddingheight: padding,
    ...(columns ? { columns } : {}),
    ...(rows ? { rows } : {}),
    ...(errorCorrectionLevel !== undefined ? { eclevel: errorCorrectionLevel } : {}),
  });
}
