import { test, expect } from "@playwright/test"
import { loginAsDemoUser } from "./helpers/auth"

/**
 * Materials page tests — table, add button, search, navigation to new material.
 */

test.describe("Materialien", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page)
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" })
  })

  test("materials page heading is visible", async ({ page }) => {
    // The SiteHeader renders a fixed h1 "Dashboard". The page-specific h1
    // with "Materialien" is rendered inside the main content area.
    // Match any h1/h2 on the page that contains the expected text.
    await expect(
      page.locator("h1, h2").filter({ hasText: /Materialien/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('"Material hinzufügen" button is visible', async ({ page }) => {
    // This button text comes from t("addMaterial") = "Material hinzufügen"
    await expect(
      page.locator("button", { hasText: /Material hinzufügen/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test("search input is present and accepts text", async ({ page }) => {
    // The search placeholder includes "such" (case-insensitive)
    const searchInput = page.locator('input[placeholder*="such" i], input[placeholder*="Search" i]')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill("Test")
    await expect(searchInput).toHaveValue("Test")
  })

  test("materials table or empty state is rendered", async ({ page }) => {
    // Either a table with rows or an empty-state message should appear
    await page.waitForSelector("table, [data-empty-state]", { timeout: 15_000 })
    const table = page.locator("table")
    const isEmpty = await table.isVisible().catch(() => false)
    if (isEmpty) {
      // Table headers should be present even when there is no data
      await expect(page.locator("thead")).toBeVisible()
    } else {
      // Empty state renders some placeholder text
      await expect(page.locator("main, [role='main']")).toBeVisible()
    }
  })

  test('"Material hinzufügen" button navigates to new material form', async ({ page }) => {
    await page.locator("button", { hasText: /Material hinzufügen/i }).click()
    await page.waitForURL(/\/dashboard\/materials\/new/, { timeout: 20_000, waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/dashboard\/materials\/new/)
  })
})
