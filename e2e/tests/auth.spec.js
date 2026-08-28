import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/database/repl");
  });

  test("shows auth modal when clicking Run Tests while logged out", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();
    await expect(page.locator(".auth-modal-title")).toContainText("Welcome Back");
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();

    await page.fill("#auth-email", "admin@droid.dev");
    await page.fill("#auth-password", "admin");
    await page.click(".auth-submit-btn");

    await expect(page.locator(".auth-modal")).not.toBeVisible();
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin");
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();

    await page.fill("#auth-email", "admin@droid.dev");
    await page.fill("#auth-password", "wrong");
    await page.click(".auth-submit-btn");

    await expect(page.locator(".auth-error")).toBeVisible();
    await expect(page.locator(".auth-error")).toContainText("Invalid");
  });

  test("can switch to signup tab", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();

    await page.click('.auth-tab:has-text("Sign Up")');
    await expect(page.locator(".auth-modal-title")).toContainText("Create Account");
    await expect(page.locator("#auth-name")).toBeVisible();
  });

  test("closes auth modal with X button", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();

    await page.click(".auth-modal-close");
    await expect(page.locator(".auth-modal")).not.toBeVisible();
  });

  test("closes auth modal by clicking overlay", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator(".auth-modal")).toBeVisible();

    await page.click(".auth-modal-overlay", { position: { x: 10, y: 10 } });
    await expect(page.locator(".auth-modal")).not.toBeVisible();
  });

  test("persists login across navigation", async ({ page }) => {
    // Log in
    await page.click('[data-testid="pg-submit-btn"]');
    await page.fill("#auth-email", "admin@droid.dev");
    await page.fill("#auth-password", "admin");
    await page.click(".auth-submit-btn");
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin");

    // Navigate away and back
    await page.goto("/");
    await page.goto("/playground/database/repl");
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin");
  });
});
