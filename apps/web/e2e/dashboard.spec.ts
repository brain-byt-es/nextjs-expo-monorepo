import { test, expect } from "@playwright/test"
import { loginAsDemoUser } from "./helpers/auth"

/**
 * Dashboard tests — stat cards, sidebar, search/command palette.
 */

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page)
    // Allow any pending React hydration to settle
    await page.waitForLoadState("domcontentloaded")
  })

  test("dashboard page loads with sidebar visible", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // Sidebar nav wrapper rendered by AppSidebar
    await expect(page.locator('[data-slot="sidebar"]')).toBeVisible()
  })

  test("sidebar contains Materialien and Werkzeuge navigation links", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // These translations come from nav.materials / nav.tools in de.json
    await expect(page.locator('[data-slot="sidebar"]').locator("text=Materialien")).toBeVisible()
    await expect(page.locator('[data-slot="sidebar"]').locator("text=Werkzeuge")).toBeVisible()
  })

  test("dashboard stat cards are rendered", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // The dashboard page renders widget cards — wait for at least one card element
    await page.waitForSelector('[class*="card"], [data-widget]', { timeout: 15_000 })
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible()
  })

  test("command palette opens with keyboard shortcut", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // Trigger the command palette (Cmd+K / Ctrl+K)
    await page.keyboard.press("Meta+k")
    // Palette dialog or input should appear
    await expect(
      page.locator('[role="dialog"], [cmdk-root], input[placeholder*="such"], input[placeholder*="Such"]').first()
    ).toBeVisible({ timeout: 5_000 })
  })
})
