// MVP 8 smoke test: vision body analysis (mock-first).
// Run: node scripts/smoke-vision.mjs (dev server on :3100).
const BASE = "http://localhost:3100";

async function jsonCall(method, path, body, cookie = "") {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json: parsed, cookie: (res.headers.get("set-cookie") || "").split(";")[0] };
}

async function upload(path, fields, cookie = "") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
    redirect: "manual",
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json: parsed };
}

// 1x1 PNG — valid magic bytes for the upload validator.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const photo = new Blob([PNG], { type: "image/png" });

const results = [];
function check(name, cond, extra = "") {
  results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

const login = await jsonCall("POST", "/api/auth/login", {
  email: "admin@attirelab.local",
  password: "Admin123!",
});
const A = login.cookie;
check("admin login", login.status === 200 && A.length > 0);

const proj = await jsonCall("POST", "/api/projects", { name: "Smoke Vision" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

const anon = await upload(`/api/projects/${pid}/body/analysis`, { photo, consent: "yes" });
check("analysis requires auth 401", anon.status === 401, `got ${anon.status}`);

const noConsent = await upload(`/api/projects/${pid}/body/analysis`, { photo }, A);
check("consent required 422", noConsent.status === 422 && noConsent.json?.code === "BODY_CONSENT_REQUIRED", `got ${noConsent.status}`);

const badFile = await upload(
  `/api/projects/${pid}/body/analysis`,
  { photo: new Blob(["not an image"], { type: "image/png" }), consent: "yes" },
  A,
);
check("bad signature rejected 400", badFile.status === 400, `got ${badFile.status}`);

const analysis = await upload(`/api/projects/${pid}/body/analysis`, { photo, consent: "yes" }, A);
const profile = analysis.json?.data?.profile;
check(
  "analysis 201 COMPUTER_VISION unverified",
  analysis.status === 201 &&
    profile?.measurementSource === "COMPUTER_VISION" &&
    profile?.designerVerified === false &&
    !!analysis.json?.data?.imageUrl,
  `got ${analysis.status}`,
);
const estId = profile?.id;

const accept = await jsonCall("PATCH", `/api/projects/${pid}/body/${estId}`, { designerVerified: true }, A);
check("accept estimate (verify)", accept.status === 200 && accept.json?.data?.designerVerified === true, `got ${accept.status}`);

const analysis2 = await upload(`/api/projects/${pid}/body/analysis`, { photo, consent: "yes" }, A);
const estId2 = analysis2.json?.data?.profile?.id;
check("second estimate created", analysis2.status === 201 && !!estId2, `got ${analysis2.status}`);

const delManual = await jsonCall("DELETE", `/api/projects/${pid}/body/${estId}`, null, A);
check("accepted CV estimate still removable", delManual.status === 200, `got ${delManual.status}`);

const manual = await jsonCall("POST", `/api/projects/${pid}/body`, { heightCm: 170 }, A);
const delProtected = await jsonCall("DELETE", `/api/projects/${pid}/body/${manual.json?.data?.id}`, null, A);
check("manual history protected 422", delProtected.status === 422, `got ${delProtected.status}`);

const del = await jsonCall("DELETE", `/api/projects/${pid}/body/${estId2}`, null, A);
check("reject estimate 200", del.status === 200, `got ${del.status}`);

const jobs = await jsonCall("GET", `/api/projects/${pid}/body/analysis`, null, A);
check("vision jobs listed", jobs.status === 200 && jobs.json?.data?.length >= 2, `got ${jobs.json?.data?.length}`);

const failed = results.filter((r) => r.startsWith("FAIL"));
console.log(results.join("\n"));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
