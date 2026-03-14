import { test, expect } from "@playwright/test";

test.describe("Billing & Pricing", () => {
  test("pricing page renders with three plans", async ({ page }) => {
    await page.goto("/pricing");

    // Match plan names in card titles
    await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
  });

  test("pricing page shows plan prices", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("$29")).toBeVisible();
    await expect(page.getByText("$99")).toBeVisible();
  });

  test("pricing page has subscribe buttons", async ({ page }) => {
    await page.goto("/pricing");

    // Should have "Get Started" for free and "Subscribe Now" for paid
    await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Subscribe Now" }).first()).toBeVisible();
  });

  test("free plan button redirects to signup", async ({ page }) => {
    await page.goto("/pricing");

    await page.getByRole("button", { name: "Get Started" }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test("paid plan button redirects to signup if not logged in", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await page.getByRole("button", { name: "Subscribe Now" }).first().click();

    // Unauthenticated users should be redirected to signup
    await expect(page).toHaveURL(/\/signup/);
  });

  test("pricing page shows Most Popular badge", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("Most Popular")).toBeVisible();
  });

  test("pricing page has FAQ section", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByText("Frequently Asked Questions")
    ).toBeVisible();
    await expect(
      page.getByText("Can I upgrade or downgrade anytime?")
    ).toBeVisible();
  });
});
