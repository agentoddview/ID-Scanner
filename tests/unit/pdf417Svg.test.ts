import { describe, expect, it } from "vitest";
import { generatePdf417Svg } from "../../src/lib/generator/pdf417Svg";

describe("generatePdf417Svg", () => {
  it("returns non-empty SVG markup", () => {
    const svg = generatePdf417Svg({
      payload: "TEST-123456",
      scale: 3,
      height: 9,
      padding: 8,
      includetext: false,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg.length).toBeGreaterThan(100);
  });

  it("throws for empty payload", () => {
    expect(() =>
      generatePdf417Svg({
        payload: "",
        scale: 3,
        height: 9,
        padding: 8,
        includetext: false,
      }),
    ).toThrow("Payload is required");
  });
});
