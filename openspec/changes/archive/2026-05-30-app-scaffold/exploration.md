## Exploration: app-scaffold

### Current State

The repo is **spec-only** — no application code, no `package.json`, no test runner, no `node_modules`. What exists:

- `utn-ingreso-app-spec/docs/` — 18 spec documents covering product, pedagogy, architecture, ADRs, and SDD workflow
- `openspec/` — SDD config (hybrid mode) with empty `specs/` and `changes/archive/`
- `material_canonico/` — canonical reference material for theory, exercises, and evaluations
- `.gga` — GGA config pointing to AGENTS.md as rules file
- `.atl/skill-registry.md` — skill index
- `AGENTS.md` — project work standards
- `.gitignore` — already configured for Next.js outputs, node_modules, env files, pnpm-lock

The roadmap (doc 16) defines **Sprint 0 — Inicialización técnica** as the first implementation phase, which IS this scaffold change.

### Affected Areas

- **New: `package.json`** — project manifest, scripts (dev, test, typecheck, build), dependencies
- **New: `tsconfig.json`** — TypeScript strict config
- **New: `next.config.ts`** — Next.js App Router config
- **New: `tailwind.config.ts`** — Tailwind CSS config
- **New: `postcss.config.mjs`** — PostCSS for Tailwind
- **New: `vitest.config.ts`** — Vitest test runner config
- **New: `src/app/layout.tsx`** — root layout (App Router)
- **New: `src/app/page.tsx`** — landing page placeholder
- **New: `src/app/globals.css`** — Tailwind directives
- **New: `src/domain/`** — empty dir with `.gitkeep` + `index.ts` barrel
- **New: `src/components/`** — empty dir with `.gitkeep`
- **New: `src/hooks/`** — empty dir with `.gitkeep`
- **New: `src/lib/`** — empty dir with `.gitkeep`
- **New: `content/matematica/`** — empty dir structure
- **New: `content/fisica/`** — empty dir structure
- **New: `supabase/migrations/`** — empty dir with `.gitkeep`
- **New: `tests/`** — empty dir with `.gitkeep`
- **New: `src/domain/__tests__/`** — placeholder test proving Vitest works
- **Modified: `openspec/config.yaml`** — verify test_command/build_command match new scripts

### Approaches

1. **`create-next-app` with pnpm flag** — Use `pnpm create next-app` with TypeScript, Tailwind, App Router, src/ directory enabled, import alias `@/*`
   - Pros: Industry standard, handles all config boilerplate, produces known-good tsconfig/next.config, includes `pnpm-lock.yaml` automatically
   - Cons: May generate extra files (ESLint config, favicon, SVG assets) that need cleanup; review budget risk from generated noise; may not match exact Tailwind v4 setup if version differs
   - Effort: Low

2. **Hand-crafted scaffold** — Write package.json, tsconfig, next.config, vitest.config, layout, page manually
   - Pros: Full control over every file, minimal review surface, exact match to project conventions
   - Cons: Error-prone (tsconfig paths, PostCSS config, SWC config), slower to implement, risk of missing something `create-next-app` handles automatically
   - Effort: Medium

3. **Hybrid: `create-next-app` then strip** — Generate with create-next-app, remove unnecessary files (default SVGs, favicon, extra configs), adjust to project conventions
   - Pros: Gets correct base config automatically, then prunes to review budget, reduces human error
   - Cons: Two-step process, still need to audit generated code for convention compliance
   - Effort: Low-Medium

### Recommendation

**Approach 3 (Hybrid)** — Use `pnpm create next-app` with flags for TypeScript, Tailwind, App Router, src directory, and `@/*` alias. Then:

1. Remove generated boilerplate that doesn't belong (default SVGs, favicon, ESLint config if not needed yet)
2. Add `vitest.config.ts` and configure test scripts
3. Create the empty directory structure per doc 10 (`domain/`, `components/`, `hooks/`, `lib/`, `content/`, `supabase/migrations/`, `tests/`)
4. Add `.gitkeep` files and barrel `index.ts` for `src/domain/`
5. Create a minimal placeholder test in `src/domain/__tests__/placeholder.test.ts` that proves Vitest runs
6. Create `src/app/layout.tsx` and `src/app/page.tsx` with minimal content
7. Verify: `pnpm install && pnpm run dev && pnpm run test && pnpm run typecheck && pnpm run build`

This keeps the review surface minimal while leveraging battle-tested config.

### Risks

- **Review budget (400 lines)**: `create-next-app` generates ~15-20 files. After cleanup, the actual changes should be ~10-12 new files. Estimated ~250-350 lines changed. **Risk: Medium** — depends on how much boilerplate survives cleanup.
- **Next.js version drift**: The spec doesn't pin a Next.js version. Using latest (v15) is fine but should be documented. If a breaking change exists, the scaffold will need adjustment.
- **pnpm enforcement**: Must use `pnpm create next-app` (not `npx`). If the user runs `npx create-next-app` instead, it will use npm. The scaffold PR description should explicitly call this out.
- **GGA pre-commit hook**: `.gga` exists but `gga install` may not have been run yet. The scaffold should verify GGA works or note it as a follow-up. If GGA isn't installed, commits won't be guarded.
- **material_canonico coupling**: The scaffold should not import PDFs directly into runtime code. Pedagogical features may use canonical material through explicit content artifacts and traceable references.
- **Supabase premature coupling**: The scaffold should NOT install `@supabase/supabase-js` or create Supabase client code yet. Only the `supabase/migrations/` directory structure. Supabase integration is Sprint 3.
- **Tailwind version**: Need to confirm whether to use Tailwind v3 (stable) or v4 (latest). `create-next-app` defaults may vary. Should pin whichever is used.

### Ready for Proposal

Yes — the exploration is complete. The orchestrator should:
1. Confirm approach (hybrid recommended) with the user
2. Confirm Tailwind version (v3 vs v4)
3. Confirm whether ESLint config is needed in scaffold or can be deferred
4. Proceed to `sdd-propose` to create the formal change proposal
