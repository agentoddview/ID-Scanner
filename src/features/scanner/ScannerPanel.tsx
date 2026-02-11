import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toDataURL } from "qrcode";
import {
  decodeFromCameraFrame,
  ScanCancelledError,
  listCameraDevices,
  startCameraDecode,
  stopAllCameraStreams,
  type CameraDecodeSession,
} from "../../lib/scanner/pdf417Scanner";
import type { DecodeResult, DecodeStatus } from "../../types/barcode";

interface ScannerPanelProps {
  onDecoded: (result: DecodeResult) => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Camera decode failed.";
};

export function ScannerPanel({ onDecoded }: ScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<CameraDecodeSession | null>(null);
  const frameAssistInFlightRef = useRef(false);

  const [status, setStatus] = useState<DecodeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFrameAssistDecoding, setIsFrameAssistDecoding] = useState(false);
  const [phoneQrDataUrl, setPhoneQrDataUrl] = useState<string>("");
  const [phoneLinkCopied, setPhoneLinkCopied] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const isSecure = window.isSecureContext;
  const hasCameraApi = Boolean(navigator.mediaDevices?.getUserMedia);
  const phoneScannerLink = useMemo(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("mobile", "1");
    nextUrl.hash = "scanner";
    return nextUrl.toString();
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const found = await listCameraDevices();
      setDevices(found);

      setSelectedDeviceId((current) => current || found[0]?.deviceId || "");
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    const timer = window.setTimeout(() => {
      void loadDevices();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      sessionRef.current?.stop();
      sessionRef.current = null;
      stopAllCameraStreams(videoElement ?? undefined);
    };
  }, [loadDevices]);

  useEffect(() => {
    void toDataURL(phoneScannerLink, {
      width: 190,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl: string) => setPhoneQrDataUrl(dataUrl))
      .catch(() => setPhoneQrDataUrl(""));
  }, [phoneScannerLink]);

  const stopScan = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setStatus("paused");
  };

  const finalizeDecode = useCallback((result: DecodeResult) => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setStatus("paused");
    setError(null);
    onDecoded(result);
    void loadDevices();
  }, [onDecoded, loadDevices]);

  const ensureCameraPermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    stream?.getTracks?.().forEach((track) => track.stop());
  };

  const startScan = async () => {
    if (!videoRef.current) {
      return;
    }

    if (!isSecure) {
      setStatus("error");
      setError("Camera access requires HTTPS or localhost.");
      return;
    }

    if (!hasCameraApi) {
      setStatus("error");
      setError("This browser does not support camera access.");
      return;
    }

    setError(null);
    setStatus("requesting-permission");

    try {
      await ensureCameraPermission();
      await loadDevices();

      const session = await startCameraDecode(videoRef.current, selectedDeviceId || undefined);
      sessionRef.current = session;
      setStatus("scanning");

      const result = await session.result;

      if (sessionRef.current !== session) {
        return;
      }

      finalizeDecode(result);
    } catch (scanError) {
      if (scanError instanceof ScanCancelledError) {
        setStatus("paused");
        return;
      }

      sessionRef.current = null;
      setStatus("error");
      setError(getErrorMessage(scanError));
    }
  };

  const decodeCurrentFrame = useCallback(async (silent = false) => {
    if (!videoRef.current || frameAssistInFlightRef.current) {
      return;
    }

    frameAssistInFlightRef.current = true;
    setIsFrameAssistDecoding(true);
    if (!silent) {
      setError(null);
    }

    try {
      const result = await decodeFromCameraFrame(videoRef.current);
      finalizeDecode(result);
    } catch (frameError) {
      if (!silent) {
        setError(getErrorMessage(frameError));
      }
    } finally {
      frameAssistInFlightRef.current = false;
      setIsFrameAssistDecoding(false);
    }
  }, [finalizeDecode]);

  const copyPhoneLink = async () => {
    try {
      await navigator.clipboard.writeText(phoneScannerLink);
      setPhoneLinkCopied(true);
      window.setTimeout(() => setPhoneLinkCopied(false), 1300);
    } catch {
      setPhoneLinkCopied(false);
    }
  };

  useEffect(() => {
    if (status !== "scanning") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      void decodeCurrentFrame(true);
    }, 950);

    return () => {
      window.clearInterval(interval);
    };
  }, [status, decodeCurrentFrame]);

  return (
    <section className="panel">
      <header className="panel-header panel-header-row">
        <h2>Live Camera Scan</h2>
        <button type="button" className="button button-secondary" onClick={loadDevices}>
          Refresh Cameras
        </button>
      </header>

      <div className="stack-row">
        <label className="field-label" htmlFor="camera-device-select">
          Camera
        </label>
        <select
          id="camera-device-select"
          value={selectedDeviceId}
          onChange={(event) => setSelectedDeviceId(event.target.value)}
          disabled={status === "scanning" || devices.length === 0}
        >
          {devices.length === 0 ? <option value="">No camera devices found</option> : null}
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div className="video-shell">
        <video ref={videoRef} className="preview-video" muted playsInline />
      </div>

      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={startScan}
          disabled={status === "scanning" || !isSecure || !hasCameraApi}
        >
          {status === "scanning" ? "Scanning..." : "Start / Resume Scan"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={stopScan}
          disabled={status !== "scanning"}
        >
          Stop
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            void decodeCurrentFrame(false);
          }}
          disabled={status !== "scanning" && status !== "paused"}
        >
          {isFrameAssistDecoding ? "Decoding Frame..." : "Decode Current Frame"}
        </button>
      </div>

      <p className="muted">
        Status: <strong>{status}</strong>
      </p>
      {status === "scanning" ? (
        <p className="muted">
          Hold the PDF417 steady inside the frame. If close focus is blurry, pull back slightly and use "Decode Current
          Frame".
        </p>
      ) : null}

      {!isSecure ? <p className="error-text">Camera scanning is disabled on non-secure origins.</p> : null}
      {!hasCameraApi ? <p className="error-text">Camera APIs are unavailable in this browser.</p> : null}
      {devices.length === 0 ? <p className="muted">No camera found. Use image upload as fallback.</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <details className="phone-camera-panel">
        <summary>Use Phone Camera (QR Quick Open)</summary>
        <p className="muted">
          Scan this QR with your phone to open the scanner on mobile quickly. Direct phone-to-desktop webcam relay is
          not native in browsers without extra software, but this gives a fast phone camera workflow.
        </p>
        {phoneQrDataUrl ? <img src={phoneQrDataUrl} alt="QR code for mobile scanner link" className="phone-qr" /> : null}
        <div className="button-row">
          <button type="button" className="button button-secondary" onClick={() => void copyPhoneLink()}>
            {phoneLinkCopied ? "Copied" : "Copy Phone Link"}
          </button>
          <a className="button button-secondary" href={phoneScannerLink} target="_blank" rel="noreferrer">
            Open Link
          </a>
        </div>
      </details>
    </section>
  );
}
