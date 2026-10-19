// Phase 18 smoke test: audit trail across the full loop.
// Run: node scripts/smoke-audit.mjs (dev server on :3100).
const BASE = "http://localhost:3100";

async function call(method, path, body, cookie = "") {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json, text, cookie: setCookie ? setCookie.split(";")[0] : "" };
}

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

const login = await call("POST", "/api/auth/login", {
  email: "admin@attirelab.local",
  password: "Admin123!",
});
const A = login.cookie;
check("admin login", login.status === 200 && A.length > 0);

const proj = await call("POST", "/api/projects", { name: "Smoke Audit" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

const els = await call("GET", "/api/cultural-elements", null, A);
const textile = els.json?.data?.find((e) => e.name === "Ikat Ceremonial Wrap");
await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: textile.id }, A);

const gen = await call("POST", "/api/designs/generate", { projectId: pid }, A);
const designId = gen.json?.data?.design?.id;
check("design generated", gen.status === 201 && !!designId, `got ${gen.status}`);

const versions = await call("GET", `/api/designs/${designId}/versions`, null, A);
const list = versions.json?.data ?? versions.json ?? [];
const vid = (Array.isArray(list) ? list : list.versions ?? []).find((v) => v.versionNumber === 1)?.id
  ?? (Array.isArray(list) ? list : [])[0]?.id;
check("version resolved", !!vid, `got ${versions.status}`);

const cost = await call("POST", `/api/versions/${vid}/cost/calculate`, {}, A);
check("cost calculated", cost.status === 201, `got ${cost.status}`);

await call("POST", `/api/designs/${designId}/evaluate`, { versionNumber: 1 }, A);
const latest = await call("GET", `/api/designs/${designId}/evaluation`, null, A);
for (const f of (latest.json?.data?.findings ?? []).filter((x) => !x.resolved)) {
  await call("POST", `/api/evaluation/findings/${f.id}/resolve`, { comment: "smoke" }, A);
}
const fin = await call("POST", `/api/designs/${designId}/finalize`, {}, A);
check("finalized", fin.status === 201 && fin.json?.data?.status === "FINAL", `got ${fin.status}`);

// --- audit trail ---
const audit = await call("GET", `/api/projects/${pid}/audit`, null, A);
check("audit 200", audit.status === 200, `got ${audit.status}`);
const actions = new Set((audit.json?.data ?? []).map((a) => a.action));
for (const expected of ["PROJECT_CREATED", "DESIGN_GENERATED", "COST_CALCULATED", "EVALUATION_RUN", "DESIGN_ACCEPTED"]) {
  check(`trail has ${expected}`, actions.has(expected));
}
const noAuth = await call("GET", `/api/projects/${pid}/audit`);
check("audit 401 without session", noAuth.status === 401, `got ${noAuth.status}`);

const page = await fetch(`${BASE}/projects/${pid}`, { headers: { Cookie: A } });
check("project page 200 with history", page.status === 200, `got ${page.status}`);

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
