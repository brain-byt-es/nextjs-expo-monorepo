import { test, expect } from "@playwright/test"

/**
 * Landing page (public — no auth required).
 * Validates hero, pricing section, and CTA presence.
 */

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    // Wait for the main content to be rendered (client component)
    await page.waitForSelector("main, section, footer", { state: "visible" })
  })

  test("page title contains Zentory", async ({ page }) => {
    await expect(page).toHaveTitle(/Zentory/i)
  })

  test("Zentory brand text is visible on the page", async ({ page }) => {
    await expect(page.locator("text=Zentory").first()).toBeVisible({ timeout: 10_000 })
  })

  test("pricing section is present on the page", async ({ page }) => {
    // The pricing section has id="pricing" and the heading "// 07 — Preise"
    // Wait for the section to be attached (React may re-render during animation)
    await page.waitForSelector("#pricing", { state: "attached", timeout: 15_000 })
    // Evaluate the scroll in-page to avoid Playwright detachment race
    await page.evaluate(() => {
      const el = document.getElementById("pricing")
      el?.scrollIntoView({ behavior: "instant" })
    })
    await expect(page.locator("#pricing")).toBeVisible({ timeout: 10_000 })
  })

  test('"Kostenlos starten" CTA button is visible', async ({ page }) => {
    // Multiple CTAs may exist; we just need at least one
    const cta = page.locator("a, button", { hasText: /Kostenlos starten/i }).first()
    await expect(cta).toBeVisible({ timeout: 10_000 })
  })

  test("hardware / peripherals section is visible", async ({ page }) => {
    // The hardware section contains text about Peripheriegeräte or NFC/Bluetooth
    const hardwareText = page.locator(
      "text=Peripheriegeräte, text=NFC, text=Bluetooth"
    ).first()
    await hardwareText.scrollIntoViewIfNeeded().catch(() => {})
    // We accept any one of these hardware-related terms
    const nfc = page.locator("text=NFC")
    const bluetooth = page.locator("text=Bluetooth")
    const hasHardware =
      (await nfc.count()) > 0 || (await bluetooth.count()) > 0
    expect(hasHardware).toBe(true)
  })

  test("navigation links to /login are present", async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible({ timeout: 10_000 })
  })

  test("navigation links to /signup are present", async ({ page }) => {
    const signupLink = page.locator('a[href="/signup"]').first()
    await expect(signupLink).toBeVisible({ timeout: 10_000 })
  })
})
