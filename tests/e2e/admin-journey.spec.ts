import { test, expect } from "@playwright/test";
import { asPersona, expectToast } from "./helpers";

test("admin: approve organization, manage sponsored placement, reject misleading listing", async ({ page }) => {
  await asPersona(page, "u_admin");

  // 1. Approve a pending organization application.
  await page.goto("/admin/organizations/org_wrenfield");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("button", { name: "Approve & publish profile" }).click();
  await expectToast(page, /approved/i);

  // The newly approved organization is now publicly visible.
  await asPersona(page, null);
  await page.goto("/organizations/wrenfield-agency-partners");
  await expect(page.getByRole("heading", { level: 1, name: "Wrenfield Agency Partners" })).toBeVisible();

  // 2. Approve the pending sponsored placement request from Kestrelwood.
  await asPersona(page, "u_admin");
  await page.goto("/admin/sponsored");
  await page.getByRole("button", { name: /^Approve/ }).first().click();
  await expectToast(page, /./);

  // 3. Reject the listing that makes unsubstantiated income claims.
  await page.goto("/admin/opportunities?review=opp_velorum_flagged");
  const dialog = page.getByRole("dialog", { name: "Review listing" });
  await expect(dialog.getByText(/Six Figures/).first()).toBeVisible();
  await dialog.getByRole("radio", { name: "Reject" }).click();
  await dialog.getByRole("button", { name: /Reject listing/ }).click();
  await expectToast(page, /reject/i);

  // 4. The decision is recorded in the audit log.
  await page.goto("/admin/audit");
  await expect(page.getByText(/opportunity\.rejected|Listing rejected|rejected/i).first()).toBeVisible();
});
