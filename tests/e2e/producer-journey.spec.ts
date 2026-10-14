import { test, expect } from "@playwright/test";
import { asPersona, expectToast } from "./helpers";

test("producer: create profile → browse orgs → save → apply → track", async ({ page }) => {
  // 1. Create a brand-new member account through the Join wizard.
  await page.goto("/join");
  await page.getByText("I’m a licensed insurance or financial professional").click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#j-name").fill("Taylor Demo");
  await page.locator("#j-headline").fill("Personal lines producer exploring commercial");
  await page.locator("#j-state").selectOption("NC");
  await page.locator("#j-exp").selectOption({ index: 2 });
  await page.locator("#j-years").fill("2");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "Commercial Insurance" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("checkbox", { name: /I acknowledge the placeholder/ }).check({ force: true });
  await page.getByRole("button", { name: "Create my profile" }).click();
  await expect(page).toHaveURL(/\/me\/profile/);
  await expect(page.getByText("Taylor Demo").first()).toBeVisible();

  // 2. Browse the company directory and open a company profile.
  await page.goto("/organizations");
  await page.getByRole("link", { name: "Kestrelwood Insurance Partners" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Kestrelwood Insurance Partners" })).toBeVisible();

  // 3. Save an opportunity.
  await page.goto("/opportunities/commercial-lines-producer-construction-kestrelwood");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expectToast(page, "Saved");

  // 4. Apply with explicit consent.
  await page.getByRole("button", { name: /Apply now/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Apply to this opportunity" });
  await dialog.locator("#apply-note").fill("Two years in personal lines; I'd love to grow into construction accounts with your pod model.");
  await dialog.getByText("Contact email").click();
  await dialog.getByText(/I understand my selected profile information/).click();
  await dialog.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("dialog", { name: "Application submitted" })).toBeVisible();

  // 5. Track it in My jobs.
  await page.goto("/me/applications?tab=applied");
  await expect(page.getByText("Commercial Lines Producer — Construction Practice").first()).toBeVisible();
  await page.goto("/me/applications?tab=saved");
  await expect(page.getByText("Commercial Lines Producer — Construction Practice").first()).toBeVisible();
});

test("access control: producer cannot open the admin console or org workspace", async ({ page }) => {
  await asPersona(page, "u_maya");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /admin console isn't available/i })).toBeVisible();
  await page.goto("/org");
  await expect(page.getByRole("heading", { name: /recruiting workspace isn't available/i })).toBeVisible();
});

test("licenses are always self-reported, never verified", async ({ page }) => {
  await asPersona(page, "u_maya");
  await page.goto("/me/profile");
  await expect(page.getByText("Self-reported — Not verified").first()).toBeVisible();
  await expect(page.getByText(/\bVerified\b/)).toHaveCount(0);
});
