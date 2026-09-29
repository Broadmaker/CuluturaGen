// MVP 1 smoke test: login -> create -> invalid transition -> valid transition
// -> detail page -> soft delete -> verify. Run: node /tmp/smoke.mjs
const BASE = "http://localhost:3100";
let cookie = "";

async function call(method, path, body) {
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
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html page */
  }
  return { status: res.status, json, text };
}

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

const login = await call("POST", "/api/auth/login", {
  email: "admin@attirelab.local",
  password: "Admin123!",
});
check("login 200 + roles", login.status === 200 && login.json?.user?.roles?.includes("ADMIN"), JSON.stringify(login.json?.user?.roles));

const created = await call("POST", "/api/projects", {
  name: "Smoke E2E",
  budget: 25000,
  occasion: "Festival",
});
check("create 201 + code + brief", created.status === 201 && created.json?.data?.projectCode?.startsWith("PRJ-"), created.json?.data?.projectCode);
const id = created.json?.data?.id;

const bad = await call("PATCH", `/api/projects/${id}`, { status: "COMPLETED" });
check("invalid DRAFT->COMPLETED = 422", bad.status === 422, `got ${bad.status}`);

const good = await call("PATCH", `/api/projects/${id}`, { status: "RESEARCH" });
check("valid DRAFT->RESEARCH = 200", good.status === 200 && good.json?.data?.status === "RESEARCH", `got ${good.status}`);

const page = await call("GET", `/projects/${id}`);
check("detail page 200", page.status === 200, `got ${page.status}`);

const dash = await call("GET", "/dashboard");
check("dashboard 200", dash.status === 200, `got ${dash.status}`);

const anon = await fetch(BASE + "/dashboard", { redirect: "manual" });
check("anon dashboard redirects", anon.status >= 300 && anon.status < 400, `got ${anon.status}`);

const del = await call("DELETE", `/api/projects/${id}`);
check("soft delete 200", del.status === 200, `got ${del.status}`);

const list = await call("GET", "/api/projects");
check("deleted hidden from list", list.status === 200 && !list.json?.data?.some((p) => p.id === id), `count=${list.json?.data?.length}`);

console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
