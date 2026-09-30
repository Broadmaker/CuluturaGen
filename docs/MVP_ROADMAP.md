# MVP Roadmap — derived from md/01 §50, md/02 §52, md/03 §74–76, md/08 §126

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
- [x] SAMPLE-prefixed demo data (thesis-safe placeholders, not real knowledge)
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
  (new rows, never overwrite); 4 SAMPLE materials incl. price history + priceless
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

## Deferred (md/01 §51)
Computer vision (after core works), 3D/AR, pattern generation, marketplace,
supplier integration, mobile app.

## Definition of done (DB): md/03 §84. UX acceptance: md/08 §125.
