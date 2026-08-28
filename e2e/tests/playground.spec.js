import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Playground — Stage 1 (REPL)", () => {
  test.beforeEach(async ({ page, request }) => {
    // Log in via API and inject token into localStorage before navigating
    const res = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await res.json();

    await page.goto("/playground/database/repl");
    await page.evaluate((t) => localStorage.setItem("droid_token", t), token);
    await page.reload();
    await expect(page.locator(".pg-user-name")).toBeVisible();
  });

  test("loads playground with editor and file sidebar", async ({ page }) => {
    await expect(page.locator(".pg-topbar")).toBeVisible();
    await expect(page.locator(".pg-sidebar")).toBeVisible();
    await expect(page.locator(".pg-editor-pane")).toBeVisible();

    // Should have file tabs
    const tabs = page.locator(".pg-tab");
    await expect(tabs.first()).toBeVisible();
  });

  test("displays correct stage in breadcrumb", async ({ page }) => {
    await expect(page.locator(".pg-topbar-stage")).toContainText("Database");
  });

  test("loads C template files by default", async ({ page }) => {
    const fileItems = page.locator(".pg-file-item");
    await expect(fileItems.first()).toBeVisible();

    // C template should have .c files
    const firstFile = await fileItems.first().textContent();
    expect(firstFile).toMatch(/\.(c|h)$/);
  });

  test("can switch between languages", async ({ page }) => {
    // Switch to Rust
    await page.click('.pg-lang-btn:has-text("Rust")');
    await expect(page.locator('.pg-lang-btn.active:has-text("Rust")')).toBeVisible();

    // File list should update to .rs files
    await expect(page.locator(".pg-file-item").first()).toBeVisible();
    const firstFile = await page.locator(".pg-file-item").first().textContent();
    expect(firstFile).toMatch(/\.(rs|toml)$/);

    // Switch to C++
    await page.click('.pg-lang-btn:has-text("C++")');
    await expect(page.locator('.pg-lang-btn.active:has-text("C++")')).toBeVisible();
    await expect(page.locator(".pg-file-item").first()).toBeVisible();
  });

  test("can click files to switch active editor tab", async ({ page }) => {
    const fileItems = page.locator(".pg-file-item");
    const count = await fileItems.count();

    if (count > 1) {
      const secondFileName = await fileItems.nth(1).textContent();
      await fileItems.nth(1).click();

      // The active tab should match the clicked file
      await expect(page.locator(".pg-tab.active")).toContainText(secondFileName.trim());
    }
  });

  test("Run Tests button is visible and enabled", async ({ page }) => {
    const submitBtn = page.locator(".pg-submit-btn");
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).toContainText("Run Tests");
  });

  test("submitting code shows progress steps", async ({ page }) => {
    await page.click(".pg-submit-btn");

    // Progress indicator should appear
    await expect(page.locator(".progress-steps")).toBeVisible({ timeout: 5000 });
  });

  test("submission completes and shows results panel", async ({ page }) => {
    await page.click(".pg-submit-btn");

    // Wait for results panel to appear (up to 60s for Piston execution)
    await expect(page.locator(".pg-results-panel")).toBeVisible({ timeout: 60000 });

    // Should show results banner with title
    await expect(page.locator(".pg-results-banner-title")).toBeVisible();

    // Should show either all-pass, has-fail, build-fail, or error banner
    const banner = page.locator(".pg-results-banner");
    await expect(banner).toBeVisible();
  });

  test("failed submission shows test case details", async ({ page }) => {
    await page.click(".pg-submit-btn");

    await expect(page.locator(".pg-results-panel")).toBeVisible({ timeout: 60000 });

    const failedItems = page.locator(".pg-test-item.fail");
    const totalItems = page.locator(".pg-test-item");

    const totalCount = await totalItems.count();
    if (totalCount > 0) {
      const failCount = await failedItems.count();
      if (failCount > 0) {
        await expect(failedItems.first().locator(".pg-test-detail")).toBeVisible();
        await expect(failedItems.first().locator('label:has-text("EXPECTED")')).toBeVisible();
        await expect(failedItems.first().locator('label:has-text("ACTUAL")')).toBeVisible();
      }
    }
  });

  test("shows error banner when no test output", async ({ page }) => {
    await page.click(".pg-submit-btn");
    await expect(page.locator(".pg-results-panel")).toBeVisible({ timeout: 60000 });

    const errorBanner = page.locator(".pg-error-banner");
    const testItems = page.locator(".pg-test-item");

    const hasError = await errorBanner.isVisible().catch(() => false);
    const hasTests = (await testItems.count()) > 0;

    expect(hasError || hasTests).toBe(true);
  });
});

test.describe("Playground — File Creation & Workspace", () => {
  test.beforeEach(async ({ page, request }) => {
    const res = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await res.json();

    // Clean up any existing workspace
    await request.delete(`${API_BASE}/api/v1/workspaces/database/repl/c`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.goto("/playground/database/repl");
    await page.evaluate((t) => localStorage.setItem("droid_token", t), token);
    await page.reload();
    await expect(page.locator(".pg-user-name")).toBeVisible();
  });

  test("new file button appears in sidebar", async ({ page }) => {
    await expect(page.locator(".pg-new-file-btn")).toBeVisible();
  });

  test("clicking + opens inline input with language prefix", async ({ page }) => {
    await page.click(".pg-new-file-btn");
    const input = page.locator(".pg-new-file-input");
    await expect(input).toBeVisible();

    const value = await input.inputValue();
    expect(value).toContain("c-droid/");
  });

  test("can create a new file via Enter", async ({ page }) => {
    await page.click(".pg-new-file-btn");
    const input = page.locator(".pg-new-file-input");
    await input.fill("c-droid/helper.c");
    await input.press("Enter");

    // New file should appear in sidebar and be active
    await expect(page.locator('.pg-file-item:has-text("c-droid/helper.c")')).toBeVisible();
    await expect(page.locator('.pg-tab.active:has-text("c-droid/helper.c")')).toBeVisible();
  });

  test("can cancel file creation with Escape", async ({ page }) => {
    const fileCountBefore = await page.locator(".pg-file-item").count();
    await page.click(".pg-new-file-btn");
    await page.locator(".pg-new-file-input").press("Escape");

    // Input should disappear, file count unchanged
    await expect(page.locator(".pg-new-file-input")).not.toBeVisible();
    expect(await page.locator(".pg-file-item").count()).toBe(fileCountBefore);
  });

  test("save button is visible for authenticated user", async ({ page }) => {
    await expect(page.locator(".pg-save-btn")).toBeVisible();
    await expect(page.locator(".pg-save-btn")).toContainText("Save");
  });

  test("clicking save creates workspace on server", async ({ page, request }) => {
    await page.click(".pg-save-btn");
    await expect(page.locator(".pg-save-btn")).toContainText("Saved", { timeout: 5000 });

    // Verify workspace was created via API
    const loginRes = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await loginRes.json();

    const wsRes = await request.get(`${API_BASE}/api/v1/workspaces/database/repl/c`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(wsRes.status()).toBe(200);
    const ws = await wsRes.json();
    expect(Object.keys(ws.code_files).length).toBeGreaterThan(0);
  });

  test("workspace loads on page refresh after save", async ({ page }) => {
    // Save the workspace first
    await page.click(".pg-save-btn");
    await expect(page.locator(".pg-save-btn")).toContainText("Saved", { timeout: 5000 });

    // Reload and check workspace loads
    await page.reload();
    await expect(page.locator(".pg-save-btn")).toBeVisible();
    await expect(page.locator(".pg-save-btn")).toContainText("Saved", { timeout: 5000 });
  });

  test("reset button appears after save and resets to template", async ({ page }) => {
    // Save first
    await page.click(".pg-save-btn");
    await expect(page.locator(".pg-save-btn")).toContainText("Saved", { timeout: 5000 });

    // Reset button should appear
    await expect(page.locator(".pg-reset-btn")).toBeVisible();
    await page.click(".pg-reset-btn");

    // Save button should go back to "Save" (not "Saved")
    await expect(page.locator(".pg-save-btn")).toContainText("Save");
  });

  test("new file extension changes with language", async ({ page }) => {
    // Switch to Rust
    await page.click('.pg-lang-btn:has-text("Rust")');
    await expect(page.locator(".pg-file-item").first()).toBeVisible();

    await page.click(".pg-new-file-btn");
    const value = await page.locator(".pg-new-file-input").inputValue();
    expect(value).toContain("rust-droid/");
  });
});
