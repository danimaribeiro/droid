import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

const LANGUAGES = [
  { id: "C", slug: "c", filePattern: /\.(c|h)$/ },
  { id: "C++", slug: "cpp", filePattern: /\.(cpp|hpp)$/ },
  { id: "Rust", slug: "rust", filePattern: /\.(rs|toml)$/ },
  { id: "Zig", slug: "zig", filePattern: /\.zig$/ },
  { id: "Python", slug: "python", filePattern: /\.py$/ },
  { id: "Ruby", slug: "ruby", filePattern: /\.rb$/ },
];

for (const lang of LANGUAGES) {
  test(`${lang.id} — compiles and produces test output`, async ({ page, request }) => {
    const res = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await res.json();

    await request.delete(`${API_BASE}/api/v1/workspaces/database/repl/${lang.slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.goto("/playground/database/repl");
    await page.evaluate((t) => localStorage.setItem("droid_token", t), token);
    await page.reload();
    await expect(page.locator('[data-testid="pg-user-name"]')).toBeVisible({ timeout: 10000 });

    if (lang.id !== "C") {
      await page.click(`[data-testid="pg-lang-btn"]:has-text("${lang.id}")`);
      await expect(
        page.locator(`[data-testid="pg-lang-btn"][data-active="true"]:has-text("${lang.id}")`)
      ).toBeVisible({ timeout: 5000 });
    }

    // Wait for the correct language's template files to load
    await expect(page.locator('[data-testid="pg-file-item"]').first()).toContainText(
      lang.filePattern,
      { timeout: 15000 }
    );

    await page.click('[data-testid="pg-submit-btn"]');

    await expect(page.locator('[data-testid="pg-results-panel"]')).toBeVisible({ timeout: 90000 });

    const testItems = page.locator('[data-testid="pg-test-item"]');
    await expect(testItems.first()).toBeVisible({ timeout: 10000 });

    const count = await testItems.count();
    expect(count).toBeGreaterThan(0);
  });
}
