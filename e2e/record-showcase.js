import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const API_BASE = process.env.API_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const OUT_DIR = join(import.meta.dirname, "video-recordings");
const FRAMES_DIR = join(import.meta.dirname, "video-frames");

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(FRAMES_DIR, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let frameIndex = 0;
async function snap(page, name) {
  const num = String(frameIndex++).padStart(3, "0");
  const path = join(FRAMES_DIR, `${num}-${name}.png`);
  await page.screenshot({ path });
  console.log(`  snap: ${num}-${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Part 1: Quick intro screenshots (homepage + stage) ─────
  console.log("\n━━ Part 1: Intro screenshots ━━");
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle" });
    await wait(800);
    await snap(page, "homepage-hero");

    await page.click('a:has-text("Start Part 1 Tutorial")');
    await page.waitForURL(/stages\/database\/repl/);
    await wait(800);
    await snap(page, "stage-page");

    // Scroll to Launch Code Editor CTA
    const launchBtn = page.locator('a:has-text("Launch Code Editor")');
    if (await launchBtn.isVisible().catch(() => false)) {
      await launchBtn.scrollIntoViewIfNeeded();
      await wait(500);
      await snap(page, "stage-cta");
    }

    await ctx.close();
  }

  // ── Part 2: Record playground video ────────────────────────
  console.log("\n━━ Part 2: Recording playground ━━");
  {
    // Log in via API first to get token
    const loginCtx = await browser.newContext();
    const loginPage = await loginCtx.newPage();
    const loginRes = await loginPage.request.post(
      `${API_BASE}/api/v1/login`,
      { data: { email: "admin@droid.dev", password: "admin" } }
    );
    const { token } = await loginRes.json();

    // Clean up workspace so we get fresh template
    await loginPage.request.delete(
      `${API_BASE}/api/v1/workspaces/database/repl/c`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await loginCtx.close();

    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      recordVideo: {
        dir: OUT_DIR,
        size: { width: 2880, height: 1800 },
      },
    });
    const page = await ctx.newPage();

    // Navigate to playground (not logged in yet)
    await page.goto(`${FRONTEND_URL}/playground/database/repl`, {
      waitUntil: "networkidle",
    });
    await page
      .locator('[data-testid="pg-editor-pane"]')
      .waitFor({ timeout: 15000 });
    await wait(2500);

    // ── Show editor with C template ──
    console.log("  → Editor loaded with C template");
    await wait(1500);

    // ── Browse files ──
    console.log("  → Browsing files");
    const fileItems = page.locator('[data-testid="pg-file-item"]');
    const fileCount = await fileItems.count();
    for (let i = 0; i < fileCount; i++) {
      await fileItems.nth(i).click();
      await wait(1200);
    }
    await fileItems.first().click();
    await wait(1000);

    // ── Click Run Tests → triggers auth modal ──
    console.log("  → Run Tests → auth modal");
    await page.click('[data-testid="pg-submit-btn"]');
    await page
      .locator('[data-testid="auth-modal"]')
      .waitFor({ timeout: 5000 });
    await wait(2000);

    // ── Login ──
    console.log("  → Logging in");
    await page.locator("#auth-email").click();
    await page.locator("#auth-email").fill("");
    await page.keyboard.type("admin@droid.dev", { delay: 50 });
    await wait(400);
    await page.locator("#auth-password").click();
    await page.locator("#auth-password").fill("");
    await page.keyboard.type("admin", { delay: 70 });
    await wait(600);
    await page.click('[data-testid="auth-submit"]');
    await page
      .locator('[data-testid="pg-user-name"]')
      .waitFor({ timeout: 10000 });
    await wait(1500);

    // ── Browse code files when logged in ──
    console.log("  → Browsing code (logged in)");
    const replFile = page.locator(
      '[data-testid="pg-file-item"]:has-text("repl.c")'
    );
    if ((await replFile.count()) > 0) {
      await replFile.first().click();
      await wait(1500);
    }
    const replH = page.locator(
      '[data-testid="pg-file-item"]:has-text("repl.h")'
    );
    if ((await replH.count()) > 0) {
      await replH.first().click();
      await wait(1200);
    }
    await fileItems.first().click();
    await wait(1000);

    // ── Submit the UNMODIFIED template to get real test results ──
    console.log("  → Submitting code (Run Tests)");
    await page.click('[data-testid="pg-submit-btn"]');
    await wait(500);

    try {
      await page
        .locator('[data-testid="progress-steps"]')
        .waitFor({ timeout: 5000 });
      console.log("  → Progress bar visible");
      await wait(3000);
    } catch {
      console.log("  → Progress appeared briefly");
    }

    // ── Wait for results ──
    console.log("  → Waiting for test results...");
    await page
      .locator('[data-testid="pg-results-panel"]')
      .waitFor({ timeout: 90000 });
    await wait(2500);

    // Scroll through and click results
    const resultItems = page.locator('[data-testid="pg-test-item"]');
    const resultCount = await resultItems.count();
    console.log(`  → ${resultCount} test results`);

    if (resultCount > 0) {
      for (let i = 0; i < Math.min(4, resultCount); i++) {
        await resultItems.nth(i).scrollIntoViewIfNeeded();
        await resultItems.nth(i).click();
        await wait(1200);
      }
    }
    await wait(2000);

    // ── Now type some code to show the editing experience ──
    console.log("  → Typing code in editor");
    // Click on repl.c
    if ((await replFile.count()) > 0) {
      await replFile.first().click();
      await wait(800);
    }

    await page.click(".monaco-editor");
    await wait(300);

    // Go to end
    if (process.platform === "darwin") {
      await page.keyboard.press("Meta+ArrowDown");
    } else {
      await page.keyboard.press("Control+End");
    }
    await wait(200);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    const codeLines = [
      "// Process REPL commands",
      "void handle_command(const char *cmd) {",
      '    if (strcmp(cmd, ".help") == 0) {',
      '        printf("Available commands:\\n");',
      '        printf("  .help  - Show help\\n");',
      '        printf("  .exit  - Exit REPL\\n");',
      "    }",
      "}",
    ];
    for (const line of codeLines) {
      await page.keyboard.type(line, { delay: 30 });
      await page.keyboard.press("Enter");
      await wait(150);
    }
    await wait(2000);

    // ── Switch to Rust ──
    console.log("  → Switching to Rust");
    await page.click('[data-testid="pg-lang-btn"]:has-text("Rust")');
    await page
      .locator(
        '[data-testid="pg-lang-btn"][data-active="true"]:has-text("Rust")'
      )
      .waitFor({ timeout: 5000 });
    await page
      .locator('[data-testid="pg-file-item"]')
      .first()
      .waitFor({ timeout: 10000 });
    await wait(2000);

    // Browse Rust files
    const rustFiles = page.locator('[data-testid="pg-file-item"]');
    const rustCount = await rustFiles.count();
    for (let i = 0; i < Math.min(3, rustCount); i++) {
      await rustFiles.nth(i).click();
      await wait(1000);
    }
    await wait(1500);

    // ── Switch to C++ ──
    console.log("  → Switching to C++");
    await page.click('[data-testid="pg-lang-btn"]:has-text("C++")');
    await page
      .locator(
        '[data-testid="pg-lang-btn"][data-active="true"]:has-text("C++")'
      )
      .waitFor({ timeout: 5000 });
    await page
      .locator('[data-testid="pg-file-item"]')
      .first()
      .waitFor({ timeout: 10000 });
    await wait(2000);

    // Final hold
    await wait(2000);
    await snap(page, "playground-final");

    await ctx.close();
    console.log("  → Video saved");
  }

  await browser.close();

  // Report results
  const { readdirSync, statSync } = await import("fs");
  const videos = readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
  console.log(`\n✓ Recordings in ${OUT_DIR}:`);
  videos.forEach((v) => {
    const size = statSync(join(OUT_DIR, v)).size;
    console.log(`  ${v} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  });
})();
