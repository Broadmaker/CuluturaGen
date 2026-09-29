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

## Deferred (md/01 §51)
Computer vision (after core works), 3D/AR, pattern generation, marketplace,
supplier integration, mobile app.

## Definition of done (DB): md/03 §84. UX acceptance: md/08 §125.
