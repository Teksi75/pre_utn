import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for the challenge-smoke-e2e suite.
 *
 * Conventions (see tests/e2e/README.md + design.md D3):
 * - Specs live in tests/e2e/ and use the *.spec.ts extension so they are
 *   NOT picked up by vitest (vitest.config.ts includes *.test.ts only).
 * - Chromium-only MVP (design.md D5): multi-browser can be added later.
 * - The webServer boots the production bundle (`pnpm start`) on a
 *   non-default port (3100) to avoid clashing with a developer's
 *   `pnpm dev` on 3000 (design.md D4).
 * - This is a manual command (`pnpm test:e2e`); CI wiring is a separate
 *   change and intentionally out of scope.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  // Only pick up *.spec.ts files. Playwright's default testMatch also
  // grabs *.test.ts, which would make it try to load the vitest
  // companions under tests/e2e/fixtures/__tests__/*.test.ts (they import
  // from "vitest" and crash under Playwright's CommonJS require). This
  // completes design.md D3 on the Playwright side — vitest.config.ts
  // already restricts vitest to *.test.ts on its side.
  testMatch: "**/*.spec.ts",
  // Sequential for the MVP: the suite drives a single production server
  // and mutates localStorage per spec. Parallelism can be revisited once
  // per-spec storage isolation is proven stable.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Single worker keeps server load predictable and makes failures easier
  // to attribute to a single spec during the MVP.
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
