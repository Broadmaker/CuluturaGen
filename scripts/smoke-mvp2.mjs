// MVP 2 smoke test: cultures, elements, workflow, refs, restrictions,
// relationships, basket, pages. Run: node scripts/smoke-mvp2.mjs
// Requires: dev server on :3100, seed + sample seed applied.
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
  return { status: res.status, json, cookie: setCookie ? setCookie.split(";")[0] : "" };
}

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

// --- auth: admin + fresh designer ---
const adminLogin = await call("POST", "/api/auth/login", {
  email: "admin@attirelab.local",
  password: "Admin123!",
});
const A = adminLogin.cookie;
check("admin login", adminLogin.status === 200 && A.length > 0);

const email = `designer${Date.now()}@test.local`;
const reg = await call("POST", "/api/auth/register", {
  email,
  password: "Designer123!",
});
const D = reg.cookie;
check("designer register", reg.status === 201 && D.length > 0, `got ${reg.status}`);

// --- cultures ---
const cultures = await call("GET", "/api/cultures", null, A);
const cultureA = cultures.json?.data?.find((c) => c.name === "SAMPLE Culture A");
check("cultures list has sample", cultures.status === 200 && !!cultureA, `count=${cultures.json?.data?.length}`);
const cultureB = cultures.json?.data?.find((c) => c.name === "SAMPLE Culture B");

// --- elements search ---
const all = await call("GET", "/api/cultural-elements?q=Sample", null, A);
check("search finds samples", all.status === 200 && all.json?.data?.length >= 7, `got ${all.json?.data?.length}`);

const verified = await call("GET", "/api/cultural-elements?verifiedOnly=1", null, A);
check(
  "verifiedOnly filter",
  verified.status === 200 &&
    verified.json?.data?.length > 0 &&
    verified.json.data.every((e) => e.validationStatus === "VERIFIED"),
  `got ${verified.json?.data?.length}`,
);

const byCulture = await call("GET", `/api/cultural-elements?cultureId=${cultureA.id}`, null, A);
check(
  "culture filter (direct + community traversal)",
  byCulture.status === 200 && byCulture.json?.data?.length >= 4,
  `got ${byCulture.json?.data?.length}`,
);

// --- create + workflow (as designer) ---
const created = await call(
  "POST",
  "/api/cultural-elements",
  { name: "Smoke Motif", category: "MOTIF", description: "smoke", cultureId: cultureB.id },
  D,
);
check(
  "create starts UNVERIFIED",
  created.status === 201 && created.json?.data?.validationStatus === "UNVERIFIED",
  `got ${created.status}`,
);
const elId = created.json?.data?.id;

const skip = await call("PATCH", `/api/cultural-elements/${elId}`, { status: "VERIFIED" }, D);
check("skip-to-VERIFIED rejected 422", skip.status === 422, `got ${skip.status}`);

const submit = await call("PATCH", `/api/cultural-elements/${elId}`, { status: "UNDER_REVIEW" }, D);
check("submit for review 200", submit.status === 200, `got ${submit.status}`);

const designerApprove = await call("PATCH", `/api/cultural-elements/${elId}`, { status: "VERIFIED" }, D);
check("designer approve forbidden 403", designerApprove.status === 403, `got ${designerApprove.status}`);

const approve = await call("PATCH", `/api/cultural-elements/${elId}`, { status: "VERIFIED" }, A);
check("admin approve 200", approve.status === 200, `got ${approve.status}`);

// --- restriction gating ---
const restrDesigner = await call(
  "POST",
  `/api/cultural-elements/${elId}/restrictions`,
  { restrictionType: "SACRED", description: "smoke" },
  D,
);
check("designer restriction forbidden 403", restrDesigner.status === 403, `got ${restrDesigner.status}`);

const restr = await call(
  "POST",
  `/api/cultural-elements/${elId}/restrictions`,
  { restrictionType: "CONTEXT_RESTRICTED", description: "smoke restriction", severity: "LOW" },
  A,
);
check("admin restriction 201", restr.status === 201, `got ${restr.status}`);

// --- reference create + attach + detail ---
const ref = await call("POST", "/api/references", { title: "Smoke Source", sourceType: "BOOK" }, A);
check("reference create 201", ref.status === 201, `got ${ref.status}`);

const attach = await call(
  "POST",
  `/api/cultural-elements/${elId}/references`,
  { referenceId: ref.json?.data?.id },
  A,
);
check("attach reference 201", attach.status === 201, `got ${attach.status}`);

const detail = await call("GET", `/api/cultural-elements/${elId}`, null, A);
check(
  "detail bundle (refs+restrictions+links)",
  detail.status === 200 &&
    detail.json?.data?.references?.length === 1 &&
    detail.json?.data?.restrictions?.length === 1 &&
    detail.json?.data?.outgoingLinks?.length >= 1,
  `refs=${detail.json?.data?.references?.length} restr=${detail.json?.data?.restrictions?.length} links=${detail.json?.data?.outgoingLinks?.length}`,
);

// --- basket ---
const proj = await call("POST", "/api/projects", { name: "Smoke Basket" }, A);
const pid = proj.json?.data?.id;
check("project for basket", proj.status === 201, `got ${proj.status}`);

const add = await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: elId, role: "REQUIRED", notes: "smoke" }, A);
check("basket add 201", add.status === 201, `got ${add.status}`);

const basket = await call("GET", `/api/projects/${pid}/basket`, null, A);
check(
  "basket lists item",
  basket.status === 200 && basket.json?.data?.some((b) => b.culturalElementId === elId),
  `count=${basket.json?.data?.length}`,
);

const unadd = await call("DELETE", `/api/projects/${pid}/basket/${elId}`, null, A);
const basket2 = await call("GET", `/api/projects/${pid}/basket`, null, A);
check("basket remove", unadd.status === 200 && basket2.json?.data?.length === 0, `got ${unadd.status}`);

// --- pages ---
for (const p of ["/culture", "/culture/new", `/culture/${elId}`, `/projects/${pid}`]) {
  const r = await fetch(BASE + p, { headers: { Cookie: A } });
  check(`page ${p} 200`, r.status === 200, `got ${r.status}`);
}

// --- cleanup: soft-delete project (elements stay as knowledge) ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
