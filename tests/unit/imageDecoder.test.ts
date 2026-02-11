import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  decodeFromImageUrlMock: vi.fn(),
  heic2anyMock: vi.fn(),
  createObjectUrlMock: vi.fn(),
  revokeObjectUrlMock: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserPDF417Reader: class {
    decodeFromImageUrl = mocks.decodeFromImageUrlMock;
  },
}));

vi.mock("heic2any", () => ({
  default: mocks.heic2anyMock,
}));

import { decodeFromImage } from "../../src/lib/scanner/imageDecoder";

describe("decodeFromImage", () => {
  beforeEach(() => {
    mocks.decodeFromImageUrlMock.mockReset();
    mocks.heic2anyMock.mockReset();
    mocks.createObjectUrlMock.mockReset();
    mocks.revokeObjectUrlMock.mockReset();

    mocks.createObjectUrlMock.mockReturnValue("blob:mock-url");

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: mocks.createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: mocks.revokeObjectUrlMock,
    });
  });

  it("decodes non-HEIC uploads directly", async () => {
    mocks.decodeFromImageUrlMock.mockResolvedValue({ getText: () => "PDF417-PNG" });

    const file = new File(["png"], "sample.png", { type: "image/png" });
    const result = await decodeFromImage(file);

    expect(mocks.heic2anyMock).not.toHaveBeenCalled();
    expect(mocks.createObjectUrlMock).toHaveBeenCalledWith(file);
    expect(result.rawText).toBe("PDF417-PNG");
    expect(result.source).toBe("image-upload");
  });

  it("converts HEIC uploads before decoding", async () => {
    const converted = new Blob(["jpeg"], { type: "image/jpeg" });
    mocks.heic2anyMock.mockResolvedValue(converted);
    mocks.decodeFromImageUrlMock.mockResolvedValue({ getText: () => "PDF417-HEIC" });

    const file = new File(["heic"], "sample.heic", { type: "image/heic" });
    const result = await decodeFromImage(file);

    expect(mocks.heic2anyMock).toHaveBeenCalledTimes(1);
    expect(mocks.createObjectUrlMock).toHaveBeenCalledWith(converted);
    expect(result.rawText).toBe("PDF417-HEIC");
  });
});
