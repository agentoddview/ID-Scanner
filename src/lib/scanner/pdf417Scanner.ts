import { BrowserCodeReader, BrowserPDF417Reader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser/esm/common/IScannerControls";
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
  const reader = new BrowserPDF417Reader();
  let controls: IScannerControls | undefined;
  let done = false;
  let rejectResult: ((reason?: unknown) => void) | null = null;

  const result = new Promise<DecodeResult>((resolve, reject) => {
    rejectResult = reject;

    reader
      .decodeFromVideoDevice(deviceId, videoEl, (scanResult) => {
        if (!scanResult || done) {
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
