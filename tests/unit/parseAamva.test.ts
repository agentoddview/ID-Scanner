import { describe, expect, it } from "vitest";
import { parseAamva } from "../../src/lib/aamva/parseAamva";
import { SAMPLE_AAMVA } from "./fixtures";

describe("parseAamva", () => {
  it("parses a valid AAMVA payload", () => {
    const parsed = parseAamva(SAMPLE_AAMVA);

    expect(parsed.isLikelyAamva).toBe(true);
    expect(parsed.version).toBe("08");
    expect(parsed.fields.firstName).toBe("JOHN");
    expect(parsed.fields.lastName).toBe("PUBLIC");
    expect(parsed.warnings).toEqual([]);
  });

  it("returns warnings for non-AAMVA payloads", () => {
    const parsed = parseAamva("HELLO WORLD");

    expect(parsed.isLikelyAamva).toBe(false);
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it("handles partial payloads without throwing", () => {
    const parsed = parseAamva("@\nANSI 636000080102DL\nDAQA123\nDCSDOE\n");

    expect(parsed.isLikelyAamva).toBe(true);
    expect(parsed.fields.lastName).toBe("DOE");
  });
});
