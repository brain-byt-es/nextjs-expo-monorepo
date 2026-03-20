import { test, expect } from "@playwright/test"
import { loginAsDemoUser } from "./helpers/auth"

/**
 * Sidebar navigation tests — clicking each link loads the expected page.
 *
 * Note: The SiteHeader always renders an h1 "Dashboard". Page-specific
 * headings are a second h1 inside the main content. We use the `href`
 * attribute on the sidebar anchor for reliable targeting, and filter h1/h2
 * elements for the expected text rather than relying on .first().
 */

const NAV_ITEMS = [
  {
    label: "Materialien",
    href: "/dashboard/materials",
    url: /\/dashboard\/materials/,
    heading: /Materialien/i,
  },
  {
    label: "Werkzeuge",
    href: "/dashboard/tools",
    url: /\/dashboard\/tools/,
    heading: /Werkzeuge/i,
  },
  {
    label: "Offene Bestellungen",
    href: "/dashboard/orders",
    url: /\/dashboard\/orders/,
    // orders page h1 is t("openPositions") = "Offene Bestellpositionen"
    heading: /Offene Bestell/i,
  },
  {
    label: "Einstellungen",
    href: "/dashboard/settings",
    url: /\/dashboard\/settings/,
    heading: /Einstellungen/i,
  },
] as const

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page)
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // Ensure sidebar is mounted
    await page.waitForSelector('[data-slot="sidebar"]', { state: "visible" })
  })

  for (const item of NAV_ITEMS) {
    test(`clicking "${item.label}" navigates to correct page`, async ({ page }) => {
      // Target the sidebar anchor directly by its href — most reliable selector
      const link = page.locator(`[data-slot="sidebar"] a[href="${item.href}"]`).first()
      await expect(link).toBeVisible({ timeout: 10_000 })
      await link.click()

      // Wait for URL to update — domcontentloaded is much faster in dev mode
      await page.waitForURL(item.url, { timeout: 20_000, waitUntil: "domcontentloaded" })
      await expect(page).toHaveURL(item.url)

      // The page-specific heading may be an h1 or h2, and there is always
      // a fixed SiteHeader h1 "Dashboard". Filter to find the right one.
      await expect(
        page.locator("h1, h2").filter({ hasText: item.heading }).first()
      ).toBeVisible({ timeout: 15_000 })
    })
  }

  test("clicking Übersicht link returns to dashboard root", async ({ page }) => {
    // Navigate away first
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" })

    const overviewLink = page.locator('[data-slot="sidebar"] a[href="/dashboard"]').first()
    await expect(overviewLink).toBeVisible({ timeout: 10_000 })
    await overviewLink.click()

    await page.waitForURL(/\/dashboard$/, { timeout: 20_000, waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
