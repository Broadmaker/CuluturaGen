// MVP 7 smoke test: compare view + gated final approval.
// Run: node scripts/smoke-mvp7.mjs (dev server on :3100).
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

const proj = await call("POST", "/api/projects", { name: "Smoke Final" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

const els = await call("GET", "/api/cultural-elements", null, A);
const textile = els.json?.data?.find((e) => e.name === "Ikat Ceremonial Wrap");
const ornament = els.json?.data?.find((e) => e.name === "Ancestral Headdress Ornament");
await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: textile.id }, A);
await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: ornament.id }, A);

const gen = await call("POST", "/api/designs/generate", { projectId: pid }, A);
const designId = gen.json?.data?.design?.id;
check("v1 generated", gen.status === 201, `got ${gen.status}`);

const regen = await call("POST", `/api/designs/${designId}/regenerate`, { instruction: "Softer drape" }, A);
check("v2 generated", regen.status === 201 && regen.json?.data?.version?.versionNumber === 2, `got ${regen.status}`);

// Evaluate both versions explicitly.
await call("POST", `/api/designs/${designId}/evaluate`, { versionNumber: 1 }, A);
await call("POST", `/api/designs/${designId}/evaluate`, { versionNumber: 2 }, A);

// --- compare ---
const cmp = await call("GET", `/api/designs/${designId}/compare?a=1&b=2`, null, A);
check(
  "compare bundles both versions",
  cmp.status === 200 && cmp.json?.data?.a?.version?.versionNumber === 1 && cmp.json?.data?.b?.version?.versionNumber === 2,
  `got ${cmp.status}`,
);
check(
  "compare shows distinct explanations",
  cmp.json?.data?.a?.spec?.aiExplanation?.summary !== cmp.json?.data?.b?.spec?.aiExplanation?.summary,
  "",
);
const same = await call("GET", `/api/designs/${designId}/compare?a=1&b=1`, null, A);
check("compare same version 400", same.status === 400, `got ${same.status}`);
const missing = await call("GET", `/api/designs/${designId}/compare?a=1&b=9`, null, A);
check("compare missing version 404", missing.status === 404, `got ${missing.status}`);

const cmpPage = await fetch(`${BASE}/design-studio/${designId}/compare?a=1&b=2`, { headers: { Cookie: A } });
check("compare page 200", cmpPage.status === 200, `got ${cmpPage.status}`);

// --- finalize: clean versions first (no CRITICAL expected) ---
const fin1 = await call("POST", `/api/designs/${designId}/finalize`, {}, A);
check("finalize 201 FINAL", fin1.status === 201 && fin1.json?.data?.status === "FINAL" && fin1.json?.data?.finalized !== false, `got ${fin1.status} ${fin1.json?.data?.status}`);
const fin2 = await call("POST", `/api/designs/${designId}/finalize`, {}, A);
check("finalize idempotent", fin2.status === 200 && fin2.json?.finalized === false, `got ${fin2.status}`);

// --- lifecycle: FINAL designs cannot start a new version cycle ---
const regenFinal = await call("POST", `/api/designs/${designId}/regenerate`, { instruction: "One more" }, A);
check("regenerate on FINAL 409", regenFinal.status === 409, `got ${regenFinal.status}`);

// --- finalize blocked by CRITICAL on a guarded design ---
const proj2 = await call("POST", "/api/projects", { name: "Smoke Guarded" }, A);
const pid2 = proj2.json?.data?.id;
await call("POST", `/api/projects/${pid2}/basket`, { culturalElementId: ornament.id }, A);
const gen2 = await call("POST", "/api/designs/generate", { projectId: pid2, instruction: `Use ${ornament.name} as the centerpiece` }, A);
const design2 = gen2.json?.data?.design?.id;
await call("POST", `/api/designs/${design2}/evaluate`, {}, A);
const finBlocked = await call("POST", `/api/designs/${design2}/finalize`, {}, A);
check("finalize blocked 422 on CRITICAL", finBlocked.status === 422, `got ${finBlocked.status}`);

const latest2 = await call("GET", `/api/designs/${design2}/evaluation`, null, A);
for (const f of (latest2.json?.data?.findings ?? []).filter((x) => !x.resolved)) {
  await call("POST", `/api/evaluation/findings/${f.id}/resolve`, { comment: "smoke" }, A);
}
const fin3 = await call("POST", `/api/designs/${design2}/finalize`, {}, A);
check("finalize 201 after resolution", fin3.status === 201 && fin3.json?.data?.status === "FINAL", `got ${fin3.status}`);

// --- finalize blocked by HIGH (over-budget), not just CRITICAL (md/07 §91) ---
const proj3 = await call("POST", "/api/projects", { name: "Smoke Budget", budget: 100 }, A);
const pid3 = proj3.json?.data?.id;
await call("POST", `/api/projects/${pid3}/basket`, { culturalElementId: textile.id }, A);
const gen3 = await call("POST", "/api/designs/generate", { projectId: pid3 }, A);
const design3 = gen3.json?.data?.design?.id;
const vid3 = gen3.json?.data?.version?.id;
await call("POST", `/api/versions/${vid3}/cost/calculate`, { labor: [{ description: "Hand tailoring", quantity: 50, unitPrice: 1000 }] }, A);
await call("POST", `/api/designs/${design3}/evaluate`, {}, A);
const overState = await call("GET", `/api/designs/${design3}/evaluation`, null, A);
const overFindings = overState.json?.data?.findings ?? [];
const highs = overFindings.filter((f) => !f.resolved && f.severity === "HIGH");
const criticals = overFindings.filter((f) => !f.resolved && f.severity === "CRITICAL");
check("over-budget HIGH present, no CRITICAL", highs.length > 0 && criticals.length === 0, `high=${highs.length} critical=${criticals.length}`);
const finHigh = await call("POST", `/api/designs/${design3}/finalize`, {}, A);
check("finalize blocked 422 on HIGH", finHigh.status === 422, `got ${finHigh.status}`);

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);
await call("DELETE", `/api/projects/${pid2}`, null, A);
await call("DELETE", `/api/projects/${pid3}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
