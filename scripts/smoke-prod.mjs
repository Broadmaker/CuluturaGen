// Production-readiness smoke (read-only): health, headers, request IDs, CORS.
// Run: node scripts/smoke-prod.mjs (dev server on :3100).
const BASE = "http://localhost:3100";

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

const health = await fetch(BASE + "/api/health", { redirect: "manual" });
const healthJson = await health.json().catch(() => null);
check("health 200 healthy", health.status === 200 && healthJson?.status === "healthy", `got ${health.status}`);
check(
  "health checks present, no secrets",
  !!healthJson?.checks?.database?.ok &&
    !!healthJson?.checks?.storage?.ok &&
    !!healthJson?.checks?.providers &&
    !/password|secret/i.test(JSON.stringify(healthJson)),
);
check("health carries request id", (health.headers.get("x-request-id") || "").length > 0);

const anon = await fetch(BASE + "/api/cultural-elements?q=x", { redirect: "manual" });
check("api 401 carries request id", anon.status === 401 && (anon.headers.get("x-request-id") || "").length > 0, `got ${anon.status}`);

const preflightEvil = await fetch(BASE + "/api/health", {
  method: "OPTIONS",
  headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "GET" },
  redirect: "manual",
});
check("evil origin preflight denied 403", preflightEvil.status === 403, `got ${preflightEvil.status}`);

const preflightSame = await fetch(BASE + "/api/health", {
  method: "OPTIONS",
  headers: { Origin: BASE, "Access-Control-Request-Method": "GET" },
  redirect: "manual",
});
check(
  "same-origin preflight allowed 204",
  preflightSame.status === 204 && preflightSame.headers.get("access-control-allow-origin") === BASE,
  `got ${preflightSame.status}`,
);

const page = await fetch(BASE + "/login", { redirect: "manual" });
const h = (n) => page.headers.get(n) || "";
check("nosniff header", h("x-content-type-options") === "nosniff", `got ${h("x-content-type-options")}`);
check("frame-options header", h("x-frame-options") === "SAMEORIGIN", `got ${h("x-frame-options")}`);
check("referrer-policy header", h("referrer-policy").length > 0);
check("hsts header", h("strict-transport-security").includes("max-age"), `got ${h("strict-transport-security")}`);

const failed = results.filter((r) => r.startsWith("FAIL"));
console.log(results.join("\n"));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
