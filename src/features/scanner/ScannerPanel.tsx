import { useCallback, useEffect, useRef, useState } from "react";
import {
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

  const [status, setStatus] = useState<DecodeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const isSecure = window.isSecureContext;
  const hasCameraApi = Boolean(navigator.mediaDevices?.getUserMedia);

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

  const stopScan = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setStatus("paused");
  };

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

      sessionRef.current = null;
      setStatus("paused");
      onDecoded(result);
      void loadDevices();
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
      </div>

      <p className="muted">
        Status: <strong>{status}</strong>
      </p>
      {status === "scanning" ? (
        <p className="muted">Hold the PDF417 steady inside the frame. The scanner auto-pauses on the first match.</p>
      ) : null}

      {!isSecure ? <p className="error-text">Camera scanning is disabled on non-secure origins.</p> : null}
      {!hasCameraApi ? <p className="error-text">Camera APIs are unavailable in this browser.</p> : null}
      {devices.length === 0 ? <p className="muted">No camera found. Use image upload as fallback.</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
