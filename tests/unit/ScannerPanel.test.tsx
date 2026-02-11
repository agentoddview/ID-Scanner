import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScannerPanel } from "../../src/features/scanner/ScannerPanel";
import type { DecodeResult } from "../../src/types/barcode";

const mocks = vi.hoisted(() => ({
  listCameraDevicesMock: vi.fn(),
  startCameraDecodeMock: vi.fn(),
  stopAllCameraStreamsMock: vi.fn(),
}));

vi.mock("../../src/lib/scanner/pdf417Scanner", () => ({
  ScanCancelledError: class extends Error {},
  listCameraDevices: mocks.listCameraDevicesMock,
  startCameraDecode: mocks.startCameraDecodeMock,
  stopAllCameraStreams: mocks.stopAllCameraStreamsMock,
}));

describe("ScannerPanel", () => {
  beforeEach(() => {
    mocks.listCameraDevicesMock.mockReset();
    mocks.startCameraDecodeMock.mockReset();
    mocks.stopAllCameraStreamsMock.mockReset();

    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
  });

  it("moves through scan states and emits decoded result", async () => {
    mocks.listCameraDevicesMock.mockResolvedValue([{ kind: "videoinput", deviceId: "cam-1", label: "Cam 1" }]);

    let resolveResult: ((value: DecodeResult) => void) | null = null;
    const resultPromise = new Promise<DecodeResult>((resolve) => {
      resolveResult = resolve;
    });

    mocks.startCameraDecodeMock.mockResolvedValue({
      result: resultPromise,
      stop: vi.fn(),
    });

    const onDecoded = vi.fn();
    render(<ScannerPanel onDecoded={onDecoded} />);

    await waitFor(() => {
      expect(screen.getByText(/status:/i)).toHaveTextContent("idle");
    });

    fireEvent.click(screen.getByRole("button", { name: /start \/ resume scan/i }));
    await waitFor(() => {
      expect(screen.getByText(/status:/i)).toHaveTextContent("scanning");
    });

    await act(async () => {
      resolveResult?.({
        rawText: "RESULT-123",
        format: "PDF_417",
        source: "camera",
        timestampIso: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(onDecoded).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/status:/i)).toHaveTextContent("paused");
    });
  });

  it("shows fallback messaging when no camera devices exist", async () => {
    mocks.listCameraDevicesMock.mockResolvedValue([]);

    render(<ScannerPanel onDecoded={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no camera found/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /start \/ resume scan/i })).toBeDisabled();
  });

  it("shows decode errors from camera startup", async () => {
    mocks.listCameraDevicesMock.mockResolvedValue([{ kind: "videoinput", deviceId: "cam-1", label: "Cam 1" }]);
    mocks.startCameraDecodeMock.mockRejectedValue(new Error("Permission denied"));

    render(<ScannerPanel onDecoded={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start \/ resume scan/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /start \/ resume scan/i }));

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
      expect(screen.getByText(/status:/i)).toHaveTextContent("error");
    });
  });
});
