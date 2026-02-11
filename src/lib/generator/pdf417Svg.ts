import bwipjs from "bwip-js/browser";
import type { Pdf417GenerateInput } from "../../types/barcode";

const MIN_SCALE = 1;
const MAX_SCALE = 12;
const MIN_HEIGHT = 3;
const MAX_HEIGHT = 40;
const MIN_PADDING = 0;
const MAX_PADDING = 30;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function generatePdf417Svg(input: Pdf417GenerateInput): string {
  const payload = input.payload.trim();

  if (!payload) {
    throw new Error("Payload is required to generate a PDF417 barcode.");
  }

  const scale = clamp(Math.round(input.scale), MIN_SCALE, MAX_SCALE);
  const height = clamp(Math.round(input.height), MIN_HEIGHT, MAX_HEIGHT);
  const padding = clamp(Math.round(input.padding), MIN_PADDING, MAX_PADDING);

  return bwipjs.toSVG({
    bcid: "pdf417",
    text: payload,
    scale,
    height,
    includetext: false,
    paddingwidth: padding,
    paddingheight: padding,
  });
}
