// Retrieval smoke: hybrid ranked search (read-only — uses demo seed data).
// Run: node scripts/smoke-retrieval.mjs (dev server on :3100).
const BASE = "http://localhost:3100";

async function call(method, path, cookie = "") {
  const res = await fetch(BASE + path, {
    method,
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json, cookie: (res.headers.get("set-cookie") || "").split(";")[0] };
}

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@attirelab.local", password: "Admin123!" }),
  redirect: "manual",
});
const loginJson = await login.json().catch(() => null);
const A = (login.headers.get("set-cookie") || "").split(";")[0];
check("admin login", login.status === 200 && A.length > 0, `got ${login.status} ${JSON.stringify(loginJson)?.slice(0, 60)}`);

const anon = await call("GET", "/api/cultural-elements?q=textile");
check("search requires auth 401", anon.status === 401, `got ${anon.status}`);

const ranked = await call("GET", "/api/cultural-elements?q=textile", A);
const rows = ranked.json?.data ?? [];
const retrieval = ranked.json?.retrieval ?? {};
check("ranked search returns rows", ranked.status === 200 && rows.length > 0, `got ${rows.length}`);
check(
  "retrieval evidence attached",
  rows.length > 0 && rows.every((r) => retrieval[r.id]?.via?.length > 0),
  `got ${Object.keys(retrieval).length} entries`,
);
const exact = await call("GET", "/api/cultural-elements?q=Ikat%20Ceremonial%20Wrap", A);
check(
  "exact name ranks first",
  exact.status === 200 && exact.json?.data?.[0]?.name === "Ikat Ceremonial Wrap",
  `got ${exact.json?.data?.[0]?.name}`,
);
check(
  "exact hit labeled exact-name",
  exact.json?.retrieval?.[exact.json?.data?.[0]?.id]?.via?.includes("exact-name") === true,
);

const filtered = await call("GET", "/api/cultural-elements?q=textile&verifiedOnly=1", A);
check(
  "verified-only respected",
  filtered.status === 200 && filtered.json?.data?.every((r) => r.validationStatus === "VERIFIED"),
  `got ${filtered.json?.data?.length}`,
);

const empty = await call("GET", "/api/cultural-elements?q=NoSuchElementZzxq", A);
check("no-match returns empty", empty.status === 200 && empty.json?.data?.length === 0);

const legacy = await call("GET", "/api/cultural-elements", A);
check("no-q legacy path intact", legacy.status === 200 && legacy.json?.data?.length > 0 && !("retrieval" in (legacy.json ?? {})));

const page = await fetch(BASE + "/culture?q=textile", {
  headers: { Cookie: A },
  redirect: "manual",
});
check("culture page renders ranked", page.status === 200, `got ${page.status}`);

const failed = results.filter((r) => r.startsWith("FAIL"));
console.log(results.join("\n"));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
