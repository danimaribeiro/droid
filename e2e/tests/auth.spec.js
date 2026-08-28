import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/database/repl");
  });

  test("shows auth modal when clicking Run Tests while logged out", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-title"]')).toContainText("Welcome Back");
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    await page.fill("#auth-email", "admin@droid.dev");
    await page.fill("#auth-password", "admin");
    await page.click('[data-testid="auth-submit"]');

    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin");
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    await page.fill("#auth-email", "admin@droid.dev");
    await page.fill("#auth-password", "wrong");
    await page.click('[data-testid="auth-submit"]');

    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText("Invalid");
  });

  test("can switch to signup tab", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    await page.click('[data-testid="auth-tab-signup"]');
    await expect(page.locator('[data-testid="auth-title"]')).toContainText("Create Account");
    await expect(page.locator("#auth-name")).toBeVisible();
  });

  test("closes auth modal with X button", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    await page.click('[data-testid="auth-close"]');
    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();
  });

  test("closes auth modal by clicking overlay", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    await page.click('[data-testid="auth-overlay"]', { position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();
  });

  test("persists login across navigation", async ({ page, request }) => {
    // Inject token via API to avoid modal timing issues
    const res = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await res.json();
    await page.evaluate((t) => localStorage.setItem("droid_token", t), token);
    await page.reload();
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin", { timeout: 10000 });

    // Navigate away and back — wait for network idle so AuthProvider's
    // /me call completes before navigating away (abort would clear the token)
    await page.goto("/", { waitUntil: "networkidle" });
    await page.goto("/playground/database/repl");
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="pg-user-name"]')).toContainText("Admin", { timeout: 10000 });
  });
});
