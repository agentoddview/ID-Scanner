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
    await page.getByRole("button", { name: "AAMVA v08 Form" }).click();

    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Doe");
    await page.getByLabel("Date of birth").fill("1992-06-14");
    await page.getByLabel("Expiry date").fill("2030-09-01");
    await page.getByLabel("Document number").fill("X1234");
    await page.getByLabel("Issuer IIN (6 digits)").fill("636026");

    await page.getByRole("button", { name: "Generate SVG" }).click();

    await expect(page.locator(".svg-preview svg")).toBeVisible();
    await expect(page.locator("pre.payload-preview").first()).toContainText("ANSI 636026080102DL");
  });
});
