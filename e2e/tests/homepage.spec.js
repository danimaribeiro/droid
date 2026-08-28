import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and displays the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Build the Engine");
    await expect(page.locator(".hero-tagline")).toBeVisible();
  });

  test("shows supported languages", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".chip-c")).toContainText("C");
    await expect(page.locator(".chip-cpp")).toContainText("C++");
    await expect(page.locator(".chip-rust")).toContainText("Rust");
    await expect(page.locator(".chip-zig")).toContainText("Zig");
  });

  test("shows curriculum roadmap with Part 1 ready", async ({ page }) => {
    await page.goto("/");

    const part1Card = page.locator(".roadmap-card").first();
    await expect(part1Card).toContainText("Part 1");
    await expect(part1Card).toContainText("READY");
  });

  test("navigates to Stage 1 from hero CTA", async ({ page }) => {
    await page.goto("/");

    await page.click('a:has-text("Start Part 1 Tutorial")');
    await expect(page).toHaveURL(/stages\/stage1-repl/);
  });
});
