# Exploration: u1-rotonda-resolucion-problemas

> **Status:** Complete (revised — attempt 2 of 2)
> **Change:** `u1-rotonda-resolucion-problemas`
> **Date:** 2026-08-06
> **Scope:** End-of-Unit-1 guided theory + problem-solving experience built around the rotonda/pozo problem, integrated as a 5-stage sequence (comprender → buscar plan → llevarlo a cabo → verificar → comunicar). Source: `Unidad I - Conjuntos Numéricos.pdf`, pages 10–12.
> **Brand invariant:** the source material is pedagogical input only. Under the Ingenium brand rules in `AGENTS.md`, no source institution, faculty, program, or location is disclosed in any learner-facing copy, metadata, UI, or content. The app is one unified Engineering entrance-prep product.

---

## 1. Executive Summary

The user-approved product decision is to incorporate the rotonda/well problem at the **end of Mathematics Unit 1** as a guided theory + problem-solving experience. Two artifacts are needed:

1. **A coherent theory segment** (a new `TheoryNode`) that prepares the student for the problem: distance in the Cartesian plane, cardinal directions, modeling diagram, units, exact-vs-approximate values, radius vs diameter, maximum constraints, and the 5-stage problem-solving method itself.
2. **The 5-stage sequence** that applies the method: Comprender → Buscar un plan → Llevarlo a cabo → Verificar → Comunicar.

The user's framing ("at the end of Unit 1", "important") leaves genuine product decisions open. This exploration **maps the actual current Unit 1 completion model**, **separates product decisions from technical decisions**, and **flags verified capability gaps**. Architecture selection and PR slicing are explicitly deferred to design/proposal.

---

## 2. Current State — evidence-based mapping

### 2.1 Unit 1 completion model in the actual code

There is **no end-of-unit surface today**. "Unit complete" is a derived state computed in `buildRouteUnits` (`src/domain/student-home/index.ts:340-407`):

- `StudentRouteUnit.status` is `"mastered" | "in-progress" | "not-started"` (no fourth state).
- `status === "mastered"` requires `skills.every(s => computeMasteryLevel(s.skillId, progress) === "mastered")` (line 373-376).
- `computeMasteryLevel` (`src/domain/progress/index.ts:196-223`) returns `"mastered"` only when `accuracy >= 0.8` AND `attempts.length >= 5` AND trend is not `"needs-review"`.

So for U1 to read `"mastered"` on `MathRoutePanel`, **all 8 U1 pilot skills** must satisfy that bar. There is no celebration screen, no unit-complete badge, no "next unit unlocked" ceremony. The status is consumed only as a pill on the home route card (`src/components/home/student-home/MathRoutePanel.tsx:102-122`: `StatusPill variant="success"` with label `"Dominada"`).

**Capability gap confirmed:** the app has no user-facing end-of-Unit surface. The user's "end of Unit 1" framing presumes such a surface, but the only thing the app exposes today is the `mastered` pill on the route card.

### 2.2 Practice flow, challenges, and the overlay precedent

The phase machine in `src/app/practice/phases.ts` is a closed union:

```
select → theory → example → exercise → feedback → recovery → complete
```

`PracticeCompletePhase` (defined inline in `src/app/practice/page.tsx:300-356`) renders the green-check completion card and **conditionally injects `ChallengeOptInBlock`** when `hasChallengesForSkill(skillId)` is true. Challenges are an overlay at `complete`, not a phase. The capstone must follow the same overlay pattern: do not extend `phases.ts`.

`mat.u1.conjuntos_numericos` already has 2 challenges (`content/matematica/challenges/unit-1.json:476-553`): `desafio-01` ($\sqrt[3]{-8}$), `desafio-02` ($\{x \in \mathbb{Z}: \sqrt{x} \in \mathbb{Z}\}$). They are multiple-choice single items and do NOT cover 2D distance or 5-stage methodology.

### 2.3 Theory model and pedagogical visuals

`TheoryNode` (`src/domain/models/theory.ts:55`) supports `concepts[]`, `notation[]`, `commonMistakes[]`, `practicePrompts[]`, `intervalVisuals?`, `visualExamples?`. A `ConceptBlock` has `body` or `bodyParagraphs[]`, optional `intervalRepresentations?` and `visualExamples?`. `TheoryCard` renders them all.

`PedagogicalVisual` kinds (`src/domain/visuals/types.ts:120`): `sign-chart | distance-on-line | cartesian-line | systems-of-lines | interval-set`. **No 2D-point-with-distance visual exists** today. `DistanceOnLineVisual` is 1-D only (number-line).

### 2.4 Exercise interaction types — verified

`ExerciseType` (`src/domain/models/exercise.ts:33`) is the closed union:

```
multiple-choice | true-false | numerical | fill-blank | matching | ordering | graphical | structured
```

`ExerciseAnswerInput` (`src/components/exercises/ExerciseAnswerInput.tsx`) shows the truth:
- `multiple-choice` and `true-false` use `<input type="radio">` (single-select). **There is no checkbox/multi-select variant.**
- `numerical` and `fill-blank` use a single `<input type="text">` (`isTextAnswerType` in `src/components/exercises/exercise-answer-state.ts:8-15`). One field per exercise.
- `structured` is reserved for `pi-rational` and `angle-dms` (canonical JSON v1 envelopes, `src/domain/evaluator/structured.ts`).
- `matching` and `ordering` and `graphical` are in `MANUAL_REVIEW_TYPES` (`src/domain/evaluator/index.ts:27-31`) — no auto-grading.

**Capability gap confirmed:** the schema does not support multi-select ("select 3-4 true statements"). The user's "no free-text for structured math" rule (AGENTS.md) plus the absence of multi-select rules out the multi-statement identification I floated in the prior draft.

### 2.5 Existing Unit 1 themes the capstone must integrate

| Theme | Lives in app today? | Reference |
|---|---|---|
| Coordinate plane (2D axes, origin) | Partial: only 1-D distance visual. No 2D plot. | `src/components/math-visuals/DistanceOnLineVisual.tsx` |
| Cardinal directions (N/S/E/W → ±y/±x) | **Not present in theory.** | Source PDF page 12 item b names it explicitly. |
| Distance between two points (2D formula) | **Not in Unit 1.** Audit flagged `mat.u3.recta.distancia_entre_dos_puntos` as a U3 gap (`docs/auditorias/unidad-3/AUDITORIA_UNIDAD_3.md:203`). | Source PDF §7 page 10. |
| Teorema de Pitágoras | Referenced via the distance formula proof. Stand-alone in U4 (`mat.u4.pitagoras.1`). | Source PDF §7. |
| Radicales / irrationals | `mat.u1.potencias_raices` (theory, examples, exercises, feedback, 2 challenges). | Source PDF §2.4, §2.5. |
| Exact vs aproximado ($\cong$, $\approx$, $=$, $=$, …, $\dots$) | Yes (potencias_raices). | Source PDF page 5 + page 12 item a. |
| Intervalos (as buffer) | `mat.u1.intervalos` (theory, examples, exercises, feedback, 2 challenges). | Source PDF page 10 §6. |
| Operaciones reales | `mat.u1.propiedades_operaciones_reales`. | Source PDF §5. |
| Distancias 1-D como valor absoluto | `mat.u1.valor_absoluto`. | Source PDF §8 part 1: distance between two points on a line. |
| 5-stage method (comprender → plan → ejecutar → verificar → comunicar) | **Not present in the app.** Source PDF §8 is its only carrier. | This change introduces the method. |

**Conclusion:** the capstone retroactively introduces the 2D distance formula and the 5-stage method into Unit 1, both currently absent from the app. That is the user's explicit intent.

---

## 3. What "end of Unit 1" actually means — capability gap and trigger alternatives

The user's phrase **"at the end of Unit 1"** does not map cleanly to a current surface. Three honest readings exist; this exploration does not pick a winner because the choice is a real product decision:

| Trigger condition | Definition | Today's UX surface | Honest about Unit 1? |
|---|---|---|---|
| **A. First U1 root mastered** | `computeMasteryLevel("mat.u1.conjuntos_numericos") === "mastered"` | After the practice completion of that one skill. Accessible earliest. | Weak: 1 skill ≠ unit. |
| **B. All U1 roots attempted** | `progress.attempts.some(a => a.skillId === "mat.u1.conjuntos_numericos")` AND the same for `mat.u1.intervalos` | After the user has at least tried both roots. | Loose but bridges the bifurcation. |
| **C. All U1 skills mastered** | `StudentRouteUnit[U1].status === "mastered"` (current `buildRouteUnits` formula) | The route pill turns `"Dominada"`. **No unit-complete surface exists.** | Matches the home state, but the bar is high (5+ attempts per skill, ≥80% accuracy each) and the app surfaces it only as a pill. |
| **D. Add a new "unit-complete" surface** | New derived event when `C` flips; new home card / unit celebration screen | Requires new derivation + new UI. | Most honest; new capability. |

The user said the experience is **important** and tied to **end of Unit 1**. Reading the request through that lens, **A** is too narrow (it's "end of one skill" by another name) and **C without D** would leave the experience without a discoverable surface. **D** is the most honest match for "end of Unit 1" but is a new capability.

This is a real product decision the orchestrator must surface. The exploration does not pre-select.

---

## 4. Required / visible-end-of-unit / optional — product decision

The user said the experience is **important** but did not specify whether it blocks progression. The phrase "incorporate, at the end of Unit 1, the rotonda/well problem as a guided capstone sequence" leaves the gating open. Three honest readings:

| Product stance | What changes for the student | What changes for the data model | Honest framing |
|---|---|---|---|
| **Required capstone** | Cannot claim U1 mastered without completing the sequence. Becomes a hard gate. | Writes to `pre-utn.practice.v1` or to a new key that affects `computeMasteryLevel`. | Strongest "important" reading; biggest behavioral change. |
| **Visible end-of-unit module** | Surfaced in the home once U1 is mastered. Student must explicitly dismiss to advance to U2. | Owns an observed-state chip but does NOT change mastery. | Balanced: surfaces importance without blocking. |
| **Optional stretch experience** | Available from `/learn` or post-practice; no impact on U1 status. | Independent localStorage key, no effect on mastery. | Matches what I floated in the prior draft; weakest "important" reading. |

The exploration does not pick a winner. The orchestrator must surface this as a product decision.

---

## 5. The theory segment — explicit preparation, not a recap

The user's product decision explicitly says to incorporate the problem **with the theory involved in its approach**. The theory segment must be a real, dedicated `TheoryNode`, scoped to the integrated problem (not a recap of any existing skill), authored once and served alongside the 5-stage sequence.

### 5.1 Proposed `TheoryNode` outline

`id`: `theory-u1-rotonda-prep` (skillId: see §6 decision tree)

| Concept | Body focus | Body signals (no copy here, just topic intent) |
|---|---|---|
| 1. The Cartesian plane | Origin, axes, +x/-x/+y/-y; convention of east/+x and north/+y. | Anchor the convention the problem uses. |
| 2. Cardinal directions on the plane | N→+y, S→-y, E→+x, O→-x. Cardial directions map to signs. | Source PDF page 12 item b names this directly. |
| 3. Distance between two points | Formula $D = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ derived from Pitágoras. Worked example from the source PDF: $(-3, 6)$ and $(9, 1) \Rightarrow D = 13$. | Retroactively introduces U1 content the app lacks. |
| 4. Modeling the rotonda scenario | Translate "0,07 km al este" → 70 m, "30 m al norte" → 30 m, "caminos de 30 m de ancho" → 30 m buffer each side of the center. | The unit conversion step is the trap that §1's identification alone misses. |
| 5. Radius vs diameter | $r = d/2$, $d = 2r$. | Source PDF asks for the diameter, not the radius. |
| 6. Maximum constraints as buffer | Buffer $b = 10\,\text{m}$ between the well and the expropriation edge $\Rightarrow$ $r = D - (\text{road width}) - b$. | Brings U1 interval reasoning into a geometric constraint. |
| 7. Exact vs approximate values | $\cong$ for $\sqrt{5800} \approx 76{,}16$; $\cong$ for $2\sqrt{5800} - 80 \approx 72{,}32$. Never $=$ for irrational truncations. | Source PDF page 12 items a and b. |
| 8. The 5-stage method | Comprender → Buscar plan → Llevarlo a cabo → Verificar → Comunicar. | Source PDF §8. The capstone applies the method. |

The theory segment is the "**with the theory involved**" half of the product decision. Without it, the 5 stages have no preparation. **The theory segment is part of the same change, not a follow-up.**

### 5.2 Visuals and reused components

- Concepts 1, 2, 3 can reuse `cartesian-line` and `distance-on-line` visuals where applicable, plus inline KaTeX for the formula.
- Concepts 4–6 need a rotonda/pozo schematic that the existing `PedagogicalVisual` kinds do not cover (`sign-chart | distance-on-line | cartesian-line | systems-of-lines | interval-set`). **Capability gap confirmed:** no 2D-point-with-distance visual exists. Options are:
  - (i) Add a new `PedagogicalVisual` kind (e.g. `"distance-pair-2d"` or `"scene-diagram"`) with parser + renderer + figure. This is a non-trivial domain extension.
  - (ii) Render the diagram as a standalone static SVG in the capstone UI, outside the `PedagogicalVisual` family. Smaller blast radius but breaks the "theory visuals come from one catalog" pattern.
  - (iii) Defer the diagram and rely on inline KaTeX + prose for the first slice; add the visual as a follow-up.
  - This is a real product/architecture call. The exploration does not pick.

---

## 6. The 5-stage problem-solving sequence

Stages use **only verified supported interaction types** (`multiple-choice`, `numerical`, `fill-blank`). **No multi-select.** Each stage is one auto-graded exercise; the sequence runner owns the between-stage progression (it is not the practice-flow phase machine).

| Stage | Purpose (per source PDF §8) | Interaction | Student input | Evaluator |
|---|---|---|---|---|
| **1. Comprender** | Read the problem, identify data and unknowns, name units, model the situation. | `multiple-choice` (single). **One** MC question, not multi-select. Distractors must include a km-vs-m trap ("70 m" vs "0,07 m") and a "confusing road width with buffer" trap. | Pick the correct complete data summary. | MC evaluator. |
| **2. Buscar un plan** | Choose the formula/strategy. | `multiple-choice`. Options: distance-between-two-points, valor absoluto, intervals, percentage. | Pick the formula. | MC evaluator. |
| **3. Llevarlo a cabo** | Full calculation chain: $D = \sqrt{70^2 + 30^2}$; $r = D - 30 - 10$; $d = 2r$. **Single stage**, not three: the calculation is the unit. | One `numerical` exercise accepting the **approximate** diameter $72{,}32$ within `TOLERANCE = 0.01`. Feedback reveals exact form $2\sqrt{5800} - 80$. | Enter the diameter in meters. | Numeric evaluator. |
| **4. Verificar** | Verify formulas, operations, units, approximation symbol, and plausibility. **Not** "compute the final diameter again". | Two micro-prompts in one stage: (a) `true-false`: "El diámetro calculado usa $=$ en lugar de $\cong$, ¿es correcto?"; (b) `numerical`: re-enter $D \approx 76{,}16$ as a sanity check. Two sub-questions, NOT multi-select. | (a) Pick Verdadero/Falso. (b) Enter the distance. | TF + numeric evaluators. |
| **5. Comunicar** | Write the complete contextual answer. | `multiple-choice`: four sentences that vary in (i) presence of units, (ii) use of $\cong$ vs $=$, (iii) inclusion of the source/justification. Correct option names the unit, uses $\cong$, and states the constraint. | Pick the complete sentence. | MC evaluator. |

**Honest scope of stage 3**: it owns the full chain. The student's single numeric input is the final diameter; the feedback narrative walks through each step (distance, subtract road width, subtract buffer, multiply by 2). This preserves productive modeling difficulty without turning ambiguity into UI confusion.

**Honest scope of stage 4**: it verifies, it does not re-compute. Sources for the verification checks: source PDF page 12 item a ($\cong$ vs $=$), item b (centésimo digit), and the units trap from §1 of the theory segment. A student who skips ahead to type $72{,}32$ in stage 3 still has to defend $\cong$ vs $=$ in stage 4 and 5.

**Multi-select is not supported** by the current schema. If the user wants "identify all true statements" interactions in stage 1 or 4, that requires:
- New `ExerciseType` member (e.g. `"multi-select"`).
- New evaluator branch in `src/domain/evaluator/`.
- New renderer in `ExerciseAnswerInput.tsx` using `<input type="checkbox">`.
- New audit test in `catalog-answer-contract.test.ts`.

The exploration flags this as a real capability gap and uses single-select instead. The orchestrator must surface it as a real product decision: extend the schema, or use single-select for these stages.

---

## 7. Affected areas — what we know now (architecture selection deferred)

The exploration does **not** pre-select a new `src/domain/capstone/` module. It maps where the change touches and lists viable integration paths.

### 7.1 Domain layer (pure, no framework imports)

- `src/domain/models/exercise.ts` — no change required if all 5 stages are ordinary `Exercise` entries. A new `multi-select` type would touch `ExerciseType` and `ExerciseOption`.
- `src/domain/models/theory.ts` — no change required; the new theory node is data-only.
- `src/domain/progress/index.ts` — **read-only consumer of unit-mastery**; only relevant if product stance is "Required capstone" (which would write into a path that affects mastery). For "Visible end-of-unit" or "Optional", this file is untouched.
- `src/domain/student-home/index.ts` — only relevant if we add a new unit-complete derived signal (D in §3). Otherwise untouched.
- `src/domain/visuals/types.ts` — only relevant if we add a new `PedagogicalVisual` kind for the rotonda diagram. Otherwise untouched.
- `src/domain/evaluator/` — only relevant if we add `multi-select`. Otherwise untouched.

### 7.2 Content layer

- New: `content/matematica/theory/unit-1.json` — append the new `theory-u1-rotonda-prep` node.
- New: `content/matematica/u1-rotonda-capstone.json` — the 5-stage sequence as 5 ordinary `Exercise` entries plus a sequence descriptor (skill reference, stage order, stage metadata). Or two files: theory and exercises, mirroring `theory/unit-1.json` + `exercises/unit-1.json`.
- `src/domain/error-taxonomy/index.ts` — append new U1 tags for the 2D distance mistakes (e.g. `u1_dist_2d_orden_coordenadas`, `u1_dist_2d_signo_resta`) if a new detector ships in the same change.

### 7.3 UI layer

- New: `src/components/capstone/` (or whatever the architecture chooses) — `CapstoneOptInCard`, `CapstoneSequenceRunner`, per-stage components, opt-in wiring.
- `src/components/practice/PracticeCompletePhase.tsx` (currently inline in `src/app/practice/page.tsx:300-356`) — slot for the capstone opt-in card. Coexists with `ChallengeOptInBlock`.
- `src/app/practice/page.tsx` — inject the slot only when the trigger condition (§3) is met.
- `src/app/learn/matematica/page.tsx` and `/learn/matematica/[skillId]/page.tsx` — surface the theory node and the entry to the sequence. The theory detail page already loads from `loadTheoryContent(unitKey)` filtered by `skillId`; the new node must therefore carry a real `skillId`.
- `src/components/home/StudentSituationPanel.tsx` / `MathRoutePanel.tsx` — only relevant if product stance requires a new observed-state chip.

### 7.4 Persistence

- New: `src/lib/capstone-progress.ts` (mirrors `src/lib/advanced-practice-progress.ts` if we go overlay; or extends the existing practice-progress if product stance is "Required capstone").
- New localStorage key `pre-utn.capstone.v1` (overlay stance) **or** no new key, writing into `pre-utn.practice.v1` (required stance).

### 7.5 Accessibility / responsive

- `aria-live="polite"` on stage transitions (matches `PracticeExercisePhase` precedent).
- 44px min-height touch targets on all buttons (matches `ChallengeOptInBlock` precedent).
- Any diagram carries `aria-label` + `<title>` + `<desc>` consistent with `PedagogicalVisualFigure` (`src/components/math-visuals/PedagogicalVisualFigure.tsx`).

### 7.6 Brand voice (AGENTS.md)

- No "tu profe", "plan a tu medida", "diagnóstico personalizado con IA".
- No source institution / faculty / program / location in any learner-facing copy, UI, or content.
- $\cong$ vs $=$ discipline preserved in copy and feedback.

---

## 8. Viable integration paths (architecture selection deferred)

The exploration lists paths without picking. The design/proposal phase decides.

| Path | Where the sequence lives | What changes for `phases.ts` | Pros | Cons |
|---|---|---|---|---|
| **P1: Overlay at unit-complete** | New component slot in `PracticeCompletePhase` of the **last** U1 skill (currently `mat.u1.logaritmos`), or in a new derived "U1 complete" surface. Coexists with `ChallengeOptInBlock`. | None. Same overlay precedent as challenges. | Zero coupling to base practice progress; visible at the moment the user is finished; easy rollback. | Requires a unit-complete surface (capability gap, §3 D). |
| **P2: New entry at `/learn/matematica/{u1-capstone}`** | The theory node + sequence runner under a new URL. Reachable from the home once U1 is mastered. | None. | Discoverable from `/learn`; no coupling to practice flow. | Not "at the end of Unit 1" in the strong sense; just "available when U1 is done". |
| **P3: Add `mat.u1.resolucion_problemas` as a new U1 root + practice flow** | Treated like any other skill: theory phase → example phase → exercise phases → complete. | None if the practice flow runs the standard machine. | Reuses all existing UI; appears in `MathRoutePanel`. | Violates AGENTS.md ("no free-text for math") if a "comunicar" stage is added; violates the U1 bifurcation invariant unless registered as a root (and adding a 3rd U1 root requires a chained ADR per `openspec/specs/math-skill-model/spec.md` §"Root-Skill Bifurcation Convention"). |
| **P4: Pure home dashboard card** | After U1 mastered, a card appears on the home with the same theory node + sequence runner. | None. | Honest "end-of-unit" surface; integrates with existing dashboard. | New home surface; needs design + a new "end-of-unit" celebration pattern. |

Path P1 is the closest to the user's "at the end of Unit 1" if a unit-complete surface exists; P4 is the closest if we need to build that surface. The orchestrator decides.

---

## 9. Scope, risks, accessibility, capability gaps (evidence-based)

### 9.1 Scope envelope (product-only; technical decisions deferred)

- **In:** the theory segment (new `TheoryNode`, 8 concepts), the 5-stage sequence (5 ordinary `Exercise` entries), the sequence runner UI, the opt-in slot, brand-voice + institutional-disclosure tests.
- **Out:** PR slicing, skill registration, storage key, file naming, new module vs reuse — all deferred to design/proposal.
- **Not in this change:** replication to U2/U3; new home unit-complete celebration; multi-select exercise type unless user opts in.

### 9.2 Capability gaps the orchestrator must surface

1. **No end-of-Unit surface today.** The home shows a `Dominada` pill only. The user's "end of Unit 1" framing requires either (a) accepting that trigger A or B (loose) is enough, or (b) building a new derived "unit-complete" event and surface (D in §3).
2. **No multi-select schema.** If any stage needs multi-select, that's a schema + evaluator + renderer + audit extension. The exploration uses single-select instead and flags this.
3. **No 2D-point-pair visual.** The rotonda diagram requires either a new `PedagogicalVisual` kind or a standalone SVG outside that family, or deferral.
4. **No `multi-select` schema member.** See #2.

### 9.3 Risks

- **Brand voice drift.** Mitigated by extending `src/domain/__tests__/copy-strings-acceptance.test.ts` with capstone-specific forbidden tokens and a new content-acceptance test scanning `content/matematica/u1-rotonda-capstone.json` for institutional-source tokens.
- **Institutional disclosure.** Same mitigation: content-acceptance test plus a strict no-mention rule in the copy brief.
- **Phase-machine regression.** The capstone MUST NOT mutate `src/app/practice/phases.ts`. Mitigated by a snapshot test of the closed `PracticePhase` union.
- **Mastery contamination.** Only relevant if product stance is "Required capstone". For "Visible" or "Optional", an isolated localStorage key prevents contamination.
- **2D distance mistake ambiguity.** Stage 2's "choose the formula" MC + stage 4's verification cover the common mistakes. Optional new error tags can ship if a detector is added in the same change.
- **Numerical input ambiguity at stage 3.** The stage accepts the approximation; the feedback reveals the exact form. The unit ("m") is part of the prompt and the stage 5 sentence.
- **Multi-select trap.** If the user insists on multi-select, schedule it as its own scoped change with its own ADR.
- **Accessibility.** Keyboard navigation, `aria-live="polite"`, 44px min-height touch targets, textual fallback for any diagram. Tested.
- **Review budget (technical, deferred).** Whichever architecture wins, the slice has at least 5 sub-deliverables (theory JSON, sequence JSON, sequence runner, opt-in slot, tests). A single-PR delivery is unlikely to fit 400 lines; chained PR matches the precedent set by `challenge-exercises-expansion`, `fortalecer-u3-lenguaje-modelizacion-transferencia`, and `challenge-smoke-e2e`.
- **Difficulty-vs-reveal.** Stage 5's MC distractor uses `=` instead of `≅`; the correct option uses `≅`. Stage 4's first sub-question asks whether `=` is correct. A student cannot pass by typing `72,32` alone — they must also defend the approximation symbol in stages 4 and 5.

### 9.4 Assessment signals (if product stance is "Optional" or "Visible")

- Per-stage correctness and final outcome persisted to `pre-utn.capstone.v1` (independent key, overlay stance) or merged into observed-state signals.
- Home dashboard may later show an observed-state chip "Resolviste el problema integrador de la unidad 1" (no mastery impact).

---

## 10. Open product decisions for the orchestrator

The exploration does **not** pre-resolve these. The orchestrator surfaces them to the user:

1. **Trigger condition**: A (first U1 root mastered), B (both roots attempted), C (all U1 mastered, current pill), or D (new unit-complete surface)?
2. **Product stance**: Required (blocks U1 mastery), Visible end-of-unit (chip on home, non-blocking), or Optional stretch (no impact)?
3. **Multi-select**: extend the schema to add `multi-select`, or use single-select for all stages?
4. **Rotonda diagram**: new `PedagogicalVisual` kind, standalone SVG, or defer the visual?
5. **Sequence URL/surface**: `/practice?capstone=u1-rotonda` (overlay), `/learn/matematica/u1-rotonda` (dedicated), or home card?

Technical decisions (PR slicing, skill registration, file naming, persistence key, sequence-runner architecture) are **deferred to the design/proposal phase** and are not gating the product decision.

---

## 11. Ready for Proposal

**Partially yes.** The product framing is clear, the capability gaps are evidence-based, the 5-stage method is preserved accurately, and the theory segment is planned explicitly. The orchestrator can proceed to `sdd-propose` after the user answers the five product decisions in §10.

**Not yet:** architecture selection (P1/P2/P3/P4 in §8) and PR slicing. Those belong to `sdd-design`, not `sdd-propose`.

The artifact here is the **exploration** only. Per the sdd-explore skill, no `proposal.md`, `design.md`, `tasks.md`, or `specs/*` artifacts are created in this phase. `STATUS.json` is **not** updated (no branch, change is in *explored* state).

---

## 12. SDD Result Envelope (mandatory fields)

- **status**: success
- **executive_summary**: The end-of-Unit-1 rotonda/well problem is incorporated as a guided theory + problem-solving experience: a new dedicated `TheoryNode` (Cartesian plane, cardinal directions, distance formula, modeling, units, radius/diameter, max constraints, exact-vs-approximate, 5-stage method) prepares the student; a 5-stage sequence (comprender → buscar plan → llevarlo a cabo → verificar → comunicar) applies it. The current app has no end-of-Unit surface (capability gap), no multi-select schema (capability gap), and no 2D-point-pair visual (capability gap); each is flagged for a real product decision. The 5-stage method is preserved accurately: Comprender identifies data and units; Buscar un plan chooses the formula; Llevarlo a cabo owns the full calculation chain; Verificar verifies formulas, operations, units, approximation symbol, and plausibility (it does not re-compute the final diameter); Comunicar owns the complete contextual answer with units and the correct $\cong$ vs $=$ usage. Under the Ingenium brand rules in AGENTS.md, no source institution, faculty, program, or location is disclosed in any learner-facing copy, UI, or content. The trigger condition, product stance (required/visible/optional), and integration path are open product decisions for the orchestrator; technical decisions (PR slicing, skill registration, storage key, architecture) are deferred to design.
- **artifacts**:
  - `openspec/changes/u1-rotonda-resolucion-problemas/exploration.md` (this file)
  - Engram observation id `5131` updated in place via topic_key `sdd/u1-rotonda-resolucion-problemas/explore` (architecture type)
- **next_recommended**: `sdd-propose`, after the user answers the five product decisions in §10 (trigger condition, product stance, multi-select, rotonda diagram, sequence URL/surface). Architecture selection and PR slicing are NOT gating the product proposal.
- **risks**: brand-voice drift; institutional disclosure; phase-machine regression if `phases.ts` is mutated; mastery contamination (only relevant under "Required" stance); 2D distance mistake ambiguity; numerical input ambiguity at stage 3; capability gaps in unit-complete surface / multi-select / 2D-point-pair visual; review budget forces chained-PR delivery under any architecture.
- **skill_resolution**: paths-injected — `C:\Users\pablo\.config\opencode\skills\sdd-explore\SKILL.md`, `C:\Users\pablo\.config\opencode\skills\cognitive-doc-design\SKILL.md`, `C:\Users\pablo\.agents\skills\impeccable\SKILL.md` — all three loaded.