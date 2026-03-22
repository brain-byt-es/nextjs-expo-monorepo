import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

/**
 * Demo credentials — the test account that ships with Zentory.
 * The demo sign-in path accepts any credentials in demo mode,
 * or uses the real Better-Auth endpoint when a database is configured.
 */
export const DEMO_EMAIL = "demo@zentory.ch"
export const DEMO_PASSWORD = "demo1234"

/**
 * Sign in via the login form and wait for the dashboard to load.
 * Fills email + password and submits.  Waits for navigation to /dashboard.
 */
export async function loginAsDemoUser(page: Page): Promise<void> {
  await page.goto("/login")

  // Wait for the login form to be visible (hydration guard)
  await page.waitForSelector("form", { state: "visible" })

  // Use the "Demo testen" shortcut button if available — faster and always works
  const demoBtn = page.locator("button", { hasText: /Demo testen/i })
  const demoVisible = await demoBtn.isVisible().catch(() => false)

  if (demoVisible) {
    await demoBtn.click()
  } else {
    // Fall back to manual email/password fill
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')

    await emailInput.fill(DEMO_EMAIL)
    await passwordInput.fill(DEMO_PASSWORD)
    await page.locator('button[type="submit"]').click()
  }

  // Wait for redirect to /dashboard — use domcontentloaded to avoid blocking
  // on slow network resources during Next.js dev-mode compilation.
  await page.waitForURL(/\/dashboard/, { timeout: 50_000, waitUntil: "domcontentloaded" })
  // Confirm page has loaded past any skeleton state
  await expect(page).toHaveURL(/\/dashboard/)
}
