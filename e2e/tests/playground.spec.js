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
    await expect(page.locator('[data-testid="pg-user-name"]')).toBeVisible({ timeout: 10000 });
  });

  test("loads playground with editor and file sidebar", async ({ page }) => {
    await expect(page.locator('[data-testid="pg-topbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="pg-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="pg-editor-pane"]')).toBeVisible();

    // Should have file tabs
    const tabs = page.locator('[data-testid="pg-tab"]');
    await expect(tabs.first()).toBeVisible();
  });

  test("displays correct stage in breadcrumb", async ({ page }) => {
    await expect(page.locator('[data-testid="pg-topbar-stage"]')).toContainText("Database");
  });

  test("loads C template files by default", async ({ page }) => {
    const fileItems = page.locator('[data-testid="pg-file-item"]');
    await expect(fileItems.first()).toBeVisible();

    // C template should have .c files
    const firstFile = await fileItems.first().textContent();
    expect(firstFile).toMatch(/\.(c|h)$/);
  });

  test("can switch between languages", async ({ page }) => {
    // Switch to Rust — template reloads asynchronously
    await page.click('[data-testid="pg-lang-btn"]:has-text("Rust")');
    await expect(page.locator('[data-testid="pg-lang-btn"][data-active="true"]:has-text("Rust")')).toBeVisible();

    // Wait for Rust template files to load (old files clear, new ones fetch)
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toContainText(/\.(rs|toml)/, { timeout: 10000 });

    // Switch to C++
    await page.click('[data-testid="pg-lang-btn"]:has-text("C++")');
    await expect(page.locator('[data-testid="pg-lang-btn"][data-active="true"]:has-text("C++")')).toBeVisible();
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toContainText(/\.(cpp|hpp)/, { timeout: 10000 });
  });

  test("can click files to switch active editor tab", async ({ page }) => {
    const fileItems = page.locator('[data-testid="pg-file-item"]');
    const count = await fileItems.count();

    if (count > 1) {
      const secondFileName = await fileItems.nth(1).textContent();
      await fileItems.nth(1).click();

      // The active tab should match the clicked file
      await expect(page.locator('[data-testid="pg-tab"][data-active="true"]')).toContainText(secondFileName.trim());
    }
  });

  test("Run Tests button is visible and enabled", async ({ page }) => {
    const submitBtn = page.locator('[data-testid="pg-submit-btn"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).toContainText("Run Tests");
  });

  test("submitting code shows progress steps", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');

    // Progress indicator should appear
    await expect(page.locator('[data-testid="progress-steps"]')).toBeVisible({ timeout: 5000 });
  });

  test("submission completes and shows results panel", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');

    // Wait for results panel to appear (up to 60s for Piston execution)
    await expect(page.locator('[data-testid="pg-results-panel"]')).toBeVisible({ timeout: 60000 });

    // Should show results banner with title
    await expect(page.locator('[data-testid="pg-results-banner-title"]')).toBeVisible();

    // Should show either all-pass, has-fail, build-fail, or error banner
    const banner = page.locator('[data-testid="pg-results-banner"]');
    await expect(banner).toBeVisible();
  });

  test("failed submission shows test case details", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');

    await expect(page.locator('[data-testid="pg-results-panel"]')).toBeVisible({ timeout: 60000 });

    const failedItems = page.locator('[data-testid="pg-test-item"][data-status="fail"]');
    const totalItems = page.locator('[data-testid="pg-test-item"]');

    const totalCount = await totalItems.count();
    if (totalCount > 0) {
      const failCount = await failedItems.count();
      if (failCount > 0) {
        await expect(failedItems.first().locator('[data-testid="pg-test-detail"]')).toBeVisible();
        await expect(failedItems.first().locator('text=Expected').first()).toBeVisible();
        await expect(failedItems.first().locator('text=Actual').first()).toBeVisible();
      }
    }
  });

  test("shows results or error banner after submission", async ({ page }) => {
    await page.click('[data-testid="pg-submit-btn"]');
    await expect(page.locator('[data-testid="pg-results-panel"]')).toBeVisible({ timeout: 60000 });

    // Results panel should show either a results banner, error banner, or test items
    const resultsBanner = page.locator('[data-testid="pg-results-banner"]');
    const errorBanner = page.locator('[data-testid="pg-error-banner"]');
    const testItems = page.locator('[data-testid="pg-test-item"]');

    const hasBanner = await resultsBanner.isVisible().catch(() => false);
    const hasError = await errorBanner.isVisible().catch(() => false);
    const hasTests = (await testItems.count()) > 0;

    expect(hasBanner || hasError || hasTests).toBe(true);
  });
});

test.describe("Playground — File Creation & Workspace", () => {
  test.describe.configure({ mode: "serial" });

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
    await expect(page.locator('[data-testid="pg-user-name"]')).toBeVisible({ timeout: 10000 });
  });

  test("new file button appears in sidebar", async ({ page }) => {
    await expect(page.locator('[data-testid="pg-new-file-btn"]')).toBeVisible();
  });

  test("clicking + opens inline input with language prefix", async ({ page }) => {
    await page.click('[data-testid="pg-new-file-btn"]');
    const input = page.locator('[data-testid="pg-new-file-input"]');
    await expect(input).toBeVisible();

    const value = await input.inputValue();
    expect(value).toContain("c-droid/");
  });

  test("can create a new file via Enter", async ({ page }) => {
    await page.click('[data-testid="pg-new-file-btn"]');
    const input = page.locator('[data-testid="pg-new-file-input"]');
    await input.fill("c-droid/helper.c");
    await page.waitForTimeout(200);
    await input.press("Enter");

    // New file should appear in sidebar and be active
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("helper.c")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="pg-tab"][data-active="true"]:has-text("helper.c")')).toBeVisible({ timeout: 5000 });
  });

  test("can cancel file creation with Escape", async ({ page }) => {
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toBeVisible({ timeout: 10000 });
    const fileCountBefore = await page.locator('[data-testid="pg-file-item"]').count();
    await page.click('[data-testid="pg-new-file-btn"]');
    await page.locator('[data-testid="pg-new-file-input"]').press("Escape");

    // Input should disappear, file count unchanged
    await expect(page.locator('[data-testid="pg-new-file-input"]')).not.toBeVisible();
    expect(await page.locator('[data-testid="pg-file-item"]').count()).toBe(fileCountBefore);
  });

  test("save button is visible for authenticated user", async ({ page }) => {
    await expect(page.locator('[data-testid="pg-save-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Save");
  });

  test("clicking save creates workspace on server", async ({ page, request }) => {
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

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
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

    await page.reload();
    await expect(page.locator('[data-testid="pg-save-btn"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 10000 });
  });

  test("created files persist after save and reload", async ({ page, request }) => {
    // Wait for initial template files to load
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toBeVisible({ timeout: 10000 });

    // Create a new file
    await page.click('[data-testid="pg-new-file-btn"]');
    const input = page.locator('[data-testid="pg-new-file-input"]');
    await input.fill("c-droid/helper.c");
    await page.waitForTimeout(200);
    await input.press("Enter");

    // Verify both .c and .h were created
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("helper.c")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("helper.h")')).toBeVisible({ timeout: 5000 });

    const fileCountBefore = await page.locator('[data-testid="pg-file-item"]').count();

    // Explicitly save
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

    // Verify on server
    const loginRes = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await loginRes.json();
    const wsRes = await request.get(`${API_BASE}/api/v1/workspaces/database/repl/c`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ws = await wsRes.json();
    expect(ws.code_files["c-droid/helper.c"]).toBeDefined();
    expect(ws.code_files["c-droid/helper.h"]).toBeDefined();

    // Reload and verify files are still there
    await page.reload();
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 10000 });
    expect(await page.locator('[data-testid="pg-file-item"]').count()).toBe(fileCountBefore);
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("helper.c")')).toBeVisible();
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("helper.h")')).toBeVisible();
  });

  test("auto-save fires after editing when workspace exists", async ({ page }) => {
    // First create the workspace
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

    // Create a new file
    await page.click('[data-testid="pg-new-file-btn"]');
    const input = page.locator('[data-testid="pg-new-file-input"]');
    await input.fill("c-droid/extra.c");
    await page.waitForTimeout(200);
    await input.press("Enter");

    // Wait for auto-save (2s debounce + network)
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 6000 });

    // Reload and verify auto-saved file is there
    await page.reload();
    await expect(page.locator('[data-testid="pg-file-item"]:has-text("c-droid/extra.c")')).toBeVisible({ timeout: 5000 });
  });

  test("reset button appears after save and resets to template", async ({ page }) => {
    // Save first
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

    // Reset button should appear
    await expect(page.locator('[data-testid="pg-reset-btn"]')).toBeVisible();
    await page.click('[data-testid="pg-reset-btn"]');

    // Save button should go back to "Save" (not "Saved")
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Save");
  });

  test("edited file content persists after save and reload", async ({ page, request }) => {
    // Wait for Monaco editor to fully load
    await expect(page.locator(".monaco-editor .view-lines")).toBeVisible({ timeout: 10000 });

    // Focus the editor
    await page.click(".monaco-editor");
    await page.waitForTimeout(300);

    // Go to beginning of file and prepend a unique marker
    if (process.platform === "darwin") {
      await page.keyboard.press("Meta+ArrowUp");
    } else {
      await page.keyboard.press("Control+Home");
    }
    await page.keyboard.press("Home");
    await page.keyboard.type("/* PERSIST_CHECK_42 */\n");

    await page.waitForTimeout(500);

    // Save manually
    await page.click('[data-testid="pg-save-btn"]');
    await expect(page.locator('[data-testid="pg-save-btn"]')).toContainText("Saved", { timeout: 5000 });

    // Verify content reached the server
    const loginRes = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await loginRes.json();
    const wsRes = await request.get(
      `${API_BASE}/api/v1/workspaces/database/repl/c`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const ws = await wsRes.json();
    expect(
      Object.values(ws.code_files).some((c) => c.includes("PERSIST_CHECK_42"))
    ).toBe(true);

    // Reload and verify editor shows persisted content
    await page.reload();
    await expect(page.locator(".monaco-editor .view-lines")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".view-lines")).toContainText("PERSIST_CHECK_42", { timeout: 5000 });
  });

  test("new file extension changes with language", async ({ page }) => {
    // Switch to Rust
    await page.click('[data-testid="pg-lang-btn"]:has-text("Rust")');
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toBeVisible();

    await page.click('[data-testid="pg-new-file-btn"]');
    const value = await page.locator('[data-testid="pg-new-file-input"]').inputValue();
    expect(value).toContain("rust-droid/");
  });
});
