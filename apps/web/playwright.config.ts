import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright E2E configuration for Zentory web app.
 * Tests run against http://localhost:3003 (Next.js dev server).
 *
 * Run:  pnpm test:e2e
 * UI:   pnpm test:e2e --ui
 * Debug: pnpm test:e2e --debug
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // serial — avoids port/session conflicts during dev
  forbidOnly: !!process.env.CI,
  // 1 retry locally handles transient Next.js dev-server compilation delays.
  // CI gets 2 retries for heavier infra variance.
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "playwright-report/results.xml" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:3003",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Give pages extra time for hydration in a dev server
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    locale: "de-CH",
  },

  // Per-test timeout — generous for dev server cold starts
  timeout: 60_000,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start the Next.js dev server once before all tests */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: ".",
  },
})
