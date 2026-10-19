// MVP 6 smoke test: six-domain evaluation, findings lifecycle, human review.
// Run: node scripts/smoke-mvp6.mjs (dev server on :3100).
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

// --- project engineered to produce findings in every domain ---
const proj = await call("POST", "/api/projects", { name: "Smoke Eval", budget: 30000, occasion: "Festival" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

// Brief with a mandatory requirement the mock spec will satisfy ("textile")
// and a restricted requirement it will not violate.
const brief = await call("POST", `/api/projects/${pid}/briefs`, { occasion: "Festival", silhouette: "Fitted" }, A);
const bid = brief.json?.data?.id;
await call("POST", `/api/briefs/${bid}/requirements`, { category: "CULTURAL", requirement: "Use documented traditional textile", priority: "MANDATORY" }, A);
await call("POST", `/api/briefs/${bid}/requirements`, { category: "MATERIAL", requirement: "No synthetic fabric", priority: "RESTRICTED" }, A);

// Unverified body (manual, not designer-verified) → body finding.
await call("POST", `/api/projects/${pid}/body`, { heightCm: 165, waistCm: 76 }, A);

// Basket: verified textile WITH source (passes), sourceless motif (flagged),
// restricted ornament unapproved (CRITICAL).
const els = await call("GET", "/api/cultural-elements", null, A);
const byName = (n) => els.json?.data?.find((e) => e.name === n);
const textile = byName("Ikat Ceremonial Wrap");
const motif = byName("Fern-Spine Motif");
const garment = byName("Festival Barong"); // UNDER_REVIEW + sourceless
const ornament = byName("Ancestral Headdress Ornament"); // RESTRICTED
for (const el of [textile, motif, garment, ornament]) {
  await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: el.id, role: "REFERENCE" }, A);
}

const gen = await call("POST", "/api/designs/generate", { projectId: pid }, A);
const designId = gen.json?.data?.design?.id;
const versionId = gen.json?.data?.version?.id;
check("design generated", gen.status === 201 && !!versionId, `got ${gen.status}`);

// Link a LIMITED material without calculating cost → material + cost findings.
const lib = await call("GET", "/api/materials", null, A);
const beads = lib.json?.data?.find((m) => m.materialCode === "MAT-DEMO-003");
await call("POST", `/api/versions/${versionId}/materials`, { materialId: beads.id, quantity: 10, unit: "piece" }, A);

// --- evaluate ---
const ev = await call("POST", `/api/designs/${designId}/evaluate`, {}, A);
let evaluation = ev.json?.data?.evaluation;
const coverage = ev.json?.data?.coverage;
check("evaluate 201 + review required", ev.status === 201 && evaluation?.overallStatus === "REVIEW_REQUIRED", `got ${ev.status} ${evaluation?.overallStatus}`);
check(
  "mandatory coverage counted",
  coverage?.mandatory?.total === 1 && coverage?.mandatory?.satisfied === 1,
  JSON.stringify(coverage?.mandatory),
);
check("restricted clean", coverage?.restrictedViolations === 0, `got ${coverage?.restrictedViolations}`);

const latest = await call("GET", `/api/designs/${designId}/evaluation`, null, A);
const findingsV1 = latest.json?.data?.findings ?? [];
check("sourceless element flagged", findingsV1.some((f) => f.finding.toLowerCase().includes("no supporting source")), `total=${findingsV1.length}`);
check("body finding present", findingsV1.some((f) => f.category === "BODY"));
check("cost finding present (no estimate)", findingsV1.some((f) => f.category === "COST"));
check("material availability flagged (LIMITED)", findingsV1.some((f) => f.category === "MATERIAL"));
check(
  "domain statuses set",
  ["culturalStatus", "requirementStatus", "bodyStatus", "costStatus", "materialStatus"].every((k) => latest.json?.data?.evaluation?.[k]),
  JSON.stringify({ c: latest.json?.data?.evaluation?.culturalStatus, r: latest.json?.data?.evaluation?.requirementStatus }),
);

// --- designer overrides the guardrail: v2 includes the restricted ornament ---
const regen = await call("POST", `/api/designs/${designId}/regenerate`, { instruction: "Use Ancestral Headdress Ornament as the centerpiece" }, A);
check("override regenerate v2", regen.status === 201 && regen.json?.data?.version?.versionNumber === 2, `got ${regen.status}`);
await call("POST", `/api/designs/${designId}/evaluate`, {}, A);
const v2state = await call("GET", `/api/designs/${designId}/evaluation`, null, A);
evaluation = v2state.json?.data?.evaluation;
const findings = v2state.json?.data?.findings ?? [];
check("cultural CRITICAL for restricted ornament", findings.some((f) => f.severity === "CRITICAL" && f.category === "CULTURAL"), `critical=${findings.filter((f) => f.severity === "CRITICAL").length}`);

// --- approval blocked by CRITICAL ---
const blocked = await call("POST", `/api/evaluation/${evaluation.id}/approve`, { comment: "too early" }, A);
check("approve blocked 422 on CRITICAL", blocked.status === 422, `got ${blocked.status}`);

// --- resolve all, then approve ---
for (const f of findings.filter((x) => !x.resolved)) {
  await call("POST", `/api/evaluation/findings/${f.id}/resolve`, { comment: "smoke review" }, A);
}
const afterResolve = await call("GET", `/api/designs/${designId}/evaluation`, null, A);
check(
  "all findings resolved",
  afterResolve.json?.data?.findings?.every((f) => f.resolved),
  `open=${afterResolve.json?.data?.findings?.filter((f) => !f.resolved).length}`,
);
const approved = await call("POST", `/api/evaluation/${evaluation.id}/approve`, { comment: "smoke approval" }, A);
check("approve 201 after resolution", approved.status === 201 && approved.json?.data?.finalApproval === true, `got ${approved.status}`);

// --- re-evaluation creates a new snapshot row ---
const ev2 = await call("POST", `/api/designs/${designId}/evaluate`, {}, A);
check(
  "re-evaluation is a new snapshot",
  ev2.status === 201 && ev2.json?.data?.evaluation?.id !== evaluation.id,
  `got ${ev2.status}`,
);

// --- revision request path ---
const rev = await call("POST", `/api/evaluation/${ev2.json?.data?.evaluation?.id}/request-revision`, { comment: "smoke: adjust motif" }, A);
check("request revision 201", rev.status === 201, `got ${rev.status}`);

const revBad = await call("POST", `/api/evaluation/${ev2.json?.data?.evaluation?.id}/request-revision`, { comment: "" }, A);
check("revision needs instructions 400", revBad.status === 400, `got ${revBad.status}`);

// --- pages ---
for (const p of ["/evaluations", `/design-studio/${designId}`]) {
  const pg = await fetch(BASE + p, { headers: { Cookie: A } });
  check(`page ${p} 200`, pg.status === 200, `got ${pg.status}`);
}

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
