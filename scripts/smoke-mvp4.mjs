// MVP 4 smoke test: mock generation pipeline end to end.
// Run: node scripts/smoke-mvp4.mjs (dev server on :3100, AI_PROVIDER=mock).
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

// Rich project: brief + body + verified basket element.
const proj = await call("POST", "/api/projects", { name: "Smoke Gen", budget: 30000, occasion: "Festival" }, A);
const pid = proj.json?.data?.id;
check("project created", proj.status === 201 && !!pid, `got ${proj.status}`);

await call("POST", `/api/projects/${pid}/body`, { heightCm: 165, waistCm: 76 }, A);

const els = await call("GET", "/api/cultural-elements?verifiedOnly=1", null, A);
const textile = els.json?.data?.find((e) => e.category === "TEXTILE");
check("sample textile available", !!textile, textile?.name);
await call("POST", `/api/projects/${pid}/basket`, { culturalElementId: textile.id, role: "REQUIRED" }, A);

// --- generate ---
const gen = await call("POST", "/api/designs/generate", { projectId: pid, instruction: "Keep it simple" }, A);
check("generate 201 + mock provider", gen.status === 201 && gen.json?.data?.provider === "mock", `got ${gen.status}`);
const designId = gen.json?.data?.design?.id;
const v1 = gen.json?.data?.version;
const spec = v1?.designSpecification;
check(
  "spec valid (garments + cultural + explanation)",
  !!spec && spec.garmentComponents?.length >= 1 && spec.culturalElements?.length >= 1 && !!spec.aiExplanation?.summary,
  `elements=${spec?.culturalElements?.length}`,
);
check("spec uses basket textile", spec?.textiles?.includes(textile.name), JSON.stringify(spec?.textiles));
check("image url stored", typeof v1?.generatedImageUrl === "string" && v1.generatedImageUrl.startsWith("/api/files/"), v1?.generatedImageUrl);

// --- image serving ---
const img = await fetch(BASE + v1.generatedImageUrl, { headers: { Cookie: A } });
check("generated image serves (svg)", img.status === 200 && (img.headers.get("content-type") || "").includes("svg"), `got ${img.status}`);

const imgAnon = await fetch(BASE + v1.generatedImageUrl, { redirect: "manual" });
check("image requires auth", imgAnon.status === 401, `got ${imgAnon.status}`);

// --- versions + jobs ---
const versions = await call("GET", `/api/designs/${designId}/versions`, null, A);
check(
  "versions + completed jobs",
  versions.status === 200 &&
    versions.json?.data?.versions?.length === 1 &&
    versions.json?.data?.jobs?.filter((j) => j.status === "COMPLETED").length === 2,
  `v=${versions.json?.data?.versions?.length} jobs=${versions.json?.data?.jobs?.length}`,
);

// --- regenerate lineage ---
const regen = await call("POST", `/api/designs/${designId}/regenerate`, { instruction: "More traditional" }, A);
const v2 = regen.json?.data?.version;
check(
  "regenerate v2 with lineage",
  regen.status === 201 && v2?.versionNumber === 2 && !!v2?.parentVersionId,
  `got ${regen.status} v=${v2?.versionNumber}`,
);
check("revision instruction in explanation", (v2?.designSpecification?.aiExplanation?.summary || "").includes("More traditional"));

// --- studio pages ---
const studio1 = await fetch(`${BASE}/design-studio/${designId}?v=1`, { headers: { Cookie: A } });
const studio1Text = await studio1.text();
check("studio v1 200 + element shown", studio1.status === 200 && studio1Text.includes(textile.name), `got ${studio1.status}`);

const studio2 = await fetch(`${BASE}/design-studio/${designId}`, { headers: { Cookie: A } });
check("studio latest (v2) 200", studio2.status === 200, `got ${studio2.status}`);

const index = await fetch(`${BASE}/design-studio`, { headers: { Cookie: A } });
check("studio index 200", index.status === 200, `got ${index.status}`);

// --- errors ---
const badProject = await call("POST", "/api/designs/generate", { projectId: "00000000-0000-0000-0000-000000000000" }, A);
check("unknown project 404", badProject.status === 404, `got ${badProject.status}`);

const badDesign = await call("POST", "/api/designs/00000000-0000-0000-0000-000000000000/regenerate", {}, A);
check("unknown design 404", badDesign.status === 404, `got ${badDesign.status}`);

const anon = await call("POST", "/api/designs/generate", { projectId: pid });
check("anon generate 401", anon.status === 401, `got ${anon.status}`);

// --- cleanup ---
await call("DELETE", `/api/projects/${pid}`, null, A);

console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
