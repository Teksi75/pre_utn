import { test, expect } from "@playwright/test";

/**
 * Placeholder sanity spec.
 *
 * Real specs land in PR2 (canary) through PR4b. This file exists so that
 * `pnpm test:e2e` boots Playwright against the production server without
 * crashing on an empty test directory, and so the webServer / config /
 * Chromium install are proven end-to-end before any flow logic is
 * exercised. It will be REMOVED in PR2 (the canary replaces it).
 */
test("placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ingenium/);
});
