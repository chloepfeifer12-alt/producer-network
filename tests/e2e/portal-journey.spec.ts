import { test, expect } from "@playwright/test";
import { asPersona, expectToast } from "./helpers";

test("new producer portal: express interest in several companies → employer responds", async ({ page }) => {
  await asPersona(page, "u_jordan");
  await page.goto("/launch");
  await page.getByRole("button", { name: /I'm interested/ }).nth(0).click();
  await page.getByRole("button", { name: /I'm interested/ }).nth(0).click();
  await page.getByRole("button", { name: /Express interest/ }).click();
  const dialog = page.getByRole("dialog", { name: "Introduce yourself" });
  await dialog.getByText(/I understand the selected information/).click();
  await dialog.getByRole("button", { name: "Send introductions" }).click();
  await expect(page.getByRole("dialog", { name: "Your introductions are on their way" })).toBeVisible();
  await page.getByRole("button", { name: "Back to the portal" }).click();
  await expect(page.getByText("Companies you've reached out to")).toBeVisible();

  // Express interest in Kestrelwood specifically, then respond as Kestrelwood.
  await page.goto("/launch");
  const kw = page.locator("article", { hasText: "Kestrelwood Insurance Partners" });
  await kw.getByRole("button", { name: /I'm interested/ }).click();
  await page.getByRole("button", { name: /Express interest/ }).click();
  await page.getByRole("dialog").getByText(/I understand the selected information/).click();
  await page.getByRole("button", { name: "Send introductions" }).click();

  await asPersona(page, "u_daniel");
  await page.goto("/org/portal");
  const card = page.locator("div", { hasText: "Jordan Reyes" }).filter({ has: page.getByRole("button", { name: "Respond" }) }).last();
  await card.getByRole("button", { name: "Respond" }).click();
  await expectToast(page, /notified/);

  await asPersona(page, "u_jordan");
  await page.goto("/launch");
  await expect(page.getByText("Company responded").first()).toBeVisible();
});
