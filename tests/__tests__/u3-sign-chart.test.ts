/**
 * S5 — Inecuaciones producto-cociente (P9 family) base content + diff-5 challenge +
 * scoped detectors. Mirrors the structure of `u3-abs-eq-p8.test.ts` (S3) for the
 * P9 sign-chart leaf skill `mat.u3.inecuaciones_producto_cociente`.
 *
 * Scope (NO production-code change yet — this file is the RED baseline):
 *   - 6 P9 base MC exercises covering:
 *       P9w diff-3 (.2): (2x − 1)(x − 3) ≥ 0 ⇒ (-∞, 1/2] ∪ [3, +∞)
 *       P9q diff-3 (.3): x² ≤ x ⇒ [0, 1]
 *       P9p diff-4 (.4): (x − 2x²)(x + ½) ≤ 0 ⇒ [-½, 0] ∪ [½, +∞) [factor x preserved]
 *       P9r diff-4 (.5): x/(x + 1) < 3 ⇒ (-∞, -3/2] ∪ (-1, +∞)
 *       P9t diff-4 (.6): (-1 − 3x)/(1 − 4x) < 2 ⇒ (-∞, 1/4) ∪ (3/5, +∞)
 *       P9u diff-4 (.7): (x + 2)/(2 − x) ≥ 1 ⇒ [0, 2)  [excludes denominator zero x=2]
 *   - 1 difficulty-5 MC challenge for `mat.u3.inecuaciones_producto_cociente`
 *     anchored in P9v: (x² − x)/((x + 1)(2 − x)) ≥ 0 ⇒ (-1, 0] ∪ [1, 2).
 *   - 3 OWN detectors wired for `u3_signchart_factor_signo_incorrecto`,
 *     `u3_signchart_critical_root_mitido`, `u3_signchart_dominio_denominador`,
 *     tightly scoped to the P9 sign-chart signature.
 *   - #82 (#82 owns P7/P10/P13-19/P31) and #83 (#83 owns P22/P23/P30)
 *     anchors MUST NOT appear in any new P9 entry.
 *   - Readiness flips from `theory-ready` (S4) to `practice-ready`.
 *   - #82/#83 no-bleed across base + desafio (corpus scan).
 *
 * Test contract groups (mirrors S3 P8 coverage shape):
 *   1. Exact math — every P9 anchor carries the canonical solution set
 *      (P9p factor x preserved; P9u denominator boundary excluded; P9v with
 *      domain exclusions).
 *   2. MC + difficulty discipline (no free-text, diff 1-4 for base).
 *   3. Trace — every entry's canonicalTrace resolves to 03_ej_utn.pdf.
 *   4. Challenge — 1 diff-5 MC for the P9 skill.
 *   5. Detector positive — u3_signchart_factor_signo_incorrecto.
 *   6. Detector positive — u3_signchart_critical_root_omitido (P9p factor-x trap).
 *   7. Detector positive — u3_signchart_dominio_denominador (P9u/P9v).
 *   8. Detector negative — no bleed to unrelated skills or signatures.
 *   9. #82/#83 no-bleed across P9 entries.
 *  10. Worked examples — ≥3 preserved (S4 added them, S5 must not delete any).
 *  11. Readiness flips from theory-ready (S4) to practice-ready (S5).
 *  12. Existing desafios preserved; only inecuaciones_producto_cociente adds 1.
 */

import { describe, test, expect } from "vitest";
import { validateTracePath } from "@/lib/trace-path";
import { validateChallengeEntry, loadChallengesForSkill, loadChallengesForUnit } from "@/lib/challenges/loader";
import { loadExercisesForSkill, loadExampleContent } from "@/domain/catalog/content-loaders";
import { tagError } from "@/domain/evaluator/error-tagging";
import { loadFeedbackContent } from "@/domain/catalog/content-loaders";
import { loadTaxonomy, lookupTag } from "@/domain/error-taxonomy";
import { generateFeedback } from "@/domain/feedback";
import { evaluateAnswer } from "@/domain/evaluator/index";
import { getSkillComponents, isSkillReady } from "@/domain/catalog/readiness";
import { getSkillAvailability } from "@/domain/catalog/skill-availability";
import type { Exercise } from "@/domain/models/exercise";

const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const P9_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";
const SKILL = "mat.u3.inecuaciones_producto_cociente";
const FORBIDDEN_TOKENS = [
  "P7", "P10", "P13", "P14", "P15", "P16", "P17", "P18", "P19",
  "P31", "P22", "P23", "P30",
];

const findP9 = (id: string): Exercise | undefined =>
  loadExercisesForSkill(SKILL).find((e) => e.id === id);

// P9 anchors and their canonical (expected, options[], distractor) tuples.
// Each entry: [id, promptAnchor, expectedAnswer, distractorSingleValue]
// Inequality operators may appear as Unicode (≥, ≤) or LaTeX (\geq, \leq) in
// the corpus; both forms are accepted. Rational expressions may appear as
// x/(x+1) OR as \frac{x}{x+1} (LaTeX fraction); both forms are accepted.
const LEQ = String.raw`(?:≤|\\leq|<=)`;
const GEQ = String.raw`(?:≥|\\geq|>=)`;
const INF = String.raw`(?:\\infty|∞)`;

const P9_ENTRIES: ReadonlyArray<readonly [string, RegExp, RegExp]> = [
  // .2 P9w variante diff-3: (2x + 1)(x − 5) ≥ 0 ⇒ (-∞, -1/2] ∪ [5, +∞)
  ["ex.u3.inecuaciones_producto_cociente.2", new RegExp(String.raw`\(2\s*x\s*\+\s*1\)\s*\(\s*x\s*-\s*5\s*\)\s*${GEQ}\s*0`), new RegExp(String.raw`\(\s*-\s*${INF}\s*,\s*-\s*1\s*\/\s*2\s*\]`)],
  // .3 P9q variante diff-3: x² ≤ 3x ⇒ [0, 3]
  ["ex.u3.inecuaciones_producto_cociente.3", new RegExp(String.raw`x\s*\^\s*2|x².*${LEQ}|${LEQ}.*x²`), /\[\s*0\s*,\s*3\s*\]/],
  // .4 P9p variante diff-4: (x − 2x²)(x + ⅓) ≤ 0 ⇒ [-⅓, 0] ∪ [½, +∞) — factor x preserved
  ["ex.u3.inecuaciones_producto_cociente.4", new RegExp(String.raw`\(x\s*-\s*2x\s*\^?2\)`), new RegExp(String.raw`\[\s*-\s*1\s*\/\s*3\s*,\s*0\s*\]\s*∪\s*\[\s*1\s*\/\s*2\s*,\s*\+\s*${INF}\s*\)`)],
  // .5 P9r variante diff-4: x/(x − 3) < 2 ⇒ (-∞, 3) ∪ [6, +∞)
  ["ex.u3.inecuaciones_producto_cociente.5", /x\s*\/\s*\(\s*x\s*-\s*3\s*\)\s*<\s*2|\\frac\s*\{\s*x\s*\}\s*\{\s*x\s*-\s*3\s*\}\s*<\s*2/, new RegExp(String.raw`\(\s*-\s*${INF}\s*,\s*3\s*\)\s*∪\s*\[\s*6`)],
  // .6 P9t variante diff-4: (2x − 1)/(3 − 5x) < 4 ⇒ (-∞, 13/22] ∪ (3/5, +∞)
  ["ex.u3.inecuaciones_producto_cociente.6", /2x\s*-\s*1.*3\s*-\s*5x.*<\s*4/, new RegExp(String.raw`\(\s*-\s*${INF}\s*,\s*13\s*\/\s*22\s*\]`)],
  // .7 P9u variante diff-4: (x + 3)/(2 − x) ≥ 1 ⇒ [-1/2, 2) — denominator zero x=2 EXCLUDED
  ["ex.u3.inecuaciones_producto_cociente.7", /x\s*\+\s*3.*2\s*-\s*x.*(?:≥|\\geq|>=)\s*1/, /\[\s*-?\s*1\s*\/\s*2\s*,\s*2\s*\)/],
];

// ── 1. EXACT MATH — every P9 anchor carries the canonical solution set ────

describe("S5 — exact math: every P9 base exercise carries the canonical solution set", () => {
  test.each(P9_ENTRIES)(
    "%s loads with the canonical expectedAnswer and matching prompt signature",
    (id, promptPattern, expectedPattern) => {
      const e = findP9(id);
      expect(e, `${id} must exist`).toBeDefined();
      expect(e!.type, `${id} must be multiple-choice`).toBe("multiple-choice");
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      expect(e!.prompt, `${id} prompt must carry the P9 anchor`).toMatch(promptPattern);
      expect(e!.expectedAnswer, `${id} expectedAnswer must match canonical set`).toMatch(expectedPattern);
      // expectedAnswer must appear in the options list (MC contract).
      const values = (e!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
      expect(values, `${id} expectedAnswer must be in options`).toContain(e!.expectedAnswer);
    },
  );

  test("P9p (.4) preserves factor x in expectedAnswer (NOT collapsed to [-1/3, 1/2])", () => {
    const p9p = findP9("ex.u3.inecuaciones_producto_cociente.4");
    expect(p9p).toBeDefined();
    const finalLower = p9p!.expectedAnswer.toLowerCase();
    // Must include the union of two intervals (factor x preserves the 0 critical root)
    expect(finalLower, "P9p expectedAnswer MUST use union ∪").toMatch(/∪/);
    // Must include -1/3 (the first interval's lower bound)
    expect(finalLower, "P9p expectedAnswer must include -1/3").toMatch(
      /-\s*1\s*\/\s*3/,
    );
    // Must include 0 (the FACTOR X critical root that the bug would lose)
    expect(finalLower, "P9p expectedAnswer must include 0 (factor-x preserved)").toMatch(/\b0\b/);
    // Must include 1/2 (the third critical root)
    expect(finalLower, "P9p expectedAnswer must include 1/2").toMatch(
      /\b1\s*\/\s*2\b|½|0\.5/,
    );
    // Must NOT collapse to a single closed interval (the factor-x trap)
    expect(
      finalLower,
      "P9p must NOT collapse to a single interval [-1/3, 1/2] (factor-x omitted)",
    ).not.toMatch(/^\s*\[\s*-?\s*1\s*\/\s*3\s*,\s*1\s*\/\s*2\s*\]\s*$/);
    // commonErrorTags must declare u3_signchart_critical_root_omitido so the
    // detector can fire on the "[-1/3, 1/2]" distractor.
    expect(p9p!.commonErrorTags, "P9p must declare u3_signchart_critical_root_omitido").toContain(
      "u3_signchart_critical_root_omitido",
    );
  });

  test("P9u (.7) EXCLUDES x=2 (denominator zero) from the correct option", () => {
    const p9u = findP9("ex.u3.inecuaciones_producto_cociente.7");
    expect(p9u).toBeDefined();
    const finalLower = p9u!.expectedAnswer.toLowerCase();
    // The canonical solution is [-1/2, 2): closed at -1/2, open at 2.
    expect(finalLower, "P9u expectedAnswer must include [-1/2").toMatch(/\[\s*-?\s*1\s*\/\s*2/);
    // Must be open at 2 (denominator zero excluded).
    expect(finalLower, "P9u expectedAnswer must be open at 2 (denominator exclusion)").toMatch(/,\s*2\s*\)/);
    // The options must include at least one distractor that includes x=2 closed.
    const values = (p9u!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
    const closed2 = values.find((v) => /,\s*2\s*\]/.test(v));
    expect(closed2, "P9u options must include a distractor that closes x=2 (domain violation)").toBeDefined();
    // commonErrorTags must declare u3_signchart_dominio_denominador
    expect(p9u!.commonErrorTags, "P9u must declare u3_signchart_dominio_denominador").toContain(
      "u3_signchart_dominio_denominador",
    );
  });
});

// ── 2. MC + difficulty discipline (no free-text, diff in 1-4) ────────────

describe("S5 — discipline: every P9 base exercise is MC and difficulty ≤ 4", () => {
  test("all 6 P9 entries are multiple-choice with diff in 1-4", () => {
    const entries = loadExercisesForSkill(SKILL);
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const e of entries) {
      expect(e.type, `${e.id} must be multiple-choice`).toBe("multiple-choice");
      expect(e.difficulty, `${e.id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e.difficulty, `${e.id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      expect(e.options, `${e.id} must carry options`).toBeDefined();
      expect(e.options!.length, `${e.id} needs ≥3 options`).toBeGreaterThanOrEqual(3);
    }
  });

  test("diff distribution matches spec: 2× diff 3 (P9w, P9q), 4× diff 4 (P9p, P9r, P9t, P9u)", () => {
    const entries = loadExercisesForSkill(SKILL);
    const diffCounts: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const e of entries) {
      if (e.difficulty in diffCounts) diffCounts[e.difficulty as 1 | 2 | 3 | 4]++;
    }
    expect(diffCounts[3], "diff 3 count (P9w, P9q)").toBeGreaterThanOrEqual(2);
    expect(diffCounts[4], "diff 4 count (P9p, P9r, P9t, P9u)").toBeGreaterThanOrEqual(4);
  });
});

// ── 3. Trace — every entry carries a resolvable ExerciseCanonicalTrace ────

describe("S5 — trace: every P9 base entry's canonicalTrace resolves to 03_ej_utn.pdf", () => {
  test.each(P9_ENTRIES)("%s carries a valid ExerciseCanonicalTrace", (id) => {
    const e = findP9(id);
    expect(e).toBeDefined();
    const traces = e!.canonicalTrace;
    expect(traces, `${id} must carry ≥1 canonicalTrace entry`).toBeDefined();
    expect(traces!.length).toBeGreaterThan(0);
    const t = traces![0];
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(t.path).toBe(P9_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });
});

// ── 4. Challenge — 1 diff-5 MC for the P9 skill ──────────────────────────

describe("S5 — challenge: 1 diff-5 MC challenge for mat.u3.inecuaciones_producto_cociente", () => {
  test("inecuaciones_producto_cociente.desafio-01 parses at diff 5 MC + canonical-source trace", () => {
    const raw = {
      id: "ex.u3.inecuaciones_producto_cociente.desafio-01",
      skillId: SKILL,
      type: "multiple-choice" as const,
      difficulty: 5 as const,
      prompt: "challenge prompt anchored in P9v full sign chart (x² - x)/((x + 1)(2 - x)) ≥ 0",
      options: ["a", "b", "c", "d"],
      expectedAnswer: "a",
      commonErrorTags: [
        "u3_signchart_factor_signo_incorrecto",
        "u3_signchart_critical_root_omitido",
        "u3_signchart_dominio_denominador",
      ],
      pedagogicalNote: "challenge note",
      challengeSection: true as const,
      category: "desafio" as const,
      tags: ["desafio", "integrador"] as const,
      canonicalTrace: [
        {
          path: P9_CANONICAL_PATH,
          section: "P9v: rational sign chart (x² - x)/((x + 1)(2 - x)) ≥ 0 — factor x preserved, two denominator exclusions",
          sourceUse: "canonical-source" as const,
          pedagogicalIntent: "Ancla el desafío diff-5 en P9v del PDF oficial: cuadro de signos completo con cuatro raíces críticas y dos exclusiones del dominio.",
        },
      ],
    };
    expect(() => validateChallengeEntry(raw)).not.toThrow();
    const parsed = validateChallengeEntry(raw);
    expect(parsed.id).toBe("ex.u3.inecuaciones_producto_cociente.desafio-01");
    expect(parsed.difficulty).toBe(5);
    expect(parsed.type).toBe("multiple-choice");
  });

  test("inecuaciones_producto_cociente gets exactly 1 new challenge at diff 5", () => {
    const list = loadChallengesForSkill(SKILL);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.inecuaciones_producto_cociente.desafio-01");
    expect(list[0].difficulty).toBe(5);
    expect(list[0].type).toBe("multiple-choice");
    expect(list[0].canonicalTrace[0].sourceUse).toBe("canonical-source");
    expect(validateTracePath(REPO_ROOT, list[0].canonicalTrace[0].path)).toBe(true);
  });

  test("unit 3 challenge count goes from 6 (S5) to 7 (S6)", () => {
    const u3Challenges = loadChallengesForUnit(3);
    expect(u3Challenges.length).toBe(7);
  });
});

// ── 5. Detector positive — u3_signchart_factor_signo_incorrecto ───────────

describe("S5 — detector positive: u3_signchart_factor_signo_incorrecto fires on wrong factor sign", () => {
  function makeFactorSignoExercise(): Exercise {
    return {
      id: "ex.u3.inecuaciones_producto_cociente.test-factor-signo",
      skillId: SKILL,
      type: "multiple-choice",
      difficulty: 4,
      prompt: "Resuelve (2x − 1)(x − 3) ≥ 0",
      expectedAnswer: "(-∞, 1/2] ∪ [3, +∞)",
      commonErrorTags: ["u3_signchart_factor_signo_incorrecto"],
      pedagogicalNote: "P9w-style: critical roots 1/2 and 3; sign chart + on (-∞, 1/2) and (3, +∞); solution (-∞, 1/2] ∪ [3, +∞). Distractor: invert the sign of (2x-1) on (-∞, 1/2) and pick (1/2, 3] instead.",
      unit: 3,
      options: [
        { value: "(-∞, 1/2] ∪ [3, +∞)", label: "A" },
        { value: "[1/2, 3]", label: "B" }, // wrong: flipped factor sign
        { value: "[1/2, 3]", label: "C" }, // wrong: forgot that ≥ closes both endpoints
        { value: "(1/2, 3)", label: "D" },
      ],
    };
  }

  test("fires when student picks the wrong factor-sign interval set on (2x−1)(x−3) ≥ 0", () => {
    const ex = makeFactorSignoExercise();
    expect(tagError(ex, "[1/2, 3]")).toBe("u3_signchart_factor_signo_incorrecto");
  });

  test("does NOT tag the correct (-∞, 1/2] ∪ [3, +∞) answer", () => {
    const ex = makeFactorSignoExercise();
    expect(tagError(ex, "(-∞, 1/2] ∪ [3, +∞)")).toBeUndefined();
  });
});

// ── 6. Detector positive — u3_signchart_critical_root_omitido ────────────

describe("S5 — detector positive: u3_signchart_critical_root_omitido fires on P9p factor-x trap", () => {
  test("fires when student collapses (x − 2x²)(x + ½) ≤ 0 to [-½, ½] (factor x omitted)", () => {
    const p9p = findP9("ex.u3.inecuaciones_producto_cociente.4");
    expect(p9p).toBeDefined();
    // The documented factor-x trap: simplify and lose the root at 0,
    // producing a single closed interval [-1/2, 1/2].
    expect(tagError(p9p!, "[-1/2, 1/2]")).toBe("u3_signchart_critical_root_omitido");
  });

  test("does NOT tag the correct two-interval solution [-½, 0] ∪ [½, +∞)", () => {
    const p9p = findP9("ex.u3.inecuaciones_producto_cociente.4");
    expect(p9p).toBeDefined();
    expect(tagError(p9p!, "[-1/2, 0] ∪ [1/2, +∞)")).toBeUndefined();
  });

  test("end-to-end: evaluateAnswer wires the tag + feedback for the P9p factor-x distractor", () => {
    const p9p = findP9("ex.u3.inecuaciones_producto_cociente.4");
    const result = evaluateAnswer(p9p!, "[-1/2, 1/2]");
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_signchart_critical_root_omitido");
    const fb = generateFeedback(result.correct, result.errorTag, loadFeedbackContent("unit-3"));
    expect(fb.message.length).toBeGreaterThan(0);
  });
});

// ── 7. Detector positive — u3_signchart_dominio_denominador ──────────────

describe("S5 — detector positive: u3_signchart_dominio_denominador fires on x=2 included", () => {
  test("fires when student includes x = 2 in the solution of (x + 3)/(2 − x) ≥ 1", () => {
    const p9u = findP9("ex.u3.inecuaciones_producto_cociente.7");
    expect(p9u).toBeDefined();
    // The documented denominator-zero trap: include x = 2 (which zeros 2 - x).
    expect(tagError(p9u!, "[-1/2, 2]")).toBe("u3_signchart_dominio_denominador");
  });

  test("does NOT tag the correct [-1/2, 2) answer (open at 2)", () => {
    const p9u = findP9("ex.u3.inecuaciones_producto_cociente.7");
    expect(p9u).toBeDefined();
    expect(tagError(p9u!, "[-1/2, 2)")).toBeUndefined();
  });
});

// ── 8. Detector negative — no bleed to unrelated skills or signatures ────

describe("S5 — detector negative: no bleed to unrelated skills or signatures", () => {
  test("u3_signchart_critical_root_omitido does NOT tag an unrelated quadratic-equation exercise", () => {
    // A P5-style quadratic `x² = 9` carries two roots but is not a sign-chart
    // inequality. The detector must NOT bleed onto it.
    const notP9: Exercise = {
      id: "ex.u3.inecuaciones_producto_cociente.test-not-bleed-quadratic",
      skillId: SKILL,
      type: "multiple-choice",
      difficulty: 3,
      prompt: "Resuelve x² = 9",
      expectedAnswer: "x = ±3",
      commonErrorTags: ["u3_signchart_critical_root_omitido"],
      pedagogicalNote: "Quadratic equation, not a sign-chart inequality",
      unit: 3,
      options: [
        { value: "x = ±3", label: "A" },
        { value: "x = 3", label: "B" },
      ],
    };
    expect(tagError(notP9, "x = 3")).toBeUndefined();
  });

  test("u3_signchart_dominio_denominador does NOT tag a rational expression without a sign-chart inequality", () => {
    // A domain-only fraction problem is NOT a sign-chart case.
    const notP9: Exercise = {
      id: "ex.u3.inecuaciones_producto_cociente.test-not-bleed-domain",
      skillId: SKILL,
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Hallar el dominio de f(x) = 1/(x − 3)",
      expectedAnswer: "x ≠ 3",
      commonErrorTags: ["u3_signchart_dominio_denominador"],
      pedagogicalNote: "Domain-only question, not a sign-chart inequality",
      unit: 3,
      options: [
        { value: "x ≠ 3", label: "A" },
        { value: "x = 3", label: "B" },
      ],
    };
    expect(tagError(notP9, "x = 3")).toBeUndefined();
  });

  test("u3_signchart_* detectors MUST NOT tag exercises on other skills", () => {
    const notP9: Exercise = {
      id: "ex.u3.inecuaciones_lineales.test-not-bleed-signchart",
      skillId: "mat.u3.inecuaciones_lineales",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve 2x + 5 ≥ 11",
      expectedAnswer: "x ≥ 3",
      commonErrorTags: [
        "u3_signchart_factor_signo_incorrecto",
        "u3_signchart_critical_root_omitido",
        "u3_signchart_dominio_denominador",
      ],
      pedagogicalNote: "Linear inequation, not a sign-chart case",
      unit: 3,
      options: [
        { value: "x ≥ 3", label: "A" },
        { value: "x ≤ 3", label: "B" },
      ],
    };
    expect(tagError(notP9, "x ≤ 3")).toBeUndefined();
  });

  test("all three u3_signchart_* tags are wired in the U3 taxonomy with feedback + lookupTag", () => {
    const taxonomy = loadTaxonomy();
    const ids = new Set(taxonomy.map((t) => t.id));
    expect(ids.has("u3_signchart_factor_signo_incorrecto")).toBe(true);
    expect(ids.has("u3_signchart_critical_root_omitido")).toBe(true);
    expect(ids.has("u3_signchart_dominio_denominador")).toBe(true);
    for (const tagId of [
      "u3_signchart_factor_signo_incorrecto",
      "u3_signchart_critical_root_omitido",
      "u3_signchart_dominio_denominador",
    ]) {
      expect(lookupTag(tagId)?.id).toBe(tagId);
      const t = taxonomy.find((x) => x.id === tagId);
      expect(t!.unit).toBe(3);
      expect(t!.description.trim().length).toBeGreaterThan(0);
      expect(t!.examples.length).toBeGreaterThan(0);
      const feedback = loadFeedbackContent("unit-3").find((f) => f.errorTag === tagId);
      expect(feedback, `${tagId} must have a feedback mapping`).toBeDefined();
      expect(feedback!.message.trim().length).toBeGreaterThan(0);
    }
  });
});

// ── 9. #82/#83 no-bleed across P9 entries ───────────────────────────────

describe("S5 — #82/#83 no-bleed: P9 entries must not reference companion anchors", () => {
  test("no P9 base exercise references a #82/#83 forbidden anchor", () => {
    const entries = loadExercisesForSkill(SKILL);
    expect(entries.length).toBeGreaterThan(0);
    const corpus = entries
      .map((e) => [e.prompt, e.expectedAnswer, e.pedagogicalNote].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `P9 entries must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });

  test("no P9 challenge references a #82/#83 forbidden anchor", () => {
    const challenges = loadChallengesForSkill(SKILL);
    expect(challenges.length).toBe(1);
    const corpus = challenges
      .map((c) =>
        [
          c.prompt,
          c.expectedAnswer,
          c.pedagogicalNote,
          ...c.canonicalTrace.map((t) => t.section + " " + t.pedagogicalIntent),
        ].join("\n"),
      )
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `P9 challenge must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });
});

// ── 10. Worked examples — S4's 3 preserved; S5 must not delete any ───────

describe("S5 — worked examples: mat.u3.inecuaciones_producto_cociente still has ≥3 examples", () => {
  test("3 examples total for the P9 skill (S4 P9p/q/w preserved)", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    expect(examples.length, `expected ≥3 worked examples for ${SKILL}, got ${examples.length}: ${examples.map((e) => e.id).join(", ")}`).toBeGreaterThanOrEqual(3);
  });

  test("S4 P9p worked example still preserves factor x", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    const p9p = examples.find(
      (e) => /2x\s*(?:\^?2|²)/.test(e.problem) && /x\s*\+\s*1\s*\/\s*2|x\s*\+\s*½/.test(e.problem),
    );
    expect(p9p, "P9p worked example must be preserved from S4").toBeDefined();
    // Include steps so the factor-x preservation shows up (it's in step 2:
    // "x(2x - 1)(x + 1/2) \geq 0").
    const corpus = (
      p9p!.problem +
      "\n" +
      p9p!.steps.map((s) => s.explanation).join("\n") +
      "\n" +
      p9p!.finalAnswer
    ).toLowerCase();
    expect(corpus, "P9p example must preserve factor x").toMatch(/x\s*\(\s*2\s*x\s*-\s*1\s*\)/);
    expect(p9p!.finalAnswer.toLowerCase(), "P9p finalAnswer must be [-½, 0] ∪ [½, +∞)").toMatch(
      /\[\s*-\s*1\s*\/\s*2\s*,\s*0\s*\]\s*∪\s*\[\s*1\s*\/\s*2\s*,\s*\+\s*(?:\\infty|∞)\s*\)/,
    );
  });
});

// ── 11. Readiness flips from theory-ready (S4) to practice-ready (S5) ──

describe("S5 — readiness: mat.u3.inecuaciones_producto_cociente flips to practice-ready", () => {
  test("getSkillComponents: all 5 components present (theory, examples, exercises, feedback, evaluation)", () => {
    const components = getSkillComponents(SKILL);
    expect(components).toHaveLength(5);
    const byName = Object.fromEntries(components.map((c) => [c.name, c.present]));
    expect(byName.theory, "theory present").toBe(true);
    expect(byName.examples, "examples present (≥3 from S4)").toBe(true);
    expect(byName.exercises, "exercises present (≥6 after S5)").toBe(true);
    expect(byName.feedback, "feedback vacuously true (all u3_signchart_* tags have mappings)").toBe(true);
    expect(byName.evaluation, "evaluation present").toBe(true);
  });

  test("isSkillReady is TRUE with no missing components", () => {
    const result = isSkillReady(SKILL);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("getSkillAvailability === 'practice-ready'", () => {
    expect(getSkillAvailability(SKILL)).toBe("practice-ready");
  });
});

// ── 12. Existing desafios preserved; only P9 adds 1 ─────────────────────

describe("S5 — existing desafios preserved; only inecuaciones_producto_cociente adds a new one", () => {
  test("traduccion desafios still at .desafio-01 (diff 5) and .desafio-02 (diff 4)", () => {
    const list = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    expect(list.length).toBe(2);
    expect(list.find((c) => c.id.endsWith(".desafio-01"))?.difficulty).toBe(5);
    expect(list.find((c) => c.id.endsWith(".desafio-02"))?.difficulty).toBe(4);
  });

  test("lineales still has exactly 1 desafio at diff 5", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_lineales.desafio-01");
    expect(list[0].difficulty).toBe(5);
  });

  test("cuadraticas still has exactly 1 desafio at diff 5", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_cuadraticas");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_cuadraticas.desafio-01");
    expect(list[0].difficulty).toBe(5);
  });

  test("ecuaciones_valor_absoluto still has exactly 1 desafio at diff 5", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_valor_absoluto");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_valor_absoluto.desafio-01");
    expect(list[0].difficulty).toBe(5);
  });
});