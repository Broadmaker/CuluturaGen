// Reports smoke test: full dossier PDF end to end.
// Run: node scripts/smoke-reports.mjs (dev server on :3100).
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

// Full pipeline project: brief + body + basket + design + cost + evaluation.
const proj = await call("POST", "/api/projects", { name: "Smoke Report", budget: 30000, occasion: "Festival" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

await call("POST", `/api/projects/${pid}/briefs`, { occasion: "Festival", silhouette: "Fitted" }, A);
await call("POST", `/api/projects/${pid}/body`, { heightCm: 165, waistCm: 76 }, A);

const els = await call("GET", "/api/cultural-elements?q=Sample", null, A);
const textile = els.json?.data?.find((e) => e.name === "Sample Textile A");
await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: textile.id, role: "REQUIRED" }, A);

const gen = await call("POST", "/api/designs/generate", { projectId: pid }, A);
const designId = gen.json?.data?.design?.id;
const versionId = gen.json?.data?.version?.id;
check("design generated", gen.status === 201 && !!versionId, `got ${gen.status}`);

const lib = await call("GET", "/api/materials?q=Sample", null, A);
const mat = lib.json?.data?.find((m) => m.materialCode === "MAT-SAMPLE-001");
await call("POST", `/api/versions/${versionId}/materials`, { materialId: mat.id, quantity: 2 }, A);
await call("POST", `/api/versions/${versionId}/cost/calculate`, {}, A);
await call("POST", `/api/designs/${designId}/evaluate`, {}, A);

// --- report types ---
const bad = await call("POST", `/api/projects/${pid}/reports`, { reportType: "NOPE" }, A);
check("bad type rejected 400", bad.status === 400, `got ${bad.status}`);

const final = await call("POST", `/api/projects/${pid}/reports`, { reportType: "FINAL_REPORT", designId }, A);
check("final report 201", final.status === 201 && !!final.json?.data?.url, `got ${final.status}`);
const url = final.json?.data?.url;

const pdf = await fetch(BASE + url, { headers: { Cookie: A } });
const buf = Buffer.from(await pdf.arrayBuffer());
check(
  "PDF serves with magic bytes",
  pdf.status === 200 && (pdf.headers.get("content-type") || "").includes("pdf") && buf.subarray(0, 4).toString() === "%PDF",
  `got ${pdf.status} ${buf.subarray(0, 4).toString()}`,
);
check("PDF non-trivial size", buf.length > 3000, `${buf.length} bytes`);

const cultural = await call("POST", `/api/projects/${pid}/reports`, { reportType: "CULTURAL_REPORT" }, A);
check("cultural report 201", cultural.status === 201, `got ${cultural.status}`);

const list = await call("GET", `/api/projects/${pid}/reports`, null, A);
check("report list (2)", list.status === 200 && list.json?.data?.length === 2, `got ${list.json?.data?.length}`);

// --- pages ---
for (const p of ["/reports", `/projects/${pid}`, `/design-studio/${designId}`]) {
  const pg = await fetch(BASE + p, { headers: { Cookie: A } });
  check(`page ${p} 200`, pg.status === 200, `got ${pg.status}`);
}

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
