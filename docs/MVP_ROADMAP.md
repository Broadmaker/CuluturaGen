# MVP Roadmap — derived from md/01 §50, md/02 §52, md/03 §74–76, md/08 §126

> 🛑 **OPEN ENVIRONMENT ISSUE (2026-10-05, details at bottom): generated
> files (`node_modules` package bodies, `.next` build output) vanish within
> minutes on this dev machine. Workaround inside — code is unaffected.**

## MVP 1 — Application Foundation ✅ built + verified
- [x] Next.js + TS + Tailwind shell, layout, dashboard/projects/culture/studio pages
- [x] Drizzle schema (all 32 MVP tables) + migrations, seed roles + admin, `.env.example`
- [x] Auth + RBAC (ADMIN/DESIGNER/CULTURAL_EXPERT/RESEARCHER/VIEWER)
- [x] Dashboard stats, project CRUD + status machine (md/02 §44)
- [x] typecheck + build + smoke-mvp1.mjs 9/9

## MVP 2 — Cultural Knowledge ✅ built + verified
- [x] Tables: cultures, communities, cultural_elements, references,
  element_references, restrictions + cultural_element_relationships (pulled
  forward from Phase 2 for culture filtering/related) + project basket
  (`project_cultural_elements`, md/08 §23)
- [x] Search + filters (incl. verified-only + culture scope with community
  traversal), validation badges, workflow (UNVERIFIED→UNDER_REVIEW→VERIFIED,
  RESTRICTED/DEPRECATED, role-gated), detail page (sources, restrictions,
  associations, related), Add-to-Project basket on project pages
- [x] DEMO-coded demo data (fictional Amihan/Sinag cultures, thesis-safe — not real knowledge)
- [x] typecheck + build + smoke-mvp2.mjs 24/24 (smoke-mvp1.mjs still 9/9)

## MVP 3 — Design Brief ✅ built + verified
- [x] clients (minimal info only, md/02 §33), body_profiles (MANUAL only;
  every POST is a new snapshot, PATCH corrects latest, designer-verified flag;
  CV/ESTIMATED deferred per md/01 §15)
- [x] design_briefs (structured fields + budget) + design_requirements with
  MANDATORY/PREFERRED/OPTIONAL/RESTRICTED priorities and 9 categories;
  deactivation preserves history for MVP 6
- [x] Requirements + Body pages wired into project tabs
- [x] typecheck + build + smoke-mvp3.mjs 18/18 (mvp1 9/9, mvp2 24/24 still green)

## MVP 4 — AI Generation ✅ built + verified (mock-first)
- [x] Real context builder (brief + VERIFIED-first basket + body + budget) and
  constraint builder with md/04 §63 guardrails; exact context persisted
- [x] Provider interface: deterministic MockProvider live ($0); OpenAIProvider
  (gpt-4o-mini Structured Outputs + gpt-image-1) implemented, dormant behind
  AI_PROVIDER=openai — flip live with key only, no code change
- [x] AIService runner: two-stage spec→image, ai_jobs QUEUED→PROCESSING→
  COMPLETED/FAILED with usage + raw I/O, version lineage V1→Vn, spec
  survives image failure, local file serving via /api/files
- [x] Studio: 3-panel (context/canvas/analysis), generate confirmation,
  regenerate-with-instruction, version history, provenance labels
- [x] typecheck + build + smoke-mvp4.mjs 18/18 (mvp1/2/3 still 9/9, 24/24, 18/18)

## MVP 5 — Cost Engine ✅ built + verified (deterministic, md/06)
- [x] Materials library (search/filter/detail) + append-only price history
  (new rows, never overwrite); 4 demo materials incl. price history + priceless
- [x] CostService: AI suggests, engine calculates — material resolution from
  latest prices, labor/decoration/other lines, contingency, budget variance +
  status thresholds (env-configurable, never hard-coded)
- [x] Missing prices → INCOMPLETE (never invented); expired → REVIEW_REQUIRED;
  immutable snapshots + per-design cost history
- [x] Studio CostPanel: link materials, ad-hoc lines, breakdown, budget bar,
  warnings, history
- [x] typecheck + build + smoke-mvp5.mjs 17/17 (mvp1–4 still 9/9, 24/24, 18/18, 18/18)

## MVP 6 — Evaluation ✅ built + verified (md/07)
- [x] EvaluationService: 6 domains (cultural/requirements/body/cost/material/
  evidence) with severity-graded findings; transparent keyword-coverage
  heuristic with matched/missing evidence; no single score, only counts
- [x] Snapshots immutable (new row per run) + per-finding explanation records
  (what/why/source/constraint); review API (resolve/approve/revision)
- [x] Human gates: approval blocked on unresolved CRITICAL, AI can never
  approve; studio evaluation section + evaluations index
- [x] typecheck + build + smoke-mvp6.mjs 21/21 (mvp1–5 still all green)

## MVP 7 — Design Studio ✅ built + verified (md/08 §36)
- [x] 3-panel workspace was already live; added the two gaps: version compare
  (side-by-side visual/spec/culture/cost/evaluation, no "best" verdict) and
  the deliberate finalize action (md/08 §64–65: confirmation, CRITICAL gate,
  audit, idempotent, sets design FINAL)
- [x] Compare + finalize shared via DesignService; studio header links both
- [x] typecheck + build + smoke-mvp7.mjs 13/13 (mvp1–6 still all green)

## Reports — Design Dossier ✅ built + verified (md/01 §35)
- [x] ReportService: assembles FINAL/DESIGN/CULTURAL/COST/EVALUATION dossiers
  from preserved snapshots (briefs, basket + sources, specs, images, costs,
  evaluations, reviews, audit history) and renders PDFs server-side
  (pdfkit + svg-to-pdfkit, pure JS, no native binaries)
- [x] Reports stored as files + reports/file_assets rows; per-project API,
  library page, studio + project entry points
- [x] typecheck + build + smoke-reports.mjs 12/12 (mvp1–7 still all green)

## Phase 18 — Audit & Traceability ✅ built + verified (md/10 §114–117)
- [x] AuditService: central log() (never throws into callers) + forProject()
  traceability chain (Project → Designs → Versions → Evaluations/Costs →
  Reports) + forEntity(); standard §115 action names
- [x] COST_CALCULATED wired into CostService (the one missing §115 event);
  existing route-level writes (PROJECT_*, DESIGN_GENERATED, EVALUATION_RUN,
  DESIGN_ACCEPTED, REPORT_GENERATED, …) left in place
- [x] GET /api/projects/[id]/audit (auth + 404 guarded) + History section on
  project page (dead tab fixed)
- [x] typecheck + build + smoke-audit.mjs (full loop → 5-event chain present,
  401 without session)

## Phase 20 — Testing ✅ built + verified (md/10 §120–124, md/09 §134–140)
- [x] vitest (`vitest.config.ts`, `@/` alias, `tests/setup.ts` loads `.env`;
  `pnpm exec vitest run`): 52 tests across 7 files, all green
- [x] Unit: project state machine, cost thresholds (pure `resolveBudgetStatus`
  extracted from CostService with identical semantics) + cost profile env,
  evaluation rules (coverage heuristic, severity escalation), auth
  (scrypt round-trip, HMAC session tamper/expiry, zod schemas), rate limits,
  AI generation (§123: constraint partitioning, guardrail injection,
  image-prompt boundary, spec schema accept/reject, mock determinism +
  restricted-override flagging + XML escaping)
- [x] Integration: AuditService log/forProject/forEntity vs real DB
  (self-cleaning probe project, skips without DB)
- [x] E2E: 9 smoke scripts cover the §124 20-step loop, all exit 0
- [x] Bug found by tests: MockProvider double-escaped SVG entities — fixed

## Phase 19 — Security ✅ core done (md/10 §119, md/09 §113–118)
- [x] Already present: scrypt passwords, HMAC-signed httpOnly sessions,
  role-gated routes, server-side-only AI keys, zod validation on mutations
- [x] Added: env-configurable rate limits (md/09 §116: 30/min auth per IP,
  10/h generation + 20/h refinement per user) with 429 + Retry-After on
  login/register/generate/regenerate; in-memory window (Redis noted for
  multi-instance); new vars documented in `.env.example`
- [x] N/A by design: no user file-upload endpoints exist (all images/reports
  are generated server-side), so upload validation has no surface
- [ ] Deferred to deployment: HTTPS/CORS hardening, DB backups, error
  monitoring (md/10 §153–154 production checklist)

## Spec-compliance pass ✅ (md/02/04/07/08/09 sweep, no AI-provider work)
- [x] Fixed project-tab URL bug (absolute `/materials`, `/evaluations` were
  nested into 404s); all 9 workspace tabs resolve; added `#designs`/`#reports`
  anchors; dashboard Review Queue links to the studio
- [x] Retired both 501 stubs: `POST /api/cost` and `POST /api/evaluation`
  are working canonical aliases of the version/design-scoped engines
- [x] Evaluation now reads `cultural_restrictions` rows (previously loaded
  but ignored): CRITICAL severity → CRITICAL, cross-culture scope → HIGH,
  SACRED/CEREMONIAL_ONLY unapproved → HIGH occasion review, else MEDIUM —
  with brief occasion in evidence (md/04 §22-24, md/07 §18-20)
- [x] Integration test proves the CULTURAL_CONTEXT finding fires vs real DB
  (self-cleaning probe rows); suite now 53/53; all 9 smokes still exit 0

## Design lifecycle enforcement ✅ (md/02 §43, md/07 §91–94)
- [x] `DESIGN_STATUSES` + `DESIGN_TRANSITIONS` + `canTransitionDesign()` in
  DesignService (mirrors ProjectService); guarded `setStatus()` rejects
  illegal jumps with 409 — FINAL can never regenerate (archival only)
- [x] Lifecycle wired: generate → GENERATING → GENERATED (FAILED is truthful
  now, was silent DRAFT reset); regenerate via REVISION; evaluate sets
  EVALUATING → REVIEW_REQUIRED/REVIEWED (read-only re-run on
  FINAL/APPROVED); resolve-all → REVIEWED; approve → APPROVED;
  request-revision → REVISION; finalize → FINAL
- [x] Approval gates (approve + finalize) block on unresolved CRITICAL **and**
  HIGH (was: CRITICAL only) — over-budget / wrong-culture can no longer
  become FINAL; 422 names both counts
- [x] Unit tests for the machine; smoke-mvp7 proves regenerate-on-FINAL 409
  and HIGH-blocks-finalize; suite 60/60; all 9 smokes exit 0

## Cost input validation ✅ (md/06 §56, §91–92)
- [x] Pure `validateCostInputs()` (`src/lib/cost/validate.ts`): finite-number
  parsing (rejects NaN/Infinity/numeric garbage), quantities > 0, sane
  units, non-negative prices, 0–100 contingency, non-negative budget,
  brief-vs-engine currency match — structured codes INVALID_QUANTITY /
  INVALID_UNIT / INVALID_PRICE / INVALID_CONTINGENCY / INVALID_BUDGET /
  CURRENCY_MISMATCH
- [x] CostService fails fast with 422 COST_VALIDATION_FAILED + per-issue
  details before any snapshot insert (was: zero-quantity lines silently
  zeroed); `resolveBudget` now returns amount + currency; both cost routes
  pass `code`/`details` through; missing prices still → INCOMPLETE, never
  invented
- [x] 9 unit + 4 integration tests (engine 422s proven vs real DB incl.
  currency mismatch; valid path still calculates); route-level 400s in
  smoke-mvp5; suite 73/73; all 9 smokes exit 0

## AI output validation ✅ (md/05 §32–39, no provider work)
- [x] `src/lib/ai/output-validator.ts`: pure `classifyElement()` (OK /
  UNKNOWN / RESTRICTED / DEPRECATED / UNVERIFIED / UNSOURCED) +
  `assessElements()` (dedupes) + DB-backed `validateSpecElements()`
- [x] AIService validates every emitted element ID before persisting or
  linking: unknown IDs are dropped from the spec (never linked — previously
  a blind insert away from an FK 500 or laundered fact), recorded in
  construction notes + aiExplanation summary + job output + DESIGN_GENERATED
  audit + `validation` on the generate response (smoke-mvp4 asserts it)
- [x] 3 unit + 1 integration tests (verdicts incl. sourced/unsourced/unknown
  vs real DB); suite 77/77; all 9 smokes exit 0

## MVP 8 — Computer Vision ✅ built + verified (mock-first, md/01 §15)
- [x] VisionProvider interface (`src/lib/vision/provider.ts`, env-selected,
  mock default / live throws until implemented) + deterministic MockVisionProvider
  (hash-seeded plausible estimates, weight omitted, confidence 0.62 marker)
  + pure upload validation (magic-byte sniff, MIME allowlist, size cap)
- [x] `POST /api/projects/[id]/body/analysis` (multipart, consent=yes required
  → 422 BODY_CONSENT_REQUIRED, auth + per-user hourly rate limit): saves
  reference photo (`storage/projects/uploads`, file_assets BODY_IMAGE +
  checksum), ai_jobs BODY_ANALYSIS QUEUED→COMPLETED/FAILED, body_profiles row
  COMPUTER_VISION + confidence, designerVerified=false, audit trail
- [x] Estimates labeled ESTIMATED everywhere (form badge, analysis panel,
  image preview); accept = PATCH designerVerified, correct = PATCH values in
  the existing form, reject = DELETE estimate + photo + asset (manual history
  protected → 422); evaluation already flags non-MANUAL sources for review
- [x] BodyAnalysisPanel on the body page + imageUrl linkage via job output;
  8 unit tests (incl. fixed rate-limit defaults expectation); smoke-vision.mjs
  12/12 vs live server, smoke-mvp3 still green; suite 85/85

## Phase 2 — Hybrid retrieval ✅ built + verified (md/04 §72–74)- [x] pgvector NOT installed in this Postgres (checked `pg_available_extensions`)
  → native path: `search_vector` tsvector column + GIN index + insert/update
  trigger with A/B/C field weights (md/03 §61) via migration 0003; 22/22
  backfilled; dense embeddings + pgvector stay a documented additive upgrade
  (fusion already accepts optional vector scores)
- [x] `src/lib/retrieval/hybrid.ts`: exact-name + keyword + full-text
  (ts_rank_cd) + one-hop graph expansion, fused with VERIFIED-first status
  weights (§74) and per-hit `via` evidence (§73); shared by the search API
  (`retrieval` map in response) and the culture page (match captions)
- [x] Bugs found by tests: drizzle relational alias broke a raw fragment
  (moved candidate selection to standalone SQL); `sql.join` needs an explicit
  separator (`IN ($2$3)` → 42601)
- [x] 6 unit + 6 integration tests (self-cleaning probes prove symbolism-only
  full-text hit, exact-first, graph expansion, filters); read-only
  smoke-retrieval.mjs 10/10; smoke-mvp2 still exit 0; suite 97/97

## Dense embeddings ✅ built + live-verified (md/04 §72–74, 2026-10-12)
- [x] Migration 0005: `embedding vector(1536)` + HNSW cosine index, guarded
  by `pg_available_extensions` (no-op on plain Postgres); the column is
  deliberately NOT in drizzle schema (raw-SQL I/O only — declaring `vector`
  would break every local query on extension-less Postgres)
- [x] Provider abstraction (`src/lib/embeddings/provider.ts`, env-selected):
  deterministic unit-norm MockEmbeddingProvider ($0 default) + dormant
  OpenAI text-embedding-3-small (plain fetch, fail-loud key/dim checks);
  pure `elementEmbedText()` (name → alternatives → category → notes)
- [x] EmbeddingService (availability gate → status → batched backfill with
  per-row validation, coded 503 `EMBEDDINGS_UNAVAILABLE`) + ADMIN-gated
  `GET/POST /api/admin/embeddings/backfill` with audit trail
- [x] Mode 4 in hybridSearch: query embedding → cosine scores fused with
  `via: ["vector"]` evidence; vector-only hits seed candidates (novel
  wording no longer returns []); any failure degrades to text-only —
  search API + culture page upgraded with zero call-site changes
- [x] Bug found by tests: schema-declared `vector` column broke local
  inserts (extension-less Postgres) — reverted to raw-SQL I/O
- [x] 10 unit + 1 integration tests (determinism/norm/dims, provider
  selection, key fail-fast, graceful 503 locally); live vs Supabase:
  migrate 0005 applied, SAMPLE backfill 7/7, `verify-embeddings.ts`
  `"festival attire"` → vector hit + graph expansion; typecheck clean,
  156/156 vitest

## Production readiness ✅ core done (md/10 §153–154, image stays mock)
- [x] Mock image stays: OpenAIProvider fails loudly without keys, vision live
  throws until implemented — attaching live later = set env + keys, no code
  change (`AI_PROVIDER`, `VISION_PROVIDER`, `*_API_KEY` all in `.env.example`)
- [x] Middleware covers `/api/*`: X-Request-ID in/out (md/09 §7), strict
  same-origin CORS (deny by default, `ALLOWED_ORIGINS` allowlist, evil-origin
  preflight → 403), JSON API access log; never redirects API calls
- [x] Security headers in `next.config.mjs` (nosniff, SAMEORIGIN,
  referrer-policy, permissions-policy, HSTS — TLS terminates at proxy)
- [x] `GET /api/health` (unauthenticated): DB latency + storage writability +
  provider names only, 200/503; `src/lib/api/{cors,errors,log}.ts` (safe
  envelope hides detail in prod, recursive secret redaction)
- [x] `src/app/error.tsx` + `global-error.tsx` (no internals on screen);
  `scripts/db-backup.mjs` (pg_dump custom format + storage copy, retention
  prune, restore printed; verified: 310 KB dump, 181 TOC entries,
  `pg_restore --list` clean — also strips Prisma `?schema=` from the URL)
- [x] 8 unit + 1 integration tests; read-only smoke-prod.mjs 10/10; full
  battery re-run after middleware change: all 9 legacy smokes exit 0 with
  zero FAILs + vision 12/12 + retrieval 10/10; suite 106/106
- [ ] Still infra-side (needs a real environment, not code): TLS
  termination certs, a real `SENTRY_DSN`, a `REDIS_URL` (e.g. Upstash),
  Supabase point-in-time restore drill

## Production hardening ✅ built + verified (md/10 §153–154, 2026-10-12)
- [x] Redis rate limits: `checkRateLimitAsync()` (atomic Lua fixed-window
  `INCR+PEXPIRE`, quota shared across instances) behind the same call shape;
  `REDIS_URL` unset keeps the in-memory sliding window; Redis failure fails
  OPEN with a throttled warn (never 500s users); all 5 route call sites
  converted; `GET /api/health` reports `checks.ratelimit.store`
- [x] Sentry: official `@sentry/nextjs` v11 (client/server/edge configs +
  `src/instrumentation.ts`), strictly DSN-gated — zero bundle impact
  without one (shared JS still 87.1 kB); `serverLog` error path captures
  with redacted context via `src/lib/monitoring.ts` (dynamic import, never
  throws into requests)
- [x] Backups: `scripts/backup-lib.mjs` (importable, unit-tested) —
  `resolveDumpUrl()` prefers `DIRECT_URL` (pooler `:6543` breaks pg_dump
  under PgBouncer); s3 backend writes a versioned-bucket object manifest
  instead of copying bytes; local copy behavior unchanged
- [x] 17 new tests (async limiter incl. unreachable-Redis fail-open, Sentry
  gating via module mock, backup URL/manifest/pagination); health
  integration is backend-agnostic now (local `.env` carries s3);
  typecheck clean, 146/146 vitest, production build green

## Deployment ✅ shippable (compose + standalone + prod migrate)
- [x] `output: standalone` + multi-stage Dockerfile (migrate → serve,
  healthcheck on `/api/health`) + `.dockerignore`
- [x] `docker-compose.yml`: pgvector/pgvector:pg17 (vector extension ready,
  no future DB rebuild) + app + pgdata/storage/backups volumes; mock AI
  default, live via env only
- [x] `scripts/migrate-prod.mjs` (no drizzle-kit in image): journal-order
  apply, statement-breakpoint split, `__prod_migrations` tracking, adopts
  drizzle-kit's history on dev DBs; verified: fresh scratch DB 4/4 applied
  (35 tables, GIN index, 4 tracked), dev DB adopts + idempotent re-runs,
  scratch dropped afterwards
- [x] Standalone server booted locally against real DB: `/api/health`
  healthy (db 175 ms, storage ok, mock/mock); suite 106/106
- [x] 2026-10-12: Docker artifacts removed (`Dockerfile`,
  `docker-compose.yml`, `.dockerignore` — not used); deploy path is host
  Node running `.next/standalone/server.js` after `migrate-prod.mjs`,
  healthcheck on `/api/health`. `output: standalone` retained for that.

## UI polish ✅ built, static-verified (md/08 §5, §68, §76–77, §113)
- [x] Shared status system: `statusTone()` (40+ states, icon + label, never
  color alone) + `<StatusBadge/>`; ValidationBadge + PriorityBadge re-based
  on it (same output); ad-hoc spans migrated on dashboard, projects, admin
  users, materials, evaluations, cost + evaluation panels, body form
- [x] `(app)/loading.tsx` skeleton (no more blank transitions), global
  `not-found.tsx` (guides back to workflow), active-section nav
  (`NavLinks`, aria-current, desktop + mobile)
- [x] 4 unit tests; typecheck clean; full build green twice (route tables
  incl. new loading/error/not-found)
- [x] Live-verified 2026-10-05: custom 404 renders, health healthy; full
  battery — all 12 smokes exit 0, zero FAILs (mvp1-7, reports, audit,
  vision, retrieval, prod); 110/110 vitest

## Studio UX pass ✅ built + live-verified (md/08 §8, §36–37, §53)
- [x] Full project breadcrumb (Projects / name / Designs / Studio / Vn),
  prev/next version links, any-pair compare via zero-JS GET form (was
  min-vs-max link only), version list + job list on shared StatusBadges
  (null-safe provider/model), HUMAN_APPROVED tone, stale "MVP 5/6" copy fixed
- [x] Live-verified in the same 12-smoke battery (mvp6/mvp7 cover studio),
  zero FAILs; suite 110/110

## Professional theme ✅ built + live-served (heritage-lab identity)
- [x] Tokens in `tailwind.config.ts` (ink, brass, paper, display serif,
  card/pop shadows) + `globals.css` (unified table style, `.input`,
  brass focus + selection)
- [x] Primitives: `Button` (primary/accent/secondary/ghost/danger),
  `Card` (eyebrow + serif title + action), `PageHeader`
- [x] Applied: ink sidebar with brass brand mark + active-section NavLinks,
  split login (brand panel + pipeline), dashboard (brass-topped stat cards,
  review queue), studio (cards, serif sections, themed header), culture
  cards, PageHeaders + `.input` + card tables on projects/materials/
  evaluations/culture
- [x] Live-served: all 12 smokes exit 0, zero FAILs on themed build

## 🛑 Environment issue — OPEN: dev-machine file deletion (2026-10-05)
- **Symptom:** `node_modules/<pkg>` bodies (Next, React, …) and `.next`
  build output disappear minutes after install/build → `next dev` dies with
  `MODULE_NOT_FOUND`, servers can't boot. Code, git tree, DB all unaffected.
- **Ruled out:** Defender (exclusion for this path confirmed present via
  `(Get-MpPreference).ExclusionPath`, no detections logged, no scheduled
  scan running); no cleaner processes or suspicious scheduled tasks found.
- **Workaround that works:** reinstall + boot + verify in ONE fast chain
  (outruns the deleter) — full 12-smoke battery passed this way twice.
- **Owner actions:** (a) move the repo off Desktop (e.g. `C:\dev\Cultural`)
  to test the location hypothesis; (b) otherwise file-audit tooling with
  admin rights to catch the deleting process.

## Dashboard/admin UX refresh ✅ built + live-served (NextAdmin-style flow)
- [x] Icon sidebar with WORKSPACE / ADMINISTRATION groups (`NavIcons`,
  `NavItem.icon` + `group`); desktop topbar (breadcrumb, global `q` search
  → /culture, review-queue bell with live count, user chip)
- [x] Dashboard: greeting + date header, 4 metric cards (icon tiles, honest
  "+N this week" captions), 6-step workflow flow, SVG projects-by-status
  bars + designs-pipeline donut (no chart deps), recent projects + review queue
- [x] Admin users: role-distribution stat cards, server-side search,
  role pills, PageHeader + Card; typecheck clean, all pages 200,
  smoke-mvp1 green on served HTML

## Frontend rendering optimization ✅ built + live-served
- [x] Shell streams: review-bell is an async server island in `<Suspense>`
  (`ReviewBell` + fallback, zero layout shift); layout no longer awaits any
  DB query — sidebar/topbar paint without waiting for page data
- [x] Dashboard streams: StatRow/ChartsRow/TablesRow async sections with
  skeleton fallbacks; header + workflow paint first, data fills in
- [x] Bundle unchanged: production build green, First Load JS shared still
  87.1 kB, dashboard/admin pages 199 B each (all new UI is server-rendered);
  `poweredByHeader: false` in next.config
- [x] Verified post-change: typecheck clean, pages 200, smoke-mvp1 9/9

## 🛑 Environment update (2026-10-06): deleter followed to C:\dev\Cultural
- Location hypothesis DISPROVEN: `next` + `react` bodies were eaten at the
  new path too, minutes after a successful production build. Next step is
  file-audit tooling with admin rights to catch the deleting process —
  moving folders will not help.

## Live vision provider ✅ built, static-verified (mock stays default)
- [x] `OpenAIVisionProvider` (`src/lib/vision/providers/openai.ts`, plain
  fetch, no SDK): reference photo → Responses API with Strict Structured
  Outputs → validated estimate; `VISION_PROVIDER=openai` (`live` is an
  alias), key from `VISION_API_KEY` (falls back to `AI_API_KEY`), model from
  `VISION_MODEL` (falls back to `AI_MODEL`), timeout via `VISION_TIMEOUT_MS`;
  fails loudly without a key, mock remains the $0 default
- [x] Thesis guardrails hold for live output exactly as for mock: pure
  `parseVisionOutput()`/`sanitizeVisionMeasurements()`
  (`src/lib/vision/estimate-schema.ts`) — weight can never be stored (not a
  known key, dropped + named), out-of-range/non-numeric values dropped,
  confidence clamped 0–1 as a process marker (md/07 §36), everything stays
  ESTIMATED until a designer accepts/corrects
- [x] Analysis route hardened: provider misconfiguration returns JSON 503
  `VISION_MISCONFIGURED` instead of an unhandled 500 (was: throw at job
  insert); provider resolved once and reused for job + analysis + payload
- [x] `.env.example` documents the new vars; unit tests cover the parser
  (valid/out-of-range/weight-drop/invalid-shape), the timeout message, and
  provider selection (mock default, openai without key throws)

## Supabase storage (Phase A) ✅ built, static-verified (local stays default)
- [x] Decision: Supabase — managed Postgres (pgvector built in) + Storage via
  its S3 protocol endpoint (md/10 §8, md/09 §81, md/02 env updated; RLS
  deliberately not adopted, auth stays in-app, keys server-side only)
- [x] Backend abstraction: `src/lib/storage-config.ts` (env selection, key
  sanitizer, config validator that names missing vars) + `src/lib/storage-s3.ts`
  (`@aws-sdk/client-s3`, `forcePathStyle`, private bucket) behind the stable
  `src/lib/storage.ts` facade — same signatures, same keys, same
  `/api/files` URLs on both backends; unknown `STORAGE_BACKEND` and
  incomplete s3 config fail loudly, traversal keys rejected
- [x] Reads stay proxied through the session-guarded `/api/files` route (no
  signed-URL expiry, no access-control change); `GET /api/health` reports
  `checks.storage.backend`; go-live = create private bucket + S3 keys
  (Storage → S3 configuration) and set `STORAGE_BACKEND=s3` + vars, no code
- [x] 7 unit tests (selection/config/keys) + health test asserts local
  backend; typecheck clean, full suite green, production build green
- [x] Phase B (prod DB) ✅ built + live-verified vs dev DB (local stays default):
  `src/lib/db/database-url.ts` (pure URL policy: strips Prisma `?schema=`,
  libpq-style TLS modes — Supabase defaults to encrypted `require`,
  `verify-full` via `DATABASE_SSL=strict`/`?sslmode=verify-full` for strict
  networks, `DIRECT_URL` wins for migrate, `DATABASE_POOL_MAX` clamped 1–50) wired into `db/client.ts`
  (conditional `ssl: { rejectUnauthorized: true }`, pooler-friendly pool);
  `migrate-prod.mjs` uses DIRECT_URL-or-DATABASE_URL + SSL + schema-strip
  and reports pgvector status (pooler DDL warning logged); migration 0004
  `CREATE EXTENSION IF NOT EXISTS "vector"` guarded by
  `pg_available_extensions` (no-op on plain Postgres, enables on Supabase /
  compose pgvector image);   `GET /api/health` reports
  `checks.database.pgvector` via `isPgVectorAvailable()`; `.env.example`
  documents DIRECT_URL/DATABASE_SSL/DATABASE_POOL_MAX; 10 unit tests +
  health integration asserts the flag; verified live vs real Supabase
  (Mumbai, 2026-10-12): no-IPv6 network → session pooler `:5432` for
  migrate (direct `db.*` host is IPv6-only), `tls: require` (network
  middlebox breaks strict verification), migrate applied 0000–0004
  (82+1+8+6+1 statements, `pgvector: enabled`), verify-supabase 5/5 PASS
  (35 tables, trigger, tracking), db:seed roles+admin; typecheck clean,
  134/134 vitest, production build green (route table + artifacts emitted)
- [ ] Deferred: dense-embedding columns + provider (fusion already accepts
  optional vector scores — additive when needed);
  `scripts/db-backup.mjs` storage copy covers local
  only — on s3 rely on Supabase bucket versioning until scripted

## Deferred (md/01 §51)
3D/AR, pattern generation, marketplace,
supplier integration, mobile app.

## Thesis demo ✅ built + verified (md/10 §125–126)
- [x] `scripts/seed-demo.ts` (idempotent on `DEMO-FESTIVAL-01`): full §125
  loop headless via services — brief (Festival, ₱25,000) + MANUAL body +
  5 requirements + VERIFIED basket → mock V1 → cost ₱11,770 UNDER_BUDGET →
  evaluation → ACCEPT reviews → FINAL → FINAL_REPORT PDF; project COMPLETED
- [x] `docs/THESIS_DEMO.md`: 16-screen 10-minute walkthrough with timings,
  anticipated questions (mapped to screens), and 4 fallbacks (seeded V1
  covers a failed live generate); SAMPLE-integrity notes throughout
- [x] Drive-by fix: admin backfill audit wrote text into a uuid column —
  now `entityId: null` + counts in `newValue`
- [x] Verified: first-run full loop green locally, re-run skips cleanly;
  typecheck clean, 156/156 vitest

## AI spend ledger + quotas ✅ built + verified (md/10 §158–159)
- [x] Migration 0006 `ai_usage` ledger (plain types, universal): job/user/
  project/kind/provider/model/tokens/images/estimated-USD/unpriced flag
- [x] Pure `src/lib/ai/pricing.ts`: mock priced $0 (free, not unpriced),
  gpt-4o-mini token math, gpt-image-1 flat-per-render estimate, unknown
  models flagged unpriced — costs never invented (md/06 honesty rule)
- [x] `AiUsage.record()` hooked into both AIService stages (spec tokens
  recorded even when the image stage fails); per-stage models exposed via
  `DesignProvider.models`; spend returned on generate + in audit
- [x] Daily quotas (GENERATION/REFINEMENT/IMAGE, env-configurable, generous
  defaults 50/100/50) checked before any work; 429 AI_QUOTA_EXCEEDED
  surfaces through existing route envelopes
- [x] 8 tests (pricing math, ledger round-trip + cascade cleanup, quota
  block, safe defaults); throwaway-project probe proved the mock path live
  (2 jobs COMPLETED, 2 ledger rows $0 priced, quota allows, fully cleaned);
  typecheck clean, 164/164 vitest
- [x] $0 live-path check (no funded key needed): stubbed-fetch suite proves
  Responses-API parsing + usage extraction, invalid-spec rejection, 401
  propagation, and image b64 decode; 170/170 vitest
- [ ] Live OpenAI call still unverified (needs a funded key — one mock-cost
  generation ≈ $0.05–0.10); flip `AI_PROVIDER=openai`, no code change

## Dashboard insights + a11y/responsive pass ✅ built + live-verified (md/08 §5, §68)
- [x] Dashboard gains reference-style insight sections (all real queries, no
  invented numbers): **Activity trend** (new projects + designs, 8 weeks,
  dual-line SVG area chart), **Portfolio completion** gauge (completed /
  total projects), **Most-referenced motifs** ranking (basket → element
  counts, links to culture search), and **Generation activity** (ai_usage
  calls + estimated USD; unpriced calls named, never costed)
- [x] New pure-SVG primitives in `dashboard/Charts.tsx`: `AreaTrend`
  (grid + gradient fill + legend + `sr-only` data table), `GoalGauge`
  (semicircle, aria-labelled), `RankBars`; `StatCard` gains a `featured`
  tinted variant (first card); all new charts carry `role="img"` + labels
- [x] Accessibility: **skip-to-content** link + `#main` landmark in the app
  shell; muted text raised from `ink-400` (~2.5:1) to `ink-500` (~4.8:1)
  app-wide and orange eyebrows `brand-600`→`brand-700` (~5.2:1) to clear
  WCAG AA; `prefers-reduced-motion` disables animations/transitions
  (global CSS); chart axis labels darkened
- [x] Responsive: unwrapped tables (dashboard recent-projects, admin users,
  material price history) now scroll horizontally instead of overflowing;
  StatCard grid, charts and tables already collapse to one column on mobile
- [x] Two red-in-tree bugs fixed: `session.ts` called React `cache()` at
  module load → `cache is not a function` in plain Node (broke
  `tests/unit/auth.test.ts`); now degrades to an identity wrapper. Live
  `OpenAIProvider.generateImage` signature now matches the `DesignProvider`
  contract (2nd param), clearing the `ai-live-path.test.ts` typecheck errors
- [x] Verified: `tsc --noEmit` clean; production build green (shared JS
  unchanged, 87.1 kB); **170/170 vitest** (was 163 + 1 failed suite);
  standalone server boots — `/`, `/login`, `/api/health` 200, `/dashboard`
  307→login for anon; smoke-mvp1 **9/9** incl. authenticated dashboard 200;
  new sections confirmed present in served HTML

## Readable demo data + faster dev ✅ built + verified (md/08, md/10 §125)
- [x] Replaced the "Sample X" placeholders with a coherent, readable dataset:
  fictional **Amihan Highland Weavers** / **Sinag Coastal Weavers** cultures,
  guild communities, a museum/oral-history/journal reference set, 7 named
  elements ("Ikat Ceremonial Wrap", "Fern-Spine Motif", "Festival Barong",
  "Ancestral Headdress Ornament", …) and 4 named materials ("Handwoven Ikat
  Panel" ₱850/m history, "Mother-of-Pearl Beads", "Heirloom Tapestry Cloth"
  priceless). Codes are now `CE-DEMO-*` / `MAT-DEMO-*` / `REF-DEMO-*`; every
  description states it is fictional demonstration data (thesis integrity)
- [x] `db:seed:demo-data` (culture+materials+demo in one) and
  `db:reset:demo` (FK-safe removal of DEMO/SAMPLE codes, "Smoke …" records and
  throwaway `designer*@test.local` accounts; fixes the
  `design_versions.parent_version_id` and `ai_jobs.project_id` NO-ACTION
  blockers) for clean re-seeding; `seed-demo.ts` + all 12 smoke scripts and
  docs updated to the new identifiers
- [x] Dev latency fixed: `pnpm dev` now runs `next dev --turbo` — first-visit
  route compile dropped from **8.4 s → ~1 s** (`/dashboard` 8.4s→0.8s, others
  ~1.1–1.6s). This was the "~6 s per click": dev-mode on-demand webpack
  compilation, worse when the file-deleter wipes `.next`. `pnpm dev:webpack`
  kept as a fallback
- [x] Verified: `tsc --noEmit` clean; reset+reseed rebuilt DEMO-FESTIVAL-01
  end-to-end (cost ₱11,110 UNDER_BUDGET, FINAL, report PDF); **all 12 smokes
  exit 0** with zero FAILs incl. the retrieval exact-name hit now
  ("Ikat Ceremonial Wrap"); 170/170 vitest unaffected

## Google Gemini providers (live AI without OpenAI billing) ✅ built + unit-verified
- [x] Second live provider family behind the same interfaces — `AI_PROVIDER` /
  `EMBEDDING_PROVIDER` / `VISION_PROVIDER` = `google` (alias `gemini`), mock
  stays the default. No call-site changes; factories extended only
- [x] `GoogleProvider` (`src/lib/ai/providers/google.ts`): Gemini API / AI
  Studio simple key (`GOOGLE_API_KEY`, `GEMINI_API_KEY` fallback); Stage 1
  spec via `responseMimeType: application/json` + `responseSchema`; Stage 2
  image via `gemini-2.5-flash-image` inline output (`responseModalities`);
  plain `fetch` + `x-goog-api-key`, fail-loud key checks, timeout
- [x] `gemini-schema.ts`: converts the shared OpenAI JSON Schemas to Gemini's
  `responseSchema` (drops `additionalProperties`/`strict`, OpenAI
  `type:["number","null"]` → Gemini `nullable`, adds `propertyOrdering`) so
  the design-spec and vision-estimate contracts stay single-sourced
- [x] `GoogleEmbeddingProvider`: `gemini-embedding-001` via
  `:batchEmbedContents` with `outputDimensionality: 1536` (matches the
  pgvector column, **no schema change**) and explicit **L2-normalization**
  (only Google's native 3072-dim output is pre-normalized); wrong-width
  vectors are rejected, not stored
- [x] `GoogleVisionProvider`: Gemini is natively multimodal → reference photo
  as an inline image part, constrained to the same estimate schema; identical
  thesis guardrails (no weight field, out-of-range values dropped, confidence
  is a process marker). Shared `vision/mime.ts` (`sniffMime`/`toDataUrl`)
  extracted from the OpenAI provider
- [x] Spend ledger: `google:gemini-2.5-flash` / `-flash-lite` / `-2.0-flash`
  token cards, `google:gemini-2.5-flash-image` flat image card (≈$0.039,
  ESTIMATE), `google:gemini-embedding-001`; an overridden `GOOGLE_MODEL` with
  no card is `unpriced` (never guessed). `ai_jobs`/version rows now record
  `provider.models.spec` instead of a bare provider name
- [x] `.env.example` documents all `GOOGLE_*` vars
- [x] 14 stubbed-fetch tests (`tests/unit/google-live-path.test.ts`): no-key
  throw, spec parse + usage, request shape, invalid-spec rejection, 400
  propagation, image b64 decode, embedding dim + normalization, vision
  sanitize, schema conversion, factory selection
- [x] Verified: `tsc --noEmit` clean; production build green; **184/184 vitest**
- [ ] Live Google call still unverified (needs an AI Studio key — Gemini
  text/vision/embeddings are on the **free tier**; image generation may need a
  billing-enabled project, and a missing image model degrades gracefully); set
  `GOOGLE_API_KEY` + flip the three provider vars, no code change

## Definition of done (DB): md/03 §84. UX acceptance: md/08 §125.
