import { test, expect } from "@playwright/test"
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers/auth"

/**
 * Auth flow tests — login, redirect, and logout.
 */

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    // Wait for client-side hydration
    await page.waitForSelector("form", { state: "visible" })
  })

  test("login page renders correct branding and form", async ({ page }) => {
    // The brand copy visible on the left panel (desktop viewport)
    await expect(page.locator("text=Immer wissen,")).toBeVisible()
    // Form fields present
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
    // Demo button
    await expect(page.locator("button", { hasText: /Demo testen/i })).toBeVisible()
  })

  test("demo login button signs in and redirects to dashboard", async ({ page }) => {
    const demoBtn = page.locator("button", { hasText: /Demo testen/i })
    await expect(demoBtn).toBeVisible()
    await demoBtn.click()

    // Should land on /dashboard after sign-in
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("manual email+password login redirects to dashboard", async ({ page }) => {
    await page.locator('input[type="email"], input[name="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"], input[name="password"]').fill(DEMO_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("unauthenticated access to /dashboard redirects to login", async ({ page }) => {
    // Navigate directly without signing in
    await page.goto("/dashboard")
    // Should be pushed back to /login by the auth guard
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
