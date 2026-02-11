import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  decodeFromConstraintsMock: vi.fn(),
  listVideoInputDevicesMock: vi.fn(),
  releaseAllStreamsMock: vi.fn(),
  cleanVideoSourceMock: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserPDF417Reader: class {
    decodeFromConstraints = mocks.decodeFromConstraintsMock;
  },
  BrowserCodeReader: {
    listVideoInputDevices: mocks.listVideoInputDevicesMock,
    releaseAllStreams: mocks.releaseAllStreamsMock,
    cleanVideoSource: mocks.cleanVideoSourceMock,
  },
}));

import {
  ScanCancelledError,
  decodeFromCamera,
  listCameraDevices,
  startCameraDecode,
  stopAllCameraStreams,
} from "../../src/lib/scanner/pdf417Scanner";

describe("pdf417Scanner adapters", () => {
  beforeEach(() => {
    mocks.decodeFromConstraintsMock.mockReset();
    mocks.listVideoInputDevicesMock.mockReset();
    mocks.releaseAllStreamsMock.mockReset();
    mocks.cleanVideoSourceMock.mockReset();
  });

  it("decodes from camera and maps the result", async () => {
    mocks.decodeFromConstraintsMock.mockImplementation(async (_constraints, _video, callback) => {
      const controls = { stop: vi.fn() };
      setTimeout(() => {
        callback({ getText: () => "PDF417-OK" });
      }, 0);
      return controls;
    });

    const video = document.createElement("video");
    const result = await decodeFromCamera(video, "camera-1");

    expect(result.rawText).toBe("PDF417-OK");
    expect(result.source).toBe("camera");
    expect(result.format).toBe("PDF_417");
  });

  it("can stop a running scan session", async () => {
    mocks.decodeFromConstraintsMock.mockResolvedValue({ stop: vi.fn() });

    const video = document.createElement("video");
    const session = await startCameraDecode(video, "camera-1");
    session.stop();

    await expect(session.result).rejects.toBeInstanceOf(ScanCancelledError);
  });

  it("lists only video devices", async () => {
    mocks.listVideoInputDevicesMock.mockResolvedValue([
      { kind: "audioinput", deviceId: "a", label: "Mic" },
      { kind: "videoinput", deviceId: "b", label: "Front Cam" },
    ]);

    const devices = await listCameraDevices();

    expect(devices).toHaveLength(1);
    expect(devices[0].kind).toBe("videoinput");
  });

  it("stops and cleans video streams", () => {
    const video = document.createElement("video");
    stopAllCameraStreams(video);

    expect(mocks.releaseAllStreamsMock).toHaveBeenCalledTimes(1);
    expect(mocks.cleanVideoSourceMock).toHaveBeenCalledWith(video);
  });
});
