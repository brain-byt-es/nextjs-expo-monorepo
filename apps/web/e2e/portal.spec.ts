import { test, expect } from "@playwright/test"

/**
 * Public portal / scan routes — no auth required.
 * These pages are publicly accessible via QR codes on physical items.
 */

test.describe("Public Portal & Scan Routes", () => {
  test("scan/location with a fake id returns a valid HTTP response (no crash)", async ({
    page,
  }) => {
    const response = await page.goto("/scan/location/fake-test-id-000", {
      waitUntil: "domcontentloaded",
    })

    // The page must not return 500 — either render the location view or a 404
    const status = response?.status() ?? 200
    expect(status).not.toBe(500)
    expect(status).not.toBe(503)

    // Page body must be present regardless of outcome
    await expect(page.locator("body")).toBeVisible()
  })

  test("scan/location renders location detail or a not-found message", async ({ page }) => {
    await page.goto("/scan/location/fake-test-id-000", {
      waitUntil: "load",
      timeout: 20_000,
    })

    // Expect one of: a location detail page, a 404 page, or a redirect to login
    // but not an unhandled error or blank screen.
    // Wait for at least one visible element in the DOM.
    await expect(page.locator("body")).toBeVisible()
    // The page should contain some rendered content (HTML elements beyond body)
    const elementCount = await page.locator("body > *").count()
    expect(elementCount).toBeGreaterThan(0)
  })

  test("/s shortlink prefix does not crash", async ({ page }) => {
    const response = await page.goto("/s/nonexistent-id", {
      waitUntil: "domcontentloaded",
    })
    const status = response?.status() ?? 200
    expect(status).not.toBe(500)
    await expect(page.locator("body")).toBeVisible()
  })
})
