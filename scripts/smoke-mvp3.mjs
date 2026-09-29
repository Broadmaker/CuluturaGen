// MVP 3 smoke test: clients, body snapshots, briefs, requirements.
// Run: node scripts/smoke-mvp3.mjs (dev server on :3100).
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

const login = await call("POST", "/api/auth/login", {
  email: "admin@attirelab.local",
  password: "Admin123!",
});
const A = login.cookie;
check("admin login", login.status === 200 && A.length > 0);

const proj = await call("POST", "/api/projects", { name: "Smoke Brief" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

// --- clients ---
const client = await call("POST", `/api/projects/${pid}/clients`, { name: "Smoke Client" }, A);
check("client create 201", client.status === 201, `got ${client.status}`);
const cid = client.json?.data?.id;

const clientList = await call("GET", `/api/projects/${pid}/clients`, null, A);
check("client list", clientList.status === 200 && clientList.json?.data?.length === 1, `got ${clientList.json?.data?.length}`);

// --- body: snapshot history ---
const b1 = await call(
  "POST",
  `/api/projects/${pid}/body`,
  { clientId: cid, heightCm: 165, waistCm: 76, designerVerified: false },
  A,
);
check("body snapshot 1 (MANUAL)", b1.status === 201 && b1.json?.data?.measurementSource === "MANUAL", `got ${b1.status}`);

const bad = await call("POST", `/api/projects/${pid}/body`, { waistCm: -5 }, A);
check("negative measurement rejected 400", bad.status === 400, `got ${bad.status}`);

const b2 = await call("POST", `/api/projects/${pid}/body`, { heightCm: 166, waistCm: 76 }, A);
check("body snapshot 2 (history)", b2.status === 201, `got ${b2.status}`);

const patch = await call(
  "PATCH",
  `/api/projects/${pid}/body/${b2.json?.data?.id}`,
  { waistCm: 77, designerVerified: true },
  A,
);
check("body correction + verify", patch.status === 200 && patch.json?.data?.designerVerified === true, `got ${patch.status}`);

const history = await call("GET", `/api/projects/${pid}/body`, null, A);
check("body history kept (2 rows)", history.status === 200 && history.json?.data?.length === 2, `got ${history.json?.data?.length}`);

// --- brief + requirements ---
const briefGet = await call("GET", `/api/projects/${pid}/briefs`, null, A);
check("brief initially null", briefGet.status === 200 && briefGet.json?.data === null, `got ${JSON.stringify(briefGet.json?.data)}`);

const brief = await call(
  "POST",
  `/api/projects/${pid}/briefs`,
  { occasion: "Festival", silhouette: "Fitted", budget: 30000 },
  A,
);
check("brief create 201", brief.status === 201, `got ${brief.status}`);
const bid = brief.json?.data?.id;

const reqBad = await call(
  "POST",
  `/api/briefs/${bid}/requirements`,
  { category: "CULTURAL", requirement: "x", priority: "URGENT" },
  A,
);
check("bad priority rejected 400", reqBad.status === 400, `got ${reqBad.status}`);

const r1 = await call(
  "POST",
  `/api/briefs/${bid}/requirements`,
  { category: "CULTURAL", requirement: "Use documented traditional textile", priority: "MANDATORY" },
  A,
);
check("mandatory requirement 201", r1.status === 201, `got ${r1.status}`);

const r2 = await call(
  "POST",
  `/api/briefs/${bid}/requirements`,
  { category: "MATERIAL", requirement: "No synthetic fabric", priority: "RESTRICTED" },
  A,
);
check("restricted requirement 201", r2.status === 201, `got ${r2.status}`);

const repri = await call("PATCH", `/api/briefs/${bid}/requirements/${r1.json?.data?.id}`, { priority: "PREFERRED" }, A);
check("reprioritize 200", repri.status === 200 && repri.json?.data?.priority === "PREFERRED", `got ${repri.status}`);

const deact = await call("DELETE", `/api/briefs/${bid}/requirements/${r2.json?.data?.id}`, null, A);
const briefAfter = await call("GET", `/api/projects/${pid}/briefs`, null, A);
const reqs = briefAfter.json?.data?.requirements ?? [];
check(
  "deactivation preserves history",
  deact.status === 200 && reqs.length === 2 && reqs.filter((r) => r.isActive !== false).length === 1,
  `total=${reqs.length}`,
);

// --- pages ---
for (const p of [`/projects/${pid}/requirements`, `/projects/${pid}/body`]) {
  const r = await fetch(BASE + p, { headers: { Cookie: A } });
  check(`page ${p} 200`, r.status === 200, `got ${r.status}`);
}

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
