import { test, expect } from "@playwright/test";
import { asPersona, expectToast } from "./helpers";

test("members land on their Network headquarters", async ({ page }) => {
  await asPersona(page, "u_maya");
  await page.goto("/");
  await expect(page).toHaveURL(/\/network$/);
  await expect(page.getByRole("heading", { level: 1, name: /Maya/ })).toBeVisible();
});

test("old member-directory links redirect to People", async ({ page }) => {
  await page.goto("/network/members/u_grace");
  await expect(page).toHaveURL(/\/people\/u_grace$/);
  await expect(page.getByRole("heading", { level: 1, name: "Grace Whitaker" })).toBeVisible();
});

test("Discover: follow an organization", async ({ page }) => {
  await asPersona(page, "u_jordan");
  await page.goto("/organizations/kestrelwood-insurance-partners");
  await page.getByRole("button", { name: /^Follow/ }).first().click();
  await expectToast(page, "Following Kestrelwood Insurance Partners");
  await expect(page.getByRole("button", { name: /Following/ }).first()).toBeVisible();
});

test("People: request mentorship from a mentor", async ({ page }) => {
  await asPersona(page, "u_jordan");
  await page.goto("/people/u_grace");
  await page.getByRole("button", { name: /Request mentorship/ }).first().click();
  const dialog = page.getByRole("dialog", { name: /Ask Grace for mentorship/ });
  await dialog.getByRole("textbox").fill("I'm newly licensed and want advice on choosing an agency with real training.");
  await dialog.getByRole("button", { name: /Send request/ }).click();
  await expectToast(page, /request/i);
});

test("The Insider: open a story from the front page", async ({ page }) => {
  await page.goto("/insider");
  await expect(page.getByRole("heading", { level: 1, name: "The Insider" })).toBeVisible();
  await page.goto("/insider/the-second-no");
  await expect(page.getByRole("heading", { level: 1, name: /The second “no”/ })).toBeVisible();
  await expect(page.getByText(/fictional/i).first()).toBeVisible();
});

test("Your Industry Fit: answer questions, see explainable results, save", async ({ page }) => {
  await asPersona(page, "u_jordan");
  await page.goto("/fit");
  await page.getByRole("button", { name: /^Start/ }).first().click();
  for (let i = 0; i < 14; i++) {
    const results = page.getByRole("button", { name: "See my results" });
    if (await results.isVisible().catch(() => false)) {
      await results.click();
      break;
    }
    const radios = page.getByRole("radio");
    if ((await radios.count()) > 0 && (await page.getByRole("radio", { checked: true }).count()) === 0) {
      await radios.first().click();
      await page.waitForTimeout(500);
      continue;
    }
    const lines = page.getByRole("button", { name: /Life Insurance/ });
    if ((await lines.count()) > 0 && (await page.locator('[aria-pressed="true"]').count()) === 0) await lines.first().click();
    await page.getByRole("button", { name: /^(Continue|Skip)/ }).last().click();
    await page.waitForTimeout(300);
  }
  await expect(page.getByText("Your fit profile").first()).toBeVisible();
  await expect(page.getByText(/not a probability/i).first()).toBeVisible();
  await page.getByRole("button", { name: /Save to my profile/ }).first().click();
  await expectToast(page, /saved/i);
});
