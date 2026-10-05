# Cultural Attire Design Platform

Human-AI collaborative platform for cultural-aware, body-personalized,
cost-optimized creative attire design. Master's thesis prototype.

Pipeline: **Knowledge → Constraints → Generation → Evaluation → Human Review**
(not Prompt → Image → Final). See `md/`.

## Stack (md/02 §19)

- Frontend: Next.js 14 + React + TypeScript + Tailwind
- Backend: Next.js API routes (monolith for MVP; extract FastAPI later if needed)
- DB: PostgreSQL + pgvector (Phase 2)
- Graph: Postgres relational layer for MVP, Neo4j later
- AI: external LLM + image APIs (server-side only)
- ORM: Drizzle (decided — Prisma not used; `src/lib/db/schema.ts` mirrors `md/03`)
- Driver: node-postgres (`pg` + `@types/pg`)

## Start (MVP 1 — App Foundation)

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL
pnpm run db:migrate     # drizzle-kit migrate
pnpm run db:seed        # roles ADMIN/DESIGNER/... + admin user
pnpm run dev            # login: admin@attirelab.local / Admin123!
```

## Structure

```text
src/app/            # routes: dashboard, projects/[id]/*, culture, design-studio,
                    # materials, evaluations, reports, admin/*, api/*
src/components/     # layout, navigation, forms, dialogs, evidence, status + domains
src/features/       # dashboard, projects, culture, body, materials,
                    # design-generation, costing, evaluation, reports
src/lib/            # api client, validation (zod), ai (orchestrator/context-builder/
                    # constraint-engine), db, auth, formatting, permissions, utils
src/server/         # services (Culture/Project/Body/Material/Cost/AI/Design/
                    # Evaluation/Explanation/Report), repositories, validators,
                    # middleware, config
src/types/          # shared domain types
src/lib/db/         # drizzle schema + relations + client (MVP scope md/03 §74)
drizzle/            # SQL migrations (drizzle-kit generate/migrate)
scripts/            # seed.ts, smoke-mvp1.mjs
storage/            # users, projects/{references,uploads,generated,reports}
tests/              # unit (cost/eval/rules), integration (api→db), e2e
md/                 # master specification (do not delete)
docs/               # MVP roadmap (start here)
```

## Build order (md/01 §58)

1. Architecture ✅ (this scaffold) → 2. DB schema ✅ (`src/lib/db/schema.ts`)
3. Cultural model → 4. UI/nav → 5. Projects → 6. Culture module
7. Design brief → 8. Material & Cost → 9. AI orchestration → 10. Generation
11. Evaluation → 12. Explainability → 13. Studio → 14. Vision (later)
15. Reports → 16. Testing.

MVP scope: `docs/MVP_ROADMAP.md`. DB migration order: `md/03 §76`.
API surface: `md/01 §40`. Key rule: AI never finalizes cost, never
overwrites verified knowledge, never self-approves.
