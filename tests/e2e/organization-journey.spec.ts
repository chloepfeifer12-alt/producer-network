import { test, expect } from "@playwright/test";
import { asPersona, expectToast, STORAGE_KEY } from "./helpers";

test("organization: create opportunity → receive application → review → move pipeline", async ({ page }) => {
  // 1. Kestrelwood recruiter creates and publishes an opportunity.
  await asPersona(page, "u_daniel");
  await page.goto("/org/opportunities/new");
  await page.locator("#opp-title").fill("Small Commercial Account Manager");
  await page.getByRole("button", { name: "Commercial Insurance" }).first().click();
  await page.locator("#opp-state").selectOption("NC");
  await page.locator("#opp-comp-notes").fill("Salaried W-2 role with benefits; terms confirmed in a written offer.");
  await page.locator("#opp-summary").fill("Manage renewals and service for a book of small commercial clients in Charlotte.");
  await page.locator("#opp-desc").fill("Partner with producers on renewals, marketing submissions and service for small business clients across the Carolinas.");
  await page.getByRole("button", { name: "+ Add responsibility" }).click();
  await page.getByRole("textbox", { name: "Item 1" }).first().fill("Manage renewals for an assigned book.");
  await page.getByRole("button", { name: "+ Add requirement" }).click();
  await page.getByRole("textbox", { name: "Item 1" }).nth(1).fill("Property & casualty license.");
  await page.getByRole("button", { name: /Save & publish/ }).first().click();
  await expectToast(page, /Published/i);

  const slug = await page.evaluate((k) => {
    const db = JSON.parse(localStorage.getItem(k)!).state.db;
    return db.opportunities.find((o: { title: string }) => o.title === "Small Commercial Account Manager").slug as string;
  }, STORAGE_KEY);

  // 2. Jordan (newly licensed producer) finds it and applies.
  await asPersona(page, "u_jordan");
  await page.goto(`/opportunities/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name: "Small Commercial Account Manager" })).toBeVisible();
  await page.getByRole("button", { name: /Apply now/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Apply to this opportunity" });
  await dialog.locator("#apply-note").fill("Newly licensed and eager to learn small commercial with a strong service team.");
  await dialog.getByText("Contact email").click();
  await dialog.getByText(/I understand my selected profile information/).click();
  await dialog.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("dialog", { name: "Application submitted" })).toBeVisible();

  // 3. Back as the recruiter: the application is in the pipeline; change its stage.
  await asPersona(page, "u_daniel");
  await page.goto("/org/pipeline");
  await page.getByLabel("Stage for Jordan Reyes").first().selectOption("under_review");
  await expectToast(page, /Under Review/);

  // 4. Open the review page, move to interview, leave an internal note.
  const appId = await page.evaluate((k) => {
    const db = JSON.parse(localStorage.getItem(k)!).state.db;
    return db.applications.find((a: { applicantId: string; orgId: string }) => a.applicantId === "u_jordan" && a.orgId === "org_kestrelwood").id as string;
  }, STORAGE_KEY);
  await page.goto(`/org/applications/${appId}`);
  await expect(page.getByText("Shared with consent").first()).toBeVisible();
  await page.getByRole("button", { name: /Move to Interview/ }).first().click();
  await expectToast(page, /Interview/);

  // 5. The producer sees the update in My jobs.
  await asPersona(page, "u_jordan");
  await page.goto(`/me/applications/${appId}`);
  await expect(page.getByText("Interviewing").first()).toBeVisible();
});

test("consent: recruiters only see shared fields (NPN hidden when not shared)", async ({ page }) => {
  await asPersona(page, "u_daniel");
  // Marcus applied with NPN not shared.
  await page.goto("/org/applications/app_5");
  await expect(page.getByText(/NPN was not shared/).first()).toBeVisible();
});
