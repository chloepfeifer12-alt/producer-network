import { defineConfig, devices } from "@playwright/test";

/**
 * Functional smoke tests for the prototype.
 * Runs against a production build (`npm run build` first) on port 3200.
 * Set PW_CHROMIUM_PATH to use a pre-installed Chromium binary.
 */
const PORT = Number(process.env.PW_PORT ?? 3200);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
