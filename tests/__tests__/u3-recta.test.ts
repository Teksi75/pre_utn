/**
 * S6 — Recta P12/P20 diff-4 base + P21 parameter-k diff-5 challenge +
 * scoped perpendicular-slope detector.
 *
 * Scope:
 *   - 4 NEW P12/P20 base MC exercises covering:
 *       .6 P20a diff-4 (parallel by point, `3x − 2y + 1 = 0` por P(2; 2))
 *       .7 P12d diff-4 (perpendicular by point, slope 1/4 por origen) — ANCHOR
 *       .8 P20b diff-4 (perpendicular by point, `2x − 3y + 5 = 0` por P(−1; 3))
 *       .9 P12g diff-4 (parallel by point, pasa por p(2; 3), paralela a r(0; 1) y q(2; 5))
 *   - 1 difficulty-5 MC challenge for `mat.u3.recta` anchored in P21
 *     (parameter-k line family `2kx − 5y + 2k + 3 = 0`, four conditions).
 *   - 1 OWN detector wired for `u3_recta_pendiente_perpendicular`,
 *     tightly scoped to the perpendicular-by-point signature:
 *     student uses the RECIPROCAL slope (m_perp = 1/m) instead of the
 *     NEGATIVE RECIPROCAL (m_perp = −1/m).
 *   - #82 (#82 owns P7/P10/P13-19/P31) and #83 (#83 owns P22/P23/P30)
 *     anchors MUST NOT appear in any new recta entry.
 *   - P12d reference slope is `1/4` (NOT `4/1`) — the spec-corrected value.
 *   - P21 challenge is structured MC chaining 4 conditions on the same
 *     parameter-k family.
 *   - Variable-substitution strategy: shifted constants on the perpendicular
 *     anchors to avoid cross-source math-fingerprint collisions with the
 *     existing theory practicePrompts (`pendiente m = 3` from (0,0) to (3,9);
 *     `pendiente 2, ordenada −1`) and the worked examples (y = −2x + 4 from
 *     example-recta-1; slope 2 from example-recta-2). The canonical P12d
 *     reference slope `1/4` is preserved because no worked example or
 *     theory practicePrompt matches it; the canonical P12d anchor is the
 *     spec-required diff-4 perpendicular-by-point.
 *
 * Test contract groups (mirrors S3 P8 and S5 P9 coverage shape):
 *   1. Exact math — every P12/P20 anchor carries the canonical equation.
 *   2. P12d (.7) perpendicular reference slope is `1/4` (NOT `4/1`).
 *   3. MC + difficulty discipline (no free-text, diff in 1-4 for base).
 *   4. Trace — every entry's canonicalTrace resolves to 03_ej_utn.pdf.
 *   5. Challenge — 1 diff-5 MC for the recta skill.
 *   6. Detector positive — u3_recta_pendiente_perpendicular fires on the
 *      reciprocal slope (no negative sign).
 *   7. Detector negative — does NOT bleed to parallel-by-point or to
 *      unrelated skills / signatures.
 *   8. #82/#83 no-bleed across base + desafio (corpus scan).
 *   9. Worked examples preserved (S6 must not delete the 2 existing).
 *  10. Detector wired in U3 taxonomy + feedback + lookupTag.
 *  11. Existing desafios preserved; only recta adds 1.
 */

import { describe, test, expect } from "vitest";
import { validateTracePath } from "@/lib/trace-path";
import {
  validateChallengeEntry,
  loadChallengesForSkill,
  loadChallengesForUnit,
} from "@/lib/challenges/loader";
import {
  loadExercisesForSkill,
  loadExampleContent,
  loadFeedbackContent,
} from "@/domain/catalog/content-loaders";
import { tagError } from "@/domain/evaluator/error-tagging";
import { loadTaxonomy, lookupTag } from "@/domain/error-taxonomy";
import { generateFeedback } from "@/domain/feedback";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { Exercise } from "@/domain/models/exercise";

const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const RECTA_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";
const SKILL = "mat.u3.recta";
const FORBIDDEN_TOKENS = [
  "P7", "P10", "P13", "P14", "P15", "P16", "P17", "P18", "P19",
  "P31", "P22", "P23", "P30",
];

const findRecta = (id: string): Exercise | undefined =>
  loadExercisesForSkill(SKILL).find((e) => e.id === id);

// P12/P20 anchors and their canonical expectedAnswer / prompt-signature.
// Each entry: [id, promptSignature, expectedAnswer].
// Unicode minus normalized to ASCII `-` for matching.
const RECTA_ENTRIES: ReadonlyArray<readonly [string, RegExp, RegExp]> = [
  // .6 P20a diff-4 (parallel by point): `3x − 2y + 1 = 0` por P(2; 2)
  // ⇒ slope 3/2 ⇒ y = (3/2)x − 1
  [
    "ex.u3.recta.6",
    /3\s*x\s*-\s*2\s*y\s*\+\s*1\s*=\s*0.*P\s*\(\s*2\s*;\s*2\s*\)|P\s*\(\s*2\s*;\s*2\s*\).*3\s*x\s*-\s*2\s*y\s*\+\s*1\s*=\s*0/,
    /y\s*=\s*\(?\s*3\s*\/\s*2\s*\)?\s*x\s*-\s*1|y\s*=\s*\(?\s*1\.5\s*\)?\s*x\s*-\s*1/,
  ],
  // .7 P12d diff-4 (perpendicular by point): perpendicular a `y = (1/4)x − 5`
  // por el origen — ANCHOR. Reference slope MUST be 1/4 (NOT 4/1).
  // Negative reciprocal of 1/4 is −4 ⇒ y = −4x.
  [
    "ex.u3.recta.7",
    /y\s*=\s*\(?\s*1\s*\/\s*4\s*\)?\s*x.*origen|origen.*y\s*=\s*\(?\s*1\s*\/\s*4\s*\)?\s*x/,
    /y\s*=\s*-\s*4\s*x|y\s*=\s*-4x/,
  ],
  // .8 P20b diff-4 (perpendicular by point): `2x − 3y + 5 = 0` por P(−1; 3)
  // ⇒ slope 2/3 ⇒ negative reciprocal −3/2 ⇒ y − 3 = −(3/2)(x − (−1)) ⇒
  // y = −(3/2)x + 3/2.
  [
    "ex.u3.recta.8",
    /2\s*x\s*-\s*3\s*y\s*\+\s*5\s*=\s*0.*P\s*\(\s*-?\s*1\s*;\s*3\s*\)|P\s*\(\s*-?\s*1\s*;\s*3\s*\).*2\s*x\s*-\s*3\s*y\s*\+\s*5\s*=\s*0/,
    /y\s*=\s*-\s*\(?\s*3\s*\/\s*2\s*\)?\s*x\s*\+\s*3\s*\/\s*2|y\s*=\s*-\s*1\.5\s*x\s*\+\s*1\.5/,
  ],
  // .9 P12g diff-4 (parallel by point): pasa por p(2; 3), paralela a la recta
  // que pasa por r(0; 1) y q(2; 5). Slope of r→q: (5−1)/(2−0) = 2.
  // Parallel through p(2; 3): y − 3 = 2(x − 2) ⇒ y = 2x − 1.
  [
    "ex.u3.recta.9",
    /p\s*\(\s*2\s*;\s*3\s*\).*paralela.*r\s*\(\s*0\s*;\s*1\s*\).*q\s*\(\s*2\s*;\s*5\s*\)|paralela.*r\s*\(\s*0\s*;\s*1\s*\).*q\s*\(\s*2\s*;\s*5\s*\).*p\s*\(\s*2\s*;\s*3\s*\)/,
    /y\s*=\s*2\s*x\s*-\s*1|y\s*=\s*2x\s*-\s*1/,
  ],
];

// ── 1. EXACT MATH — every P12/P20 anchor carries the canonical equation ──

describe("S6 — exact math: every P12/P20 base exercise carries the canonical equation", () => {
  test.each(RECTA_ENTRIES)(
    "%s loads with the canonical expectedAnswer and matching prompt signature",
    (id, promptPattern, expectedPattern) => {
      const e = findRecta(id);
      expect(e, `${id} must exist`).toBeDefined();
      expect(e!.type, `${id} must be multiple-choice`).toBe("multiple-choice");
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      const prompt = e!.prompt.replace(/−/g, "-");
      expect(prompt, `${id} prompt must carry the P12/P20 anchor`).toMatch(promptPattern);
      const expected = e!.expectedAnswer.replace(/−/g, "-");
      expect(expected, `${id} expectedAnswer must match canonical form`).toMatch(expectedPattern);
      // expectedAnswer must appear in the options list (MC contract).
      const values = (e!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
      expect(values, `${id} expectedAnswer must be in options`).toContain(e!.expectedAnswer);
    },
  );
});

// ── 2. P12d (.7) perpendicular reference slope is 1/4 (NOT 4/1) ──────────

describe("S6 — P12d anchor: reference perpendicular slope is 1/4 (NOT 4/1)", () => {
  test("P12d expectedAnswer uses NEGATIVE reciprocal (−4), NOT reciprocal (4)", () => {
    const p12d = findRecta("ex.u3.recta.7");
    expect(p12d, "P12d must exist").toBeDefined();
    const finalLower = p12d!.expectedAnswer.replace(/−/g, "-").toLowerCase();
    // The negative reciprocal of 1/4 is −4; the reciprocal (without negative
    // sign) is 4 — that is the documented trap.
    expect(finalLower, "P12d expectedAnswer MUST be y = -4x (negative reciprocal)").toMatch(
      /y\s*=\s*-\s*4\s*x|y\s*=\s*-4x/,
    );
    // options MUST include the reciprocal (positive 4) as a distractor so the
    // detector can fire on it.
    const values = (p12d!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
    expect(
      values.some((v) => /y\s*=\s*4\s*x|^4\s*x$/.test(v.replace(/−/g, "-").toLowerCase())),
      "P12d options MUST include a distractor with slope 4 (reciprocal, not negative reciprocal)",
    ).toBe(true);
    // commonErrorTags must declare u3_recta_pendiente_perpendicular so the
    // detector can fire on the positive-4 distractor.
    expect(
      p12d!.commonErrorTags,
      "P12d must declare u3_recta_pendiente_perpendicular",
    ).toContain("u3_recta_pendiente_perpendicular");
  });

  test("P12d prompt references slope 1/4 (NOT 4/1) — the spec-corrected value", () => {
    const p12d = findRecta("ex.u3.recta.7");
    expect(p12d).toBeDefined();
    const prompt = p12d!.prompt.replace(/−/g, "-");
    expect(prompt, "P12d prompt MUST reference (1/4)x").toMatch(/1\s*\/\s*4/);
    // Must NOT use the wrong reference slope 4.
    // Heuristic: a `(4)x` form adjacent to `x` would be the bug. We check
    // that there is no `(4)x` or `4·x` adjacent to the perpendicular signal.
    expect(
      prompt,
      "P12d prompt MUST NOT use the wrong reference slope (4/1)",
    ).not.toMatch(/perpendicular[^.]*4\s*[·\*x]/);
  });
});

// ── 3. MC + difficulty discipline (no free-text, diff in 1-4) ────────────

describe("S6 — discipline: every P12/P20 base exercise is MC and difficulty ≤ 4", () => {
  test("the 4 P12/P20 entries are multiple-choice with diff in 1-4", () => {
    for (const [id] of RECTA_ENTRIES) {
      const e = findRecta(id);
      expect(e, `${id} must exist`).toBeDefined();
      expect(e!.type, `${id} must be multiple-choice`).toBe("multiple-choice");
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      expect(e!.options, `${id} must carry options`).toBeDefined();
      expect(e!.options!.length, `${id} needs ≥3 options`).toBeGreaterThanOrEqual(3);
    }
  });

  test("diff distribution: all 4 P12/P20 base entries are diff 4", () => {
    for (const [id] of RECTA_ENTRIES) {
      const e = findRecta(id);
      expect(e!.difficulty, `${id} difficulty must be 4`).toBe(4);
    }
  });

  test("pre-S6 base entries (.1-.5) are unchanged in shape", () => {
    // Regression guard: S6 must not delete or reshape pre-S6 base entries.
    const allIds = loadExercisesForSkill(SKILL).map((e) => e.id);
    for (const id of [
      "ex.u3.recta.1",
      "ex.u3.recta.2",
      "ex.u3.recta.3",
      "ex.u3.recta.4",
      "ex.u3.recta.5",
    ]) {
      expect(allIds, `pre-S6 ${id} must remain visible`).toContain(id);
    }
  });
});

// ── 4. Trace — every entry's canonicalTrace resolves to 03_ej_utn.pdf ────

describe("S6 — trace: every P12/P20 base entry's canonicalTrace resolves to 03_ej_utn.pdf", () => {
  test.each(RECTA_ENTRIES)("%s carries a valid ExerciseCanonicalTrace", (id) => {
    const e = findRecta(id);
    expect(e).toBeDefined();
    const traces = e!.canonicalTrace;
    expect(traces, `${id} must carry ≥1 canonicalTrace entry`).toBeDefined();
    expect(traces!.length).toBeGreaterThan(0);
    const t = traces![0];
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(t.path).toBe(RECTA_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });
});

// ── 5. Challenge — 1 diff-5 MC for the recta skill ───────────────────────

describe("S6 — challenge: 1 diff-5 MC challenge for mat.u3.recta (P21 parameter-k)", () => {
  test("recta.desafio-01 parses at diff 5 MC + canonical-source trace", () => {
    const raw = {
      id: "ex.u3.recta.desafio-01",
      skillId: SKILL,
      type: "multiple-choice" as const,
      difficulty: 5 as const,
      prompt:
        "challenge prompt anchored in P21 parameter-k family 2kx - 5y + 2k + 3 = 0 (k ≠ 0) — four conditions chained: I) pasa por P(3; -2), II) pendiente m = -1/2, III) ordenada al origen b = 3, IV) pasa por el origen.",
      options: ["a", "b", "c", "d"],
      expectedAnswer: "a",
      commonErrorTags: ["u3_recta_pendiente_perpendicular"],
      pedagogicalNote: "challenge note",
      challengeSection: true as const,
      category: "desafio" as const,
      tags: ["desafio", "integrador"] as const,
      canonicalTrace: [
        {
          path: RECTA_CANONICAL_PATH,
          section:
            "P21a-d: parámetro k en la familia 2kx − 5y + 2k + 3 = 0 — pendiente, ordenada y pertenencia por punto",
          sourceUse: "canonical-source" as const,
          pedagogicalIntent:
            "Ancla el desafío diff-5 en P21 del PDF oficial: cadena de cuatro determinaciones de k a partir de condiciones distintas sobre la misma familia paramétrica.",
        },
      ],
    };
    expect(() => validateChallengeEntry(raw)).not.toThrow();
    const parsed = validateChallengeEntry(raw);
    expect(parsed.id).toBe("ex.u3.recta.desafio-01");
    expect(parsed.difficulty).toBe(5);
    expect(parsed.type).toBe("multiple-choice");
  });

  test("recta gets exactly 1 new challenge at diff 5", () => {
    const list = loadChallengesForSkill(SKILL);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.recta.desafio-01");
    expect(list[0].difficulty).toBe(5);
    expect(list[0].type).toBe("multiple-choice");
    expect(list[0].canonicalTrace[0].sourceUse).toBe("canonical-source");
    expect(validateTracePath(REPO_ROOT, list[0].canonicalTrace[0].path)).toBe(true);
  });

  test("unit 3 challenge count goes from 6 (S5) to 7 (S6)", () => {
    const u3Challenges = loadChallengesForUnit(3);
    expect(u3Challenges.length).toBe(7);
  });

  test("P21 challenge expectedAnswer carries the four canonical k values", () => {
    const challenge = loadChallengesForSkill(SKILL)[0];
    expect(challenge).toBeDefined();
    const expected = challenge.expectedAnswer.replace(/−/g, "-");
    // P21a passes through P(3; -2): 2k·3 - 5·(-2) + 2k + 3 = 0 ⇒ 8k = -13 ⇒ k = -13/8.
    expect(expected, "P21a must carry k = -13/8").toMatch(/-\s*13\s*\/\s*8/);
    // P21b slope m = -1/2: 2k/5 = -1/2 ⇒ k = -5/4.
    expect(expected, "P21b must carry k = -5/4").toMatch(/-\s*5\s*\/\s*4/);
    // P21c ordenada al origen b = 3: (2k+3)/5 = 3 ⇒ k = 6.
    expect(expected, "P21c must carry k = 6").toMatch(/\b6\b/);
    // P21d passes through origin: 2k + 3 = 0 ⇒ k = -3/2.
    expect(expected, "P21d must carry k = -3/2").toMatch(/-\s*3\s*\/\s*2/);
  });
});

// ── 6. Detector positive — u3_recta_pendiente_perpendicular ──────────────

describe("S6 — detector positive: u3_recta_pendiente_perpendicular fires on reciprocal slope", () => {
  test("fires on P12d (.7) when student picks y = 4x (RECIPROCAL, not negative reciprocal)", () => {
    const p12d = findRecta("ex.u3.recta.7");
    expect(p12d).toBeDefined();
    // The documented perpendicular trap: student keeps the sign of the
    // reference slope (positive) but inverts the magnitude (1/m instead of
    // −1/m). For reference slope 1/4, that produces y = 4x.
    expect(tagError(p12d!, "y = 4x")).toBe("u3_recta_pendiente_perpendicular");
  });

  test("does NOT tag the correct y = -4x (NEGATIVE reciprocal) answer", () => {
    const p12d = findRecta("ex.u3.recta.7");
    expect(p12d).toBeDefined();
    expect(tagError(p12d!, "y = -4x")).toBeUndefined();
  });

  test("fires on P20b (.8) when student picks y = (3/2)x + 9/2 (reciprocal without negative)", () => {
    const p20b = findRecta("ex.u3.recta.8");
    expect(p20b).toBeDefined();
    // Reference slope 2/3; correct perpendicular slope is −3/2. The trap
    // drops the negative sign and produces y = (3/2)x + 9/2.
    expect(tagError(p20b!, "y = (3/2)x + 9/2")).toBe("u3_recta_pendiente_perpendicular");
  });

  test("does NOT tag the correct y = -(3/2)x + 3/2 answer", () => {
    const p20b = findRecta("ex.u3.recta.8");
    expect(p20b).toBeDefined();
    expect(tagError(p20b!, "y = -(3/2)x + 3/2")).toBeUndefined();
  });

  test("end-to-end: evaluateAnswer wires the tag + feedback for the P12d reciprocal distractor", () => {
    const p12d = findRecta("ex.u3.recta.7");
    const result = evaluateAnswer(p12d!, "y = 4x");
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_recta_pendiente_perpendicular");
    const fb = generateFeedback(result.correct, result.errorTag, loadFeedbackContent("unit-3"));
    expect(fb.message.length).toBeGreaterThan(0);
  });
});

// ── 7. Detector negative — no bleed to unrelated skills/signatures ───────

describe("S6 — detector negative: no bleed to unrelated skills or signatures", () => {
  test("does NOT tag a parallel-by-point recta exercise (no perpendicular signal)", () => {
    // P20a (.6) is a parallel-by-point problem — the prompt does NOT carry
    // a perpendicular signal, so the detector must NOT fire on reciprocal
    // picks (those are NOT the documented trap on parallel problems).
    const p20a = findRecta("ex.u3.recta.6");
    expect(p20a).toBeDefined();
    expect(tagError(p20a!, "y = -(3/2)x + 5")).toBeUndefined();
  });

  test("does NOT tag a slope-intercept recta exercise (no parallel/perpendicular signal)", () => {
    // pre-S6 .5 — pendiente −2, ordenada 4. No parallel/perpendicular.
    const r5 = findRecta("ex.u3.recta.5");
    expect(r5).toBeDefined();
    expect(tagError(r5!, "y = 2x + 4")).toBeUndefined();
  });

  test("does NOT tag exercises on other U3 skills (no-bleed across skills)", () => {
    const notRecta: Exercise = {
      id: "ex.u3.inecuaciones_lineales.test-not-bleed-recta",
      skillId: "mat.u3.inecuaciones_lineales",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve 2x + 5 ≥ 11",
      expectedAnswer: "x ≥ 3",
      commonErrorTags: ["u3_recta_pendiente_perpendicular"],
      pedagogicalNote: "Linear inequation, not a recta perpendicular",
      unit: 3,
      options: [
        { value: "x ≥ 3", label: "A" },
        { value: "x ≤ 3", label: "B" },
      ],
    };
    expect(tagError(notRecta, "x ≤ 3")).toBeUndefined();
  });

  test("does NOT fire when the prompt mentions 'perpendicular' but the student's slope IS the negative reciprocal (correct answer)", () => {
    // Sanity: the detector must NOT tag the correct answer even if the
    // student's written form happens to look like a reciprocal candidate.
    // For P12d, y = -4x is the correct negative reciprocal — must NOT tag.
    const p12d = findRecta("ex.u3.recta.7");
    expect(p12d).toBeDefined();
    expect(tagError(p12d!, "y = -4x")).toBeUndefined();
  });
});

// ── 8. #82/#83 no-bleed across P12/P20 entries ───────────────────────────

describe("S6 — #82/#83 no-bleed: P12/P20 entries must not reference companion anchors", () => {
  test("no P12/P20 base exercise references a #82/#83 forbidden anchor", () => {
    const entries = RECTA_ENTRIES.map(([id]) => findRecta(id)).filter(
      (e): e is Exercise => e !== undefined,
    );
    expect(entries.length).toBeGreaterThan(0);
    const corpus = entries
      .map((e) => [e.prompt, e.expectedAnswer, e.pedagogicalNote].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `recta entries must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });

  test("no recta challenge references a #82/#83 forbidden anchor", () => {
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
      expect(corpus, `recta challenge must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });
});

// ── 9. Worked examples — S6 must not delete the 2 existing recta examples ─

describe("S6 — worked examples: mat.u3.recta still has ≥2 examples", () => {
  test("2 examples total for the recta skill (pre-S6 example-recta-1 + example-recta-2 preserved)", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    expect(
      examples.length,
      `expected ≥2 worked examples for ${SKILL}, got ${examples.length}: ${examples.map((e) => e.id).join(", ")}`,
    ).toBeGreaterThanOrEqual(2);
  });

  test("example-recta-1 (pendiente-ordenada for y = −2x + 4) preserved", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    const ex1 = examples.find((e) => e.id === "example-recta-1");
    expect(ex1, "example-recta-1 must be preserved").toBeDefined();
    expect(ex1!.finalAnswer).toMatch(/-2.*4|4.*-2/);
  });
});

// ── 10. Detector wired in U3 taxonomy + feedback + lookupTag ────────────

describe("S6 — u3_recta_pendiente_perpendicular is wired in taxonomy + feedback + lookupTag", () => {
  test("u3_recta_pendiente_perpendicular exists in taxonomy with unit 3 + non-empty description + examples", () => {
    const taxonomy = loadTaxonomy();
    const t = taxonomy.find((x) => x.id === "u3_recta_pendiente_perpendicular");
    expect(t, "u3_recta_pendiente_perpendicular must exist in taxonomy").toBeDefined();
    expect(t!.unit).toBe(3);
    expect(t!.description.trim().length).toBeGreaterThan(0);
    expect(t!.examples.length).toBeGreaterThan(0);
    expect(lookupTag("u3_recta_pendiente_perpendicular")?.id).toBe(
      "u3_recta_pendiente_perpendicular",
    );
  });

  test("u3_recta_pendiente_perpendicular has a feedback mapping for unit-3", () => {
    const feedback = loadFeedbackContent("unit-3").find(
      (f) => f.errorTag === "u3_recta_pendiente_perpendicular",
    );
    expect(
      feedback,
      "u3_recta_pendiente_perpendicular must have a feedback mapping",
    ).toBeDefined();
    expect(feedback!.message.trim().length).toBeGreaterThan(0);
  });
});

// ── 11. Existing desafios preserved; only recta adds 1 ──────────────────

describe("S6 — existing desafios preserved; only recta adds a new one", () => {
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

  test("inecuaciones_producto_cociente still has exactly 1 desafio at diff 5", () => {
    const list = loadChallengesForSkill("mat.u3.inecuaciones_producto_cociente");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.inecuaciones_producto_cociente.desafio-01");
    expect(list[0].difficulty).toBe(5);
  });
});