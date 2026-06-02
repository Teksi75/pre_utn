# Tasks — conjuntos-numericos-practice-expansion

## Conventions
- pnpm only. Verify with: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.
- Domain layer (`src/domain/**`) MUST stay React/Next/Supabase-free.
- TDD: every task that touches domain logic or a validator follows RED → GREEN → REFACTOR.
- ENGRAM: any non-obvious decision, bug, or convention discovered during a task is saved to engram.
- GGA: every PR is reviewed before commit (per `AGENTS.md`).
- Each PR is independently revertable. Stack order: PR#1 → PR#2 → PR#3 → PR#4 → PR#5 (merge to main in order via `stacked-to-main`).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1300–1700 total |
| 400-line budget risk | Low (per-PR) |
| Chained PRs recommended | Yes |
| Suggested split | PR#1 (root fix + model) → PR#2 (pertenencia + mapa) → PR#3 (clasificación) → PR#4 (racionales + decimales) → PR#5 (errores + verify) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Root-render fix + model extensions | PR#1 base = main | Regression test, exercises.json markup fix, optional category/tags fields, bank validator skeleton |
| 2 | Pertenencia/inclusión (8) + mapa (4) | PR#2 base = PR#1 branch | 12 exercises + feedback + validator coverage |
| 3 | Clasificación (12) | PR#3 base = PR#2 branch | 12 exercises + mandatory-number test |
| 4 | Racionales vs irracionales (8) + decimales (6) | PR#4 base = PR#3 branch | 14 exercises + KaTeX snapshot tests |
| 5 | Errores comunes (6) + final verify | PR#5 base = PR#4 branch | 6 exercises + full bank validation + doc update |

---

## PR#1 — Root-render fix + base model extensions

**Goal**: eliminate the root-render bug in exercises 4 and 5; lay the data-model foundation for the 40+ new exercises.

### Tasks
- [x] 1.1 [TDD-RED] Add regression test in `src/components/math/__tests__/conjuntos-render-safety.test.ts`: parse exercises 4 and 5 of `mat.u1.conjuntos_numericos`, assert NO bare `√` text segments outside `$...$` delimiters. Test fails on current bug.
- [x] 1.2 [GREEN] Fix `content/matematica/exercises.json` lines 46 and 59: replace `√2` with `$\sqrt{2}$` and `√(-4)` with `$\sqrt{-4}$`. Confirm 1.1 passes.
- [x] 1.3 [TDD] Extend `Exercise` interface in `src/domain/models/exercise.ts`: add optional `category?: string`, `tags?: readonly string[]`. Update `src/domain/__tests__/exercise.test.ts` to cover new optional fields (RED → GREEN).
- [x] 1.4 [TDD] Add `validatePracticeBank(exercises, feedback)` in `src/domain/catalog/content-loaders.ts`: skeleton that returns `ValidationError[]` for missing categories and missing feedback entries. Unit test in `src/domain/__tests__/practice-bank.test.ts` (RED → GREEN).
- [x] 1.5 Update `ExerciseId` regex in `src/domain/models/exercise.ts` line 48: relax final segment from `(\d+)` to `([a-z0-9-]+)` to accept `cn-per-01` style IDs. Test: existing numeric IDs still pass, `cn-per-01` passes.

### Verification
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
- Per-PR line budget: ~150–300.

### Rollback
- Revert PR#1 → bug is back AND model extensions gone. Cherry-pick the `exercises.json` change only to keep the fix.

---

## PR#2 — Categoría 1 (Pertenencia/Inclusión, 8 ej) + Categoría 5 (Mapa de inclusión, 4 ej)

**Goal**: 12 new exercises covering ∈/⊂ discrimination and the inclusion map among ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.

### Tasks
- [ ] 2.1 Create `content/matematica/exercises/conjuntos-numericos.json` with 8 pertenencia/inclusión exercises (`cn-per-01`..`cn-per-08`). Distribution: 3 básico, 3 intermedio, 2 desafiante. At least 2 test ∈ vs ⊂ confusion. All math via `$...$` KaTeX.
- [ ] 2.2 Add 4 mapa-de-inclusión exercises to same file (`cn-map-01`..`cn-map-04`). Distribution: 1 básico, 2 intermedio, 1 desafiante. At least 1 asks student to identify ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ chain.
- [ ] 2.3 Update `src/domain/catalog/content-loaders.ts` to merge per-skill JSON files. Add import for `conjuntos-numericos.json` and merge into exercise list for `mat.u1.conjuntos_numericos`.
- [ ] 2.4 Create `content/matematica/feedback/unit-1-conjuntos-numericos.json` with feedback entries for all 12 exercises. Include ∈/⊂ confusion example and inclusion chain explanation.
- [ ] 2.5 [TDD] Extend `validatePracticeBank` to assert ≥8 pertenencia + ≥4 mapa, all categories present, all exercises have feedback. RED → GREEN.

### Verification
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
- Per-PR line budget: ~300–400.

### Rollback
- Revert PR#2 → bank returns to 5 exercises. PR#1 root fix and model extensions remain.

---

## PR#3 — Categoría 2 (Clasificación, 12 ej)

**Goal**: 12 exercises where the student classifies a number into ℕ, ℤ, ℚ, 𝕀, ℝ.

### Tasks
- [ ] 3.1 Add 12 clasificación exercises to `content/matematica/exercises/conjuntos-numericos.json` (`cn-cla-01`..`cn-cla-12`). Distribution: 4 básico, 5 intermedio, 3 desafiante. Mandatory numbers: 5, 0, -3, 2/5, 0{,}75, 0{,}3̄, $\sqrt{2}$, $\sqrt{9}$, π, -4/1. At least 2 multi-select (classify into MULTIPLE sets).
- [ ] 3.2 Add feedback entries for all 12 to `content/matematica/feedback/unit-1-conjuntos-numericos.json`. N-sin-cero convention in feedback for exercises involving 0.
- [ ] 3.3 [TDD] Add test in `src/domain/__tests__/practice-bank.test.ts`: assert bank contains each mandatory number at least once in prompt or options. RED → GREEN.

### Verification
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
- Per-PR line budget: ~300–400.

### Rollback
- Revert PR#3 → 12 clasificación exercises gone. Other PRs' content unaffected.

---

## PR#4 — Categoría 3 (Racionales vs irracionales, 8 ej) + Categoría 4 (Decimales, 6 ej)

**Goal**: 14 exercises distinguishing ℚ from 𝕀, and recognizing finite, periodic, and non-periodic decimals.

### Tasks
- [ ] 4.1 Add 8 racionales-vs-irracionales exercises (`cn-rvi-01`..`cn-rvi-08`). Distribution: 3 básico, 3 intermedio, 2 desafiante. At least 2 address "toda raíz es irracional" misconception (√9 is rational). At least 1 addresses "todo decimal es irracional".
- [ ] 4.2 Add 6 decimales exercises (`cn-dec-01`..`cn-dec-06`). Distribution: 2 básico, 3 intermedio, 1 desafiante. Cover finite (0{,}75), periodic (0{,}3̄), non-periodic (π). At least 1 addresses "decimal periódico NO es racional".
- [ ] 4.3 Add feedback entries for all 14 to feedback JSON.
- [ ] 4.4 [TDD] Snapshot test in `src/components/math/__tests__/`: assert rendered HTML of 3 representative new exercises contains no bare `√` and KaTeX renders roots with top bar. RED → GREEN.

### Verification
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
- Per-PR line budget: ~350–400.

### Rollback
- Revert PR#4 → 14 exercises gone.

---

## PR#5 — Categoría 6 (Errores comunes, 6 ej) + final verify

**Goal**: 6 exercises hitting each of the 8 common misconceptions. Update feedback index. Final verification.

### Tasks
- [ ] 5.1 Add 6 errores-comunes exercises (`cn-err-01`..`cn-err-06`). Distribution: 1 básico, 2 intermedio, 3 desafiante. Each targets ≥1 of 8 misconceptions; cover all 8 by end.
- [ ] 5.2 Add feedback entries for all 6. Update feedback index map in `content/matematica/feedback/unit-1-conjuntos-numericos.json` listing all 8 misconceptions with feedback keys.
- [ ] 5.3 [TDD] Full bank validation: `validatePracticeBank` for `mat.u1.conjuntos_numericos` returns no diagnostics; all mandatory numbers appear; all 8 misconceptions covered by ≥1 feedback entry. RED → GREEN.
- [ ] 5.4 Update `content/matematica/conventions.md` with ID scheme (`cn-<category>-<NN>`) and N-sin-cero convention for future skill expansions.
- [ ] 5.5 Run `sdd-verify` and `sdd-archive` after PR#5 merges.

### Verification
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
- Visual smoke: open `/learn/matematica/mat.u1.conjuntos_numericos` and `/practice`; confirm no unbarred roots, all categories present, difficulty progression visible.
- Per-PR line budget: ~150–250.

### Rollback
- Revert PR#5 → errores-comunes exercises gone. Purely additive.

---

## Cross-PR discipline
- Every PR opens with fresh test run (RED baseline), commits in work units, ends with all checks green.
- Every PR's last commit is per-PR documentation update (if any).
- `sdd-archive` is the LAST step after PR#5 merges.
- ENGRAM: each PR's apply phase MUST save a session_summary on close.
- GGA: each PR is reviewed before commit. No commits with AI attribution.

## Total forecast
- 5 PRs, ~1300–1700 changed lines total. Each PR well under 400-line budget.
- Time per PR: roughly one apply run (1–2 hours agent work + review).
- Total: about one working day of agent work, plus review.
