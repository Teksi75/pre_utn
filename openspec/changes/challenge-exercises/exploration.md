## Exploration: Challenge Exercises

### Current State

The Pre UTN guided practice flow is a **forward-only phase machine** managed by `usePracticeFlow` (`src/app/practice/usePracticeFlow.ts`). Phases: `select → theory → example → exercise → feedback → recovery → complete`. Pure transition logic in `phases.ts` (`nextPhase`).

**Exercise loading**:
- `queryBySkill(skillId)` in `src/domain/catalog/index.ts:216` returns all exercises for a skill, sorted by `difficulty` asc then `id` asc.
- The full `Exercise` type is in `src/domain/models/exercise.ts`. There is NO concept of "challenge" — every exercise is a standard practice item. `Exercise` has 12 declared fields plus extra fields passed through (e.g. `relatedTheoryIds`, `canonicalTrace`).
- `loadExercisesForSkill(skillId)` in `src/domain/catalog/content-loaders.ts:578` composes from 3 sources: unit file (`unit-1.json` / `unit-2.json`), main catalog (`exercises.json`), per-skill file (e.g. `conjuntos-numericos.json`).
- Coverage: `UNIT_THRESHOLDS` enforces minimums per unit (unit-1: 40, unit-2: 20, others default 5). `validatePracticeBank` enforces per-category minimums (pertenencia: 8, clasificacion: 12, etc.) for `loadSkillBank`.

**Practice flow runtime**:
- `handleNextExercise` increments `exerciseIndex` and advances. When `nextIndex >= exercises.length` it calls `resetToSelect()` — i.e. the entire skill practice session ends and the user returns to the FocusSelector.
- `handleAnswerSubmit` evaluates via `evaluateAnswer`, generates feedback, captures a session-scoped `previousSnapshot` (read-only preview of the previous submission), and persists via `addAttempt` to localStorage.
- `PracticeAttempt` schema (domain): `exerciseId, skillId, correct, errorTag, answeredAt, difficulty, timeMs, attemptIndex, studentId`. Attempts are deduped by `exerciseId` keeping the latest, and the latest attempt per exercise feeds `computeAccuracy` and `computeMasteryLevel`.
- `PracticeCompletePhase` (in `page.tsx`) renders the green check + "Resolviste los N ejercicios" + 3 actions. This is where the user lands after the last standard exercise.

**Progression gating**:
- `SKILL_DEPENDENCIES` in `src/domain/models/skill-catalog.ts:105` declares directed edges between skills.
- `accessibility.ts` + `PREREQUISITE_ACCURACY_THRESHOLD = 0.7`: a pilot skill is `accessible` when content is ready (`isSkillReady`) AND every prereq's accuracy is ≥ 0.7.
- `computeMasteryLevel` (progress/index.ts:196): 5+ attempts + ≥0.8 accuracy + non-regressing trend → "mastered". Used by home dashboard and FocusSelector mastery pill.

**Catalog/Content sources** (write targets for new exercises):
- `content/matematica/exercises/unit-1.json` (2032 lines, includes U1 skills)
- `content/matematica/exercises/unit-2.json` (721 lines, includes U2 skills)
- `content/matematica/exercises/conjuntos-numericos.json` (per-skill override)
- `content/matematica/exercises.json` (legacy main catalog, mostly U3-U6)

### Affected Areas

- `src/app/practice/usePracticeFlow.ts` — Hook point 1: `handleNextExercise` (line 322) currently calls `resetToSelect()` when standard exercises are exhausted. Needs to detect the end and offer a challenge phase instead.
- `src/app/practice/phases.ts` — `PracticePhase` union and `nextPhase` switch. Adding `"challenges"` requires updating both.
- `src/app/practice/page.tsx` — Hook point 2: `PracticeCompletePhase` (line 295). Needs to surface the "Hacer ejercicios de desafío" CTA.
- `src/domain/catalog/index.ts` or `src/domain/catalog/content-loaders.ts` — Either a new `queryChallengesBySkill(skillId)` filter (tag-based) or a new `loadChallengesForSkill(skillId)` loader (separate file).
- `src/components/practice/PracticeExercisePhase.tsx` — Reusable as-is for the challenge phase (same answer form, same card).
- `src/components/practice/PracticeFeedbackPhase.tsx` — Reusable as-is (retry + warm legend patterns apply to challenges too).
- `content/matematica/exercises/unit-1.json` and `unit-2.json` — New challenge exercises authored here (tag-based) OR new per-skill/per-unit `challenges-*.json` files.
- `src/domain/progress/index.ts` — Decision needed: do challenge attempts feed `computeAccuracy` / `computeMasteryLevel`? If yes (recommended), no code change — they already count.

### Approaches

1. **Tag-based filter (Recommended for MVP)** — Add a `tags: ["challenge"]` (or a new `isChallenge: boolean`) to a subset of existing/new exercises. `queryChallengesBySkill(skillId)` filters the catalog by this tag. No schema changes; minimal new code.
   - Pros: Zero schema changes. Reuses existing catalog composition. Tag is preserved in JSON, easy to author. `Exercise` type unchanged. Validation unchanged.
   - Cons: Tag is not strongly typed (it's a free-form `string[]`); need convention enforcement via tests. Mixed with standard exercises in raw JSON.
   - Effort: **Low–Medium** (1 domain query, 1 UI phase, 1 selector copy, 1 test).

2. **Separate challenges JSON file(s)** — New `content/matematica/exercises/challenges-unit-1.json`, `challenges-unit-2.json`, or per-skill `challenges-<skill>.json`. New `loadChallengesForSkill(skillId)` and `queryChallengesBySkill(skillId)`.
   - Pros: Clean separation; explicit ownership; no tag pollution; easy to add/remove challenges per skill. Bypasses standard bank validation (no per-category minimum). Follows the `conjuntos-numericos.json` precedent for per-skill files.
   - Cons: New content file convention to document; new loader/registry entry; one more file per skill to author.
   - Effort: **Medium** (new loader, new query, 1 UI phase).

3. **Extend `Exercise` with a `kind: 'standard' | 'challenge'` field** — Structural change to the model and all authoring.
   - Pros: Strongly typed. Self-documenting in JSON.
   - Cons: Schema migration for ALL existing exercises. Changes validation. Largest blast radius. Probably overkill.
   - Effort: **High** (model change, validation change, all existing tests update).

4. **Pure UI: just re-show standard exercises in "challenge mode" after `complete`** — Don't add new content, just relabel the last N exercises as challenges.
   - Pros: No content authoring.
   - Cons: Doesn't match the user's intent (challenges should be NEW harder exercises, not recycled). Re-doing the same exercises is poor pedagogy.

### Recommendation

**Approach 2 (separate challenges JSON files)** is the cleanest for long-term content ownership, **Approach 1 (tag-based filter)** is faster and uses the existing catalog composition. Both are defensible.

For the MVP-first iteration:
- **Start with Approach 1** (tag-based) for the first skill where challenges ship, to validate the UX (does the "Hacer ejercicios de desafío →" CTA land? does the warm legend copy work? does non-blocking actually work?).
- **Migrate to Approach 2** if/when challenge content grows across many skills — the per-skill JSON file makes ownership clear and content authors can add challenges without touching the standard bank.

**Key design decisions** (regardless of approach):
- Challenges are **non-blocking**: students can return to the selector without doing them. "Elegir otra habilidad" stays a primary CTA in the challenge intro screen.
- Challenges **persist attempts** like standard exercises (same `addAttempt` flow) — students' challenge performance contributes to their accuracy and mastery. This is honest data the future docente panel can use.
- Challenges **do not** change the difficulty progression validator or the per-unit coverage threshold.
- The challenge phase appears **only when the skill has ≥1 challenge exercise**; otherwise the practice flow ends at `complete` exactly as today.
- The challenge intro card should be honest: "Esto es opcional. Si querés irte al selector, andá tranquilo."

### Risks

- **Catalog composition: mixed sources** — `loadExercisesForSkill` already composes from 3 sources. If challenges use Approach 1 (tags), they need to be filtered out of the standard bank (`queryBySkill` must NOT return challenge-tagged exercises); if they use Approach 2, they need their own loader. Either way, the composition in `getComposedExercises` / `loadExercisesForSkill` is the place to enforce "no challenges in the standard bank."
- **Mastery math** — Challenges contributing to accuracy may inflate mastery. Need a decision: do challenges count toward `computeAccuracy` / `computeMasteryLevel`? If yes (recommended for honest data), the home mastery pill may show "mastered" sooner for a student who did many challenges. If no, the filter is harder. **Recommendation**: count them, document the behavior, and let the home dashboard tell the truth.
- **Phase machine** — `phases.ts` has a closed switch on `PracticePhase`. Adding `"challenges"` requires updating the union AND the switch in `nextPhase`. Easy to miss in a refactor; needs a test.
- **PracticeCompletePhase copy** — The existing copy says "Resolviste los N ejercicios." If we add a "challenges" gate before this screen, the message becomes ambiguous. Need to either: (a) show a separate "challenges available" card BEFORE the completion screen, or (b) rename the current screen to "Práctica completada — ¿algo más?" and have a "challenges" screen come after.
- **Existing test breakage** — `catalog.test.ts` asserts that `loadCatalog` returns at least 30 exercises and that each unit has ≥5. Adding challenges as a separate bank (Approach 2) keeps these green. Adding them as tagged entries inside the existing files (Approach 1) is also fine, BUT any new test that asserts the total count of standard exercises will need to be challenge-aware.
- **Validation rules** — AGENTS.md prohibits free-text/symbolic for `numerical` and `fill-blank`. Challenges must respect this — no new escape hatch.
- **Canonical trace** — Existing traceability audit flags exercises with `relatedTheoryIds` / `relatedExampleIds` but no `canonicalTrace`. Challenges that link to canonical material must include the trace; challenges that don't (synthesis exercises) are fine without it.
- **Pedagogical intent** — Challenges by definition push harder. They should be difficulty 4–5 (or labeled as such) and the `pedagogicalNote` should make the intent clear: "Ejercicio de desafío: integra X con Y, espera razonamiento de varios pasos." This is a content guideline, not a code change.
- **No-`any` / strict TS** — Any new query function must follow the existing pattern (e.g. `queryByDifficultyRange` with explicit return type).
- **AGENTS.md brand voice** — Copy for the challenge intro card must respect the "neutral to use context" rule. Don't say "tu profe te recomienda hacer los desafíos" — say "si querés, hay desafíos disponibles; no son obligatorios."
- **`< 400` PR budget** — This change touches: 1 domain loader (or new query), 1 phase, 1 component, copy, 1 test file. Estimate 250–400 lines diff for a minimal Approach 1 first cut. Should fit in a single PR if it's tight, or split into 2 PRs (domain+loader+query → UI+phase+wiring) following the chained-PR pattern used in `feat-practice-attempt-timing-and-retry`.

### Ready for Proposal

**Yes.** The scope is well-defined, the architecture is well-understood, and the integration points are clear. The orchestrator can proceed to `sdd-propose` with a clear set of options for the user to choose between (Approach 1 vs Approach 2; full rollout across all 15 pilot skills vs 1 pilot skill first; do challenges count toward mastery yes/no).

**Key clarification the orchestrator should get from the user**:
1. Tag-based (Approach 1) or separate file (Approach 2)?
2. Pilot on 1 skill first (recommended for UX validation) or all 15 pilot skills in one slice?
3. Do challenge attempts count toward accuracy and mastery? (Recommendation: yes, but it's a product call.)
