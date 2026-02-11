import { BrowserCodeReader, BrowserPDF417Reader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser/esm/common/IScannerControls";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import type { Result } from "@zxing/library";
import type { DecodeResult } from "../../types/barcode";

export class ScanCancelledError extends Error {
  constructor(message = "Scan cancelled") {
    super(message);
    this.name = "ScanCancelledError";
  }
}

export interface CameraDecodeSession {
  result: Promise<DecodeResult>;
  stop: () => void;
}

const toDecodeResult = (result: Result, source: DecodeResult["source"]): DecodeResult => ({
  rawText: result.getText(),
  format: "PDF_417",
  source,
  timestampIso: new Date().toISOString(),
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown scanning error";
};

const createPdf417Hints = (): Map<DecodeHintType, unknown> => {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
  return hints;
};

const createPdf417Reader = (): BrowserPDF417Reader =>
  new BrowserPDF417Reader(createPdf417Hints(), {
    delayBetweenScanAttempts: 35,
    delayBetweenScanSuccess: 120,
    tryPlayVideoTimeout: 6000,
  });

const createVideoConstraints = (deviceId?: string): MediaStreamConstraints => ({
  audio: false,
  video: deviceId
    ? {
        deviceId: { exact: deviceId },
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        facingMode: { ideal: "environment" },
      }
    : {
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        facingMode: { ideal: "environment" },
      },
});

const applyHighContrast = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const gray = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
    const boosted = gray > 128 ? 255 : 0;
    pixels[index] = boosted;
    pixels[index + 1] = boosted;
    pixels[index + 2] = boosted;
  }

  ctx.putImageData(imageData, 0, 0);
};

const drawVideoFrame = (
  videoEl: HTMLVideoElement,
  scale = 1,
  rotation = 0,
  highContrast = false,
): HTMLCanvasElement => {
  const sourceWidth = videoEl.videoWidth;
  const sourceHeight = videoEl.videoHeight;
  const targetWidth = Math.max(1, Math.floor(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.floor(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  const swapDimensions = rotation === 90 || rotation === 270;
  canvas.width = swapDimensions ? targetHeight : targetWidth;
  canvas.height = swapDimensions ? targetWidth : targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(videoEl, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
  ctx.restore();

  if (highContrast) {
    applyHighContrast(canvas);
  }

  return canvas;
};

const tryDecodeCanvas = (reader: BrowserPDF417Reader, canvas: HTMLCanvasElement): string | null => {
  try {
    const result = reader.decodeFromCanvas(canvas);
    return result.getText();
  } catch {
    return null;
  }
};

export async function decodeFromCameraFrame(videoEl: HTMLVideoElement): Promise<DecodeResult> {
  if (!videoEl.videoWidth || !videoEl.videoHeight) {
    throw new Error("Video frame is not ready yet.");
  }

  const reader = createPdf417Reader();
  const attempts: Array<{ scale: number; rotation: number; highContrast: boolean }> = [
    { scale: 1, rotation: 0, highContrast: false },
    { scale: 1.4, rotation: 0, highContrast: false },
    { scale: 1.9, rotation: 0, highContrast: true },
    { scale: 1.4, rotation: 180, highContrast: false },
    { scale: 1.9, rotation: 180, highContrast: true },
  ];

  for (const attempt of attempts) {
    const canvas = drawVideoFrame(videoEl, attempt.scale, attempt.rotation, attempt.highContrast);
    const text = tryDecodeCanvas(reader, canvas);
    if (text) {
      return {
        rawText: text,
        format: "PDF_417",
        source: "camera",
        timestampIso: new Date().toISOString(),
      };
    }
  }

  throw new Error("No PDF417 barcode detected in the current camera frame.");
}

export async function listCameraDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await BrowserCodeReader.listVideoInputDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

export function stopAllCameraStreams(videoElement?: HTMLVideoElement): void {
  BrowserCodeReader.releaseAllStreams();
  if (videoElement) {
    BrowserCodeReader.cleanVideoSource(videoElement);
  }
}

export async function startCameraDecode(
  videoEl: HTMLVideoElement,
  deviceId?: string,
): Promise<CameraDecodeSession> {
  const reader = createPdf417Reader();
  let controls: IScannerControls | undefined;
  let done = false;
  let rejectResult: ((reason?: unknown) => void) | null = null;

  const result = new Promise<DecodeResult>((resolve, reject) => {
    rejectResult = reject;

    reader
      .decodeFromConstraints(createVideoConstraints(deviceId), videoEl, (scanResult, scanError) => {
        if (!scanResult || done) {
          // Frame-level misses/errors are expected while scanning.
          // Startup/device/permission failures are handled by decodeFromConstraints rejection below.
          void scanError;
          return;
        }

        done = true;
        controls?.stop();
        stopAllCameraStreams(videoEl);
        resolve(toDecodeResult(scanResult, "camera"));
      })
      .then((nextControls) => {
        controls = nextControls;
      })
      .catch((error) => {
        done = true;
        reject(new Error(getErrorMessage(error)));
      });
  });

  return {
    result,
    stop: () => {
      if (done) {
        return;
      }

      done = true;
      controls?.stop();
      stopAllCameraStreams(videoEl);
      rejectResult?.(new ScanCancelledError());
    },
  };
}

export async function decodeFromCamera(
  videoEl: HTMLVideoElement,
  deviceId?: string,
): Promise<DecodeResult> {
  const session = await startCameraDecode(videoEl, deviceId);
  return session.result;
}
