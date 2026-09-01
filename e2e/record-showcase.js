import { chromium } from "@playwright/test";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const API_BASE = process.env.API_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const OUT_DIR = join(import.meta.dirname, "video-recordings");
const FRAMES_DIR = join(import.meta.dirname, "video-frames");

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(FRAMES_DIR, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// `node record-showcase.js --frames-only` refreshes just the intro stills.
const FRAMES_ONLY = process.argv.includes("--frames-only");

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
    // 16:9 at 2x — these stills are shown full-frame in the 1920x1080
    // composition, so capturing at another ratio would force a crop.
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
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
  if (FRAMES_ONLY) {
    console.log("\n(--frames-only: skipping the playground recording)");
    await browser.close();
    return;
  }

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

    // Recorded through CDP screencast rather than Playwright's recordVideo:
    // recordVideo emits VP8 at roughly 560 kb/s with no bitrate control, which
    // was the softest thing in the finished video. Screencast hands us full
    // frames we encode ourselves. deviceScaleFactor 2 renders at 3840x2160 and
    // the screencast downscales to 1920x1080, so text is supersampled.
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
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

    const recorder = await startScreencast(page);
    await wait(1500);

    // ── Browse files ──
    console.log("  → Browsing files");
    recorder.mark("files");
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
    recorder.mark("auth");
    await page.click('[data-testid="pg-submit-btn"]');
    await page
      .locator('[data-testid="auth-modal"]')
      .waitFor({ timeout: 5000 });
    await wait(2000);

    // ── Login ──
    console.log("  → Logging in");
    recorder.mark("login");
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
    recorder.mark("browse");
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
    recorder.mark("submit");
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
    recorder.mark("results");
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
    recorder.mark("typing");
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
    recorder.mark("languages");
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

    const out = await recorder.finish(join(OUT_DIR, "playground-capture.json"));
    await ctx.close();

    console.log(`\n✓ capture written to ${out}`);
    console.log("  next: cd ../video && ./scripts/prepare-assets.sh");
  }

  await browser.close();
})();

// ── CDP screencast recorder ─────────────────────────────────────────
// Screencast is event-driven: frames arrive only when the page actually
// changes. Each frame's timestamp is kept so the concat list can hold a still
// frame for as long as the page held still, preserving real-time pacing.
function compositorDir() {
  return join(
    import.meta.dirname,
    "../video/node_modules/@remotion/compositor-darwin-arm64"
  );
}

function ffmpegBin() {
  const bundled = join(compositorDir(), "ffmpeg");
  return existsSync(bundled) ? bundled : "ffmpeg";
}

async function startScreencast(page) {
  const dir = join(OUT_DIR, "frames");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const client = await page.context().newCDPSession(page);
  const frames = [];
  const marks = [];

  client.on("Page.screencastFrame", async (frame) => {
    const file = join(dir, `f${String(frames.length).padStart(6, "0")}.jpg`);
    writeFileSync(file, Buffer.from(frame.data, "base64"));
    frames.push({ file, at: frame.metadata.timestamp });
    // Acking is what asks for the next frame; a dropped ack stalls the stream.
    await client
      .send("Page.screencastFrameAck", { sessionId: frame.sessionId })
      .catch(() => {});
  });

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 100,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1,
  });

  const wallStart = Date.now() / 1000;

  return {
    // Records when a phase began, in seconds from the first frame. The retimer
    // stretches each phase to the length of the line that narrates it.
    mark(name) {
      marks.push({ name, at: Date.now() / 1000 - wallStart });
    },

    async finish(outPath) {
      await client.send("Page.stopScreencast").catch(() => {});
      await new Promise((r) => setTimeout(r, 400));

      if (frames.length < 2) throw new Error("screencast captured no frames");

      // Frame timestamps and Date.now() share an origin only approximately, so
      // rebase both onto the first frame.
      const t0 = frames[0].at;
      const capture = {
        recordedAt: new Date().toISOString(),
        duration: frames[frames.length - 1].at - t0,
        frames: frames.map((f) => ({ file: f.file, at: f.at - t0 })),
        marks: [{ name: "editor", at: 0 }, ...marks],
      };

      writeFileSync(outPath, JSON.stringify(capture, null, 2) + "\n");
      console.log(
        `  → ${frames.length} frames over ${capture.duration.toFixed(1)}s ` +
          `(${(frames.length / capture.duration).toFixed(1)} fps)`
      );
      console.log(
        "  → phases: " +
          capture.marks.map((m) => `${m.name}@${m.at.toFixed(1)}s`).join(", ")
      );
      return outPath;
    },
  };
}
