import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("API Authentication", () => {
  test("POST /api/v1/login returns token with valid credentials", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe("admin@droid.dev");
    expect(body.user.admin).toBe(true);
  });

  test("POST /api/v1/login returns 401 with wrong password", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "wrong" },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid email or password");
  });

  test("GET /api/v1/me returns user info with valid token", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/login`, {
      data: { email: "admin@droid.dev", password: "admin" },
    });
    const { token } = await loginRes.json();

    const response = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.email).toBe("admin@droid.dev");
    expect(body.name).toBe("Admin");
  });

  test("GET /api/v1/me returns 401 without token", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/me`);
    expect(response.status()).toBe(401);
  });
});
