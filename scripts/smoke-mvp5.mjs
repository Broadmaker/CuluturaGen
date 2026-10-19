// MVP 5 smoke test: materials, price history, engine math, snapshots.
// Run: node scripts/smoke-mvp5.mjs (dev server on :3100).
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

// --- materials ---
const lib = await call("GET", "/api/materials", null, A);
const textile = lib.json?.data?.find((m) => m.materialCode === "MAT-DEMO-001");
check("demo library present", lib.status === 200 && !!textile, `count=${lib.json?.data?.length}`);
const P0 = textile?.latestPrice ? Number(textile.latestPrice.price) : NaN;
check("latest price resolved", lib.status === 200 && Number.isFinite(P0) && P0 > 0, `price=${textile?.latestPrice?.price}`);

const detail = await call("GET", `/api/materials/${textile.id}`, null, A);
check("price history kept (append-only)", detail.status === 200 && detail.json?.data?.prices?.length >= 2, `got ${detail.json?.data?.prices?.length}`);

const priceless = lib.json?.data?.find((m) => m.materialCode === "MAT-DEMO-004");
check("priceless demo material present", !!priceless);

const created = await call("POST", "/api/materials", { name: "Smoke Linen", category: "FABRIC", unit: "meter" }, A);
check("material create 201", created.status === 201, `got ${created.status}`);
const linenId = created.json?.data?.id;

const priced = await call("POST", `/api/materials/${linenId}/prices`, { price: 500, unit: "meter", source: "SUPPLIER_QUOTE", supplier: "Smoke Co" }, A);
check("price append 201", priced.status === 201, `got ${priced.status}`);

const priced2 = await call("POST", `/api/materials/${linenId}/prices`, { price: 550, unit: "meter", source: "SUPPLIER_QUOTE" }, A);
const hist = await call("GET", `/api/materials/${linenId}`, null, A);
check("history appends (2 rows)", priced2.status === 201 && hist.json?.data?.prices?.length === 2, `got ${hist.json?.data?.prices?.length}`);

// --- project + design with known math ---
const proj = await call("POST", "/api/projects", { name: "Smoke Cost" }, A);
const pid = proj.json?.data?.id;
await call("POST", `/api/projects/${pid}/briefs`, { budget: 30000 }, A);
const gen = await call("POST", "/api/designs/generate", { projectId: pid }, A);
const designId = gen.json?.data?.design?.id;
const versionId = gen.json?.data?.version?.id;
check("design generated", gen.status === 201 && !!versionId, `got ${gen.status}`);

// 4m × P0 + labor 8h × 180 + contingency 10% — computed from live price.
const expMat = +(4 * P0).toFixed(2);
const expDirect = +(expMat + 1440).toFixed(2);
const expCont = +(expDirect * 0.1).toFixed(2);
const expTotal = +(expDirect + expCont).toFixed(2);
await call("POST", `/api/versions/${versionId}/materials`, { materialId: textile.id, quantity: 4, unit: "meter" }, A);
const calc = await call("POST", `/api/versions/${versionId}/cost/calculate`, {
  labor: [{ description: "Sewing", quantity: 8, unit: "hour", unitPrice: 180 }],
}, A);
const r = calc.json?.data;
check(
  `engine math exact (${expTotal}, UNDER_BUDGET)`,
  calc.status === 201 && r?.estimatedTotal === expTotal && r?.materials === expMat && r?.labor === 1440 &&
    r?.contingency === expCont && r?.status === "UNDER_BUDGET" && r?.budget === 30000,
  `total=${r?.estimatedTotal} status=${r?.status}`,
);

// --- missing price → INCOMPLETE, never invented ---
await call("POST", `/api/versions/${versionId}/materials`, { materialId: priceless.id, quantity: 2 }, A);
const calc2 = await call("POST", `/api/versions/${versionId}/cost/calculate`, {}, A);
check(
  "missing price → INCOMPLETE",
  calc2.status === 201 && calc2.json?.data?.status === "INCOMPLETE" &&
    calc2.json?.data?.missingPrices?.length === 1,
  `status=${calc2.json?.data?.status}`,
);

// --- snapshot immutability: new price must not rewrite history ---
const snap1 = await call("GET", `/api/cost/calculations/${r.estimateId}`, null, A);
await call("POST", `/api/materials/${textile.id}/prices`, { price: 950, unit: "meter", source: "SUPPLIER_QUOTE" }, A);
const snap1Again = await call("GET", `/api/cost/calculations/${r.estimateId}`, null, A);
check(
  "snapshot frozen after price change",
  snap1.status === 200 && snap1Again.json?.data?.totalCost === snap1.json?.data?.totalCost,
  `total=${snap1Again.json?.data?.totalCost}`,
);
await fetch(`${BASE}/api/versions/${versionId}/materials?materialId=${priceless.id}`, { method: "DELETE", headers: { Cookie: A } });
const calc3 = await call("POST", `/api/versions/${versionId}/cost/calculate`, {
  labor: [{ description: "Sewing", quantity: 8, unit: "hour", unitPrice: 180 }],
}, A);
// New price is latest-by-effectiveDate, so recalc must use 950 (4×950=3800)
// regardless of what the seed price was.
check("new price reflected in recalc (4×950)", calc3.json?.data?.materials === 3800, `materials=${calc3.json?.data?.materials}`);

const history = await call("GET", `/api/designs/${designId}/cost-history`, null, A);
check("cost history lists estimates", history.status === 200 && history.json?.data?.length >= 3, `got ${history.json?.data?.length}`);

// --- invalid inputs rejected (route guard 400; engine 422 covered in vitest) ---
const badQty = await call("POST", `/api/versions/${versionId}/cost/calculate`, {
  labor: [{ description: "Sewing", quantity: -2, unitPrice: 180 }],
}, A);
check("negative quantity rejected 400", badQty.status === 400, `got ${badQty.status}`);
const badCont = await call("POST", `/api/versions/${versionId}/cost/calculate`, { contingencyPct: 150 }, A);
check("contingency >100 rejected 400", badCont.status === 400, `got ${badCont.status}`);

// --- pages ---
for (const p of ["/materials", `/materials/${textile.id}`, `/design-studio/${designId}`]) {
  const pg = await fetch(BASE + p, { headers: { Cookie: A } });
  check(`page ${p} 200`, pg.status === 200, `got ${pg.status}`);
}

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
