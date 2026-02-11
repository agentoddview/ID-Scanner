import { expect, test } from "@playwright/test";

test.describe("generator workflows", () => {
  test("creates an SVG from raw payload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Generator" }).click();

    await page.getByLabel("Raw payload").fill("PLAYWRIGHT-PDF417");
    await page.getByRole("button", { name: "Generate SVG" }).click();

    await expect(page.locator(".svg-preview svg")).toBeVisible();
  });

  test("creates an SVG from AAMVA form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Generator" }).click();
    await page.getByRole("button", { name: "Washington ID / DL (AAMVA v08)" }).click();

    await page.getByLabel(/DAC - Given name/i).fill("Jane");
    await page.getByLabel(/DCS - Family name/i).fill("Doe");
    await page.getByLabel(/DBB - Date of Birth/i).fill("1992-06-14");
    await page.getByLabel(/DBA - License Expiration Date/i).fill("2030-09-01");
    await page.getByLabel(/DAQ - Washington license or ID number/i).fill("X1234");
    await page.getByLabel(/Issuer IIN/i).fill("636026");

    await page.getByRole("button", { name: "Generate SVG" }).click();

    await expect(page.locator(".svg-preview svg")).toBeVisible();
    await expect(page.locator("pre.payload-preview").first()).toContainText("ANSI 636026080102DL");
  });
});
