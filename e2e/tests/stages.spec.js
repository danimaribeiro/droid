import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Stages API", () => {
  test("GET /api/v1/stages returns all stages", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/stages`);

    expect(response.status()).toBe(200);
    const stages = await response.json();
    expect(stages.length).toBeGreaterThanOrEqual(12);

    const repl = stages.find((s) => s.slug === "database/repl");
    expect(repl).toBeTruthy();
    expect(repl.title).toBe("User REPL");
    expect(repl.stage_number).toBe(1);
  });

  test("GET /api/v1/stages/database/repl returns stage details", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/stages/database/repl`);

    expect(response.status()).toBe(200);
    const stage = await response.json();
    expect(stage.slug).toBe("database/repl");
    expect(stage.part).toBe("database");
  });

  test("GET /health returns ok", async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
