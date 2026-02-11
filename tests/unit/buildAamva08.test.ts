import { describe, expect, it } from "vitest";
import { buildAamva08Payload } from "../../src/lib/aamva/buildAamva08";

describe("buildAamva08Payload", () => {
  it("builds a v08 payload with required fields", () => {
    const payload = buildAamva08Payload({
      firstName: "Jane",
      lastName: "Doe",
      dob: "1992-06-14",
      expiry: "2030-09-01",
      documentNumber: "X1234",
      issuerIIN: "636026",
      jurisdictionCode: "NY",
      city: "Albany",
      address1: "12 Main St",
      postalCode: "12207",
      sex: "F",
    });

    expect(payload).toContain("ANSI 636026080102DL");
    expect(payload).toContain("DACJANE");
    expect(payload).toContain("DCSDOE");
    expect(payload).toContain("DBB06141992");
    expect(payload).toContain("DBA09012030");
    expect(payload).toContain("DBC2");
  });

  it("throws on missing required fields", () => {
    expect(() =>
      buildAamva08Payload({
        firstName: "",
        lastName: "Doe",
        dob: "1992-06-14",
        expiry: "2030-09-01",
        documentNumber: "X1234",
        issuerIIN: "636026",
      }),
    ).toThrow("First name is required");
  });

  it("throws when issuer IIN is not six digits", () => {
    expect(() =>
      buildAamva08Payload({
        firstName: "Jane",
        lastName: "Doe",
        dob: "1992-06-14",
        expiry: "2030-09-01",
        documentNumber: "X1234",
        issuerIIN: "ABC123",
      }),
    ).toThrow("Issuer IIN must be exactly 6 digits");
  });
});
