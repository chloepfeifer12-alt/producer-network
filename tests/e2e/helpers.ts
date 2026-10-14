import { expect, type Page } from "@playwright/test";

export const STORAGE_KEY = "producer-network:demo-db";

/** Loads the app once so the seeded demo database is persisted, then switches persona. */
export async function asPersona(page: Page, userId: string | null) {
  if (!page.url().startsWith("http")) await page.goto("/about");
  await page.waitForFunction((k) => !!localStorage.getItem(k), STORAGE_KEY);
  await page.evaluate(([k, id]) => {
    const s = JSON.parse(localStorage.getItem(k as string)!);
    s.state.sessionUserId = id;
    localStorage.setItem(k as string, JSON.stringify(s));
  }, [STORAGE_KEY, userId]);
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByRole("status").filter({ hasText: text }).first()).toBeVisible();
}
