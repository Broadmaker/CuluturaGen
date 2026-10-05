import { describe, expect, it, vi, afterEach } from "vitest";
import { allowedOrigins, corsAllowHeaders, isOriginAllowed } from "@/lib/api/cors";
import { apiFail, apiOk, requestIdOf } from "@/lib/api/errors";
import { redact, serverLog } from "@/lib/api/log";

// Production readiness: strict CORS, safe errors, redacted logs (md/09 §113).

describe("cors policy", () => {
  it("allows same-origin and non-browser callers, denies the rest", () => {
    expect(isOriginAllowed("http://localhost:3100", null)).toBe(true);
    expect(isOriginAllowed("http://localhost:3100", "http://localhost:3100")).toBe(true);
    expect(isOriginAllowed("http://localhost:3100", "https://evil.example")).toBe(false);
    expect(isOriginAllowed("http://a", "https://b", ["https://b"])).toBe(true);
  });

  it("parses ALLOWED_ORIGINS env", () => {
    process.env.ALLOWED_ORIGINS = "https://a.example, https://b.example/";
    expect(allowedOrigins()).toEqual(["https://a.example", "https://b.example"]);
    delete process.env.ALLOWED_ORIGINS;
    expect(allowedOrigins()).toEqual([]);
  });

  it("emits a strict allow header set", () => {
    const h = corsAllowHeaders("https://a.example");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://a.example");
    expect(h["Access-Control-Allow-Methods"]).toContain("OPTIONS");
  });
});

describe("safe error envelope", () => {
  const req = (id?: string) =>
    new Request("http://x/api/health", id ? { headers: { "x-request-id": id } } : undefined);

  it("carries code + request id", async () => {
    expect(requestIdOf(req("req_1"))).toBe("req_1");
    const res = apiFail(req("req_1"), "NOPE", "No.", 422);
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ ok: false, code: "NOPE", requestId: "req_1" });
  });

  it("hides detail in production, shows it elsewhere", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const prod = await (await apiFail(req(), "E", "M", 500, new Error("driver exploded"))).json();
    expect(prod.detail).toBeUndefined();
    vi.stubEnv("NODE_ENV", "test");
    const dev = await (await apiFail(req(), "E", "M", 500, new Error("driver exploded"))).json();
    expect(dev.detail).toBe("driver exploded");
    vi.unstubAllEnvs();
  });

  it("apiOk wraps data", async () => {
    const res = apiOk({ a: 1 }, { status: 201 });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, data: { a: 1 } });
  });
});

describe("log redaction", () => {
  afterEach(() => vi.restoreAllMocks());

  it("strips secrets recursively, keeps the rest", () => {
    const out = redact({
      user: "m",
      password: "hunter2",
      nested: { apiKey: "k", q: "textile" },
      list: [{ token: "t", n: 1 }],
      AUTHORIZATION: "Bearer x",
      Cookie: "sess=abc",
    }) as Record<string, unknown>;
    expect(out).toMatchObject({
      user: "m",
      password: "[redacted]",
      nested: { apiKey: "[redacted]", q: "textile" },
      AUTHORIZATION: "[redacted]",
      Cookie: "[redacted]",
    });
    expect((out.list as unknown[])[0]).toMatchObject({ token: "[redacted]", n: 1 });
  });

  it("serverLog emits one JSON line without secrets", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    serverLog("info", "health_check", { ok: true, AUTH_SECRET: "change-me" });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: "info", event: "health_check", ok: true });
    expect(line.AUTH_SECRET).toBe("[redacted]");
  });
});
