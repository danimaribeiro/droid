import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const API_BASE = process.env.API_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const OUT_DIR = join(import.meta.dirname, "video-frames");

mkdirSync(OUT_DIR, { recursive: true });

let frameIndex = 0;
async function capture(page, name, { fullPage = false, clip } = {}) {
  const num = String(frameIndex++).padStart(3, "0");
  const path = join(OUT_DIR, `${num}-${name}.png`);
  await page.screenshot({ path, fullPage, clip });
  console.log(`  captured: ${num}-${name}.png`);
  return path;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ── Scene 1: Homepage ─────────────────────────────────────
  console.log("\n▸ Scene 1: Homepage");
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle" });
  await sleep(1000);
  await capture(page, "homepage-hero");

  // Scroll to show curriculum roadmap
  const roadmapCard = page.locator('[data-testid="roadmap-card"]').first();
  await roadmapCard.scrollIntoViewIfNeeded();
  await sleep(500);
  await capture(page, "homepage-roadmap");

  // ── Scene 2: Tutorial stage page ──────────────────────────
  console.log("\n▸ Scene 2: Stage page (REPL)");
  await page.click('a:has-text("Start Part 1 Tutorial")');
  await page.waitForURL(/stages\/database\/repl/);
  await sleep(1000);
  await capture(page, "stage-repl-top");

  // Scroll to show the content and "Launch Code Editor" button
  await page.evaluate(() => window.scrollTo(0, 400));
  await sleep(500);
  await capture(page, "stage-repl-content");

  // Scroll further to the CTA button
  const launchBtn = page.locator('a:has-text("Launch Code Editor")');
  if (await launchBtn.isVisible().catch(() => false)) {
    await launchBtn.scrollIntoViewIfNeeded();
    await sleep(500);
    await capture(page, "stage-repl-cta");
  }

  // ── Scene 3: Playground (code editor) — logged out ────────
  console.log("\n▸ Scene 3: Playground (logged out)");
  await page.goto(`${FRONTEND_URL}/playground/database/repl`, {
    waitUntil: "networkidle",
  });
  await page
    .locator('[data-testid="pg-editor-pane"]')
    .waitFor({ timeout: 15000 });
  await sleep(1500);
  await capture(page, "playground-editor");

  // Show the file sidebar
  await capture(page, "playground-sidebar-files");

  // ── Scene 4: Click "Run Tests" while logged out → auth modal ──
  console.log("\n▸ Scene 4: Auth modal");
  await page.click('[data-testid="pg-submit-btn"]');
  await page
    .locator('[data-testid="auth-modal"]')
    .waitFor({ timeout: 5000 });
  await sleep(500);
  await capture(page, "auth-modal-login");

  // Fill credentials
  await page.fill("#auth-email", "admin@droid.dev");
  await page.fill("#auth-password", "admin");
  await sleep(300);
  await capture(page, "auth-modal-filled");

  // Submit login
  await page.click('[data-testid="auth-submit"]');
  await page
    .locator('[data-testid="pg-user-name"]')
    .waitFor({ timeout: 10000 });
  await sleep(500);
  await capture(page, "playground-logged-in");

  // ── Scene 5: Submit code and show progress ────────────────
  console.log("\n▸ Scene 5: Submission flow");
  await page.click('[data-testid="pg-submit-btn"]');

  // Capture progress steps
  try {
    await page
      .locator('[data-testid="progress-steps"]')
      .waitFor({ timeout: 5000 });
    await sleep(300);
    await capture(page, "submission-progress");
  } catch {
    console.log("  (progress steps appeared too briefly, skipping)");
  }

  // ── Scene 6: Results panel ────────────────────────────────
  console.log("\n▸ Scene 6: Test results");
  await page
    .locator('[data-testid="pg-results-panel"]')
    .waitFor({ timeout: 90000 });
  await sleep(500);
  await capture(page, "results-panel");

  // Capture the banner close-up
  const banner = page.locator('[data-testid="pg-results-banner"]');
  if (await banner.isVisible().catch(() => false)) {
    await capture(page, "results-banner");
  }

  // Capture individual test items
  const testItems = page.locator('[data-testid="pg-test-item"]');
  const testCount = await testItems.count();
  if (testCount > 0) {
    await testItems.first().scrollIntoViewIfNeeded();
    await sleep(300);
    await capture(page, "results-test-items");

    // If there are failed tests, capture detail
    const failedItem = page.locator(
      '[data-testid="pg-test-item"][data-status="fail"]'
    );
    if ((await failedItem.count()) > 0) {
      await failedItem.first().scrollIntoViewIfNeeded();
      await sleep(300);
      await capture(page, "results-failed-detail");
    }

    // If there are passed tests, capture those too
    const passedItem = page.locator(
      '[data-testid="pg-test-item"][data-status="pass"]'
    );
    if ((await passedItem.count()) > 0) {
      await passedItem.first().scrollIntoViewIfNeeded();
      await sleep(300);
      await capture(page, "results-passed-detail");
    }
  }

  // ── Scene 7: Language switching (bonus) ───────────────────
  console.log("\n▸ Scene 7: Language switching");
  await page.click('[data-testid="pg-lang-btn"]:has-text("Rust")');
  await page
    .locator('[data-testid="pg-lang-btn"][data-active="true"]:has-text("Rust")')
    .waitFor({ timeout: 5000 });
  await page
    .locator('[data-testid="pg-file-item"]')
    .first()
    .waitFor({ timeout: 10000 });
  await sleep(1000);
  await capture(page, "playground-rust");

  // ── Done ──────────────────────────────────────────────────
  console.log(`\n✓ Captured ${frameIndex} frames in ${OUT_DIR}`);
  await browser.close();
})();
