import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("API Submissions", () => {
  let token;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const body = await res.json();
    token = body.token;
  });

  test("POST /api/v1/submissions requires authentication", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/submissions`, {
      data: {
        submission: {
          stage_slug: "database/repl",
          language_slug: "c",
          code_files: { "main.c": "int main() { return 0; }" },
        },
      },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /api/v1/submissions creates a submission", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        submission: {
          stage_slug: "database/repl",
          language_slug: "c",
          code_files: { "main.c": '#include <stdio.h>\nint main() { printf("db > "); return 0; }' },
        },
      },
    });

    expect(response.status()).toBe(202);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe("pending");
    expect(body.stage_slug).toBe("database/repl");
  });

  test("GET /api/v1/submissions/:id returns the submission", async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/api/v1/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        submission: {
          stage_slug: "database/repl",
          language_slug: "c",
          code_files: { "main.c": "int main() {}" },
        },
      },
    });
    const { id } = await createRes.json();

    const response = await request.get(`${API_BASE}/api/v1/submissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(id);
  });

  test("GET /api/v1/submissions/:id returns 401 without token", async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/api/v1/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        submission: {
          stage_slug: "database/repl",
          language_slug: "c",
          code_files: { "main.c": "int main() {}" },
        },
      },
    });
    const { id } = await createRes.json();

    const response = await request.get(`${API_BASE}/api/v1/submissions/${id}`);
    expect(response.status()).toBe(401);
  });
});
