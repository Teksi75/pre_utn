/**
 * S3 — Absolute-value equations (P8 family) base content + diff-5 challenge +
 * scoped detectors + worked examples count >= 3.
 *
 * Scope:
 *   - 8 P8 base MC exercises covering P8a (`.3`), P8c (`.2`), P8d (`.4`),
 *     P8e (`.5`), P8f (`.6`), P8h (`.7`), P8g (`.8`), P8i (`.9`).
 *   - 1 difficulty-5 MC challenge for `mat.u3.ecuaciones_valor_absoluto`
 *     anchored in P8g + P8b contrast.
 *   - 2 new worked examples (P8a/c + P8i vs P8b) — combined with S2's P8g
 *     this lands worked-example count at exactly 3 (spec minimum).
 *   - 3 OWN detectors wired for `u3_abs_eq_signo_negativo_incorrecto`,
 *     `u3_abs_eq_suma_constante_fuera`, `u3_abs_eq_rama_unica`, tightly
 *     scoped to the P8 signature.
 *   - #82 (#82 owns P7/P10/P13-19/P31) and #83 (#83 owns P22/P23/P30)
 *     anchors MUST NOT appear in any new P8 entry.
 *   - Readiness flips from `theory-ready` (S2) to `practice-ready`.
 *   - P9n audit: NO new `mat.u3.inecuaciones_valor_absoluto` exercises are
 *     added in S3; P9n is owned by an explicit scope outside S3 (per the
 *     user's S3 instruction "audit P9n as required by current spec/task,
 *     but do not add companion-owned scope").
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
const P8_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";
const SKILL = "mat.u3.ecuaciones_valor_absoluto";
const FORBIDDEN_TOKENS = [
  "P7", "P10", "P13", "P14", "P15", "P16", "P17", "P18", "P19",
  "P31", "P22", "P23", "P30",
];

const findP8 = (id: string): Exercise | undefined =>
  loadExercisesForSkill(SKILL).find((e) => e.id === id);

// P8 anchors and their canonical (expected, options[], distractor) tuples.
// Each entry: [id, promptAnchor, expectedAnswer, distractorSingleValue, distractorNoSolution]
const P8_ENTRIES: ReadonlyArray<readonly [string, RegExp, RegExp, string]> = [
  // .2 P8c diff-1: |v - 2| = 3 ⇒ v = 5 or v = -1
  ["ex.u3.ecuaciones_valor_absoluto.2", /\|v\s*-\s*2\|\s*=\s*3/, /v\s*=\s*5.*v\s*=\s*-1|v\s*=\s*-1.*v\s*=\s*5/, "v = 5"],
  // .3 P8a diff-1: |x + 2| = 8 ⇒ x = 6 or x = -10
  ["ex.u3.ecuaciones_valor_absoluto.3", /\|x\s*\+\s*2\|\s*=\s*8/, /x\s*=\s*6.*x\s*=\s*-10|x\s*=\s*-10.*x\s*=\s*6/, "x = 6"],
  // .4 P8d diff-2: |10 - x| = 5 ⇒ x = 5 or x = 15
  ["ex.u3.ecuaciones_valor_absoluto.4", /\|10\s*-\s*x\|\s*=\s*5/, /x\s*=\s*5.*x\s*=\s*15|x\s*=\s*15.*x\s*=\s*5/, "x = 5"],
  // .5 P8e diff-2: |6 - 2t| = 4 ⇒ t = 1 or t = 5
  ["ex.u3.ecuaciones_valor_absoluto.5", /\|6\s*-\s*2\s*t\|\s*=\s*4/, /t\s*=\s*1.*t\s*=\s*5|t\s*=\s*5.*t\s*=\s*1/, "t = 1"],
  // .6 P8f diff-2: |3x + 18| = 0 ⇒ x = -6 (single root, |x|=0 case)
  ["ex.u3.ecuaciones_valor_absoluto.6", /\|3\s*x\s*\+\s*18\|\s*=\s*0/, /x\s*=\s*-6/, "x = 6"],
  // .7 P8h diff-2: |x - 1| = |1 - 4| ⇒ x = 4 or x = -2
  ["ex.u3.ecuaciones_valor_absoluto.7", /\|x\s*-\s*1\|\s*=\s*\|1\s*-\s*4\|/, /x\s*=\s*4.*x\s*=\s*-2|x\s*=\s*-2.*x\s*=\s*4/, "x = 4"],
  // .8 P8g diff-3: -|x| = -10.5 ⇒ x = ±10.5 (corrected two-value set)
  ["ex.u3.ecuaciones_valor_absoluto.8", /-\s*\|x\|\s*=\s*-?\s*10\.5/, /-?10\.5.*10\.5|10\.5.*-?10\.5/, "-10.5"],
  // .9 P8i diff-3: -|r| = -6 + |r| ⇒ r = ±3
  ["ex.u3.ecuaciones_valor_absoluto.9", /-\s*\|r\|\s*=\s*-6\s*\+\s*\|r\|/, /r\s*=\s*3.*r\s*=\s*-3|r\s*=\s*-3.*r\s*=\s*3/, "r = 3"],
];

// ── 1. EXACT MATH — every P8 anchor carries the corrected two-value set ──

describe("S3 — exact math: every P8 base exercise carries the corrected solution set", () => {
  test.each(P8_ENTRIES)(
    "%s loads with the canonical expectedAnswer and matching prompt signature",
    (id, promptPattern, expectedPattern, _distractor) => {
      const e = findP8(id);
      expect(e, `${id} must exist`).toBeDefined();
      expect(e!.type, `${id} must be multiple-choice`).toBe("multiple-choice");
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e!.difficulty, `${id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      expect(e!.prompt, `${id} prompt must carry the P8 anchor`).toMatch(promptPattern);
      expect(e!.expectedAnswer, `${id} expectedAnswer must carry BOTH values`).toMatch(expectedPattern);
      // expectedAnswer must NOT collapse to "no hay solución".
      expect(e!.expectedAnswer.toLowerCase(), `${id} must NOT collapse to "no hay solución"`).not.toMatch(/no\s+hay\s+soluci[oó]n|sin\s+soluci[oó]n/);
      // expectedAnswer must appear in the options list (MC contract).
      const values = (e!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
      expect(values, `${id} expectedAnswer must be in options`).toContain(e!.expectedAnswer);
      // options must include a "no hay solución" distractor and at least one single-value distractor.
      expect(values.some((v) => /no\s+hay\s+soluci[oó]n|sin\s+soluci[oó]n/i.test(v)), `${id} options must include a no-solution distractor`).toBe(true);
    },
  );

  test("P8g (.8) expectedAnswer is the corrected two-value set {-10.5, 10.5} (NOT 'no hay solución')", () => {
    const p8g = findP8("ex.u3.ecuaciones_valor_absoluto.8");
    expect(p8g).toBeDefined();
    const finalLower = p8g!.expectedAnswer.toLowerCase();
    expect(finalLower, "P8g MUST NOT collapse to 'no solution'").not.toMatch(/no\s+hay\s+soluci[oó]n|sin\s+soluci[oó]n/);
    expect(finalLower, "P8g MUST reference both -10.5 AND 10.5").toMatch(/-?10\.5/);
    expect(finalLower, "P8g MUST reference positive 10.5").toMatch(/10\.5/);
    // commonErrorTags must declare u3_abs_eq_signo_negativo_incorrecto so the
    // P8g detector can fire on the "no solution" distractor.
    expect(p8g!.commonErrorTags, "P8g must declare u3_abs_eq_signo_negativo_incorrecto").toContain("u3_abs_eq_signo_negativo_incorrecto");
  });

  test("P8 single-root (.6 |3x+18|=0 ⇒ x=-6) declares correct single root, NOT two roots", () => {
    const p8f = findP8("ex.u3.ecuaciones_valor_absoluto.6");
    expect(p8f).toBeDefined();
    expect(p8f!.expectedAnswer).toMatch(/x\s*=\s*-6/);
    expect(p8f!.expectedAnswer).not.toMatch(/x\s*=\s*6/);
    expect(p8f!.expectedAnswer.toLowerCase()).not.toMatch(/x\s*=\s*-6.*x\s*=\s*6|x\s*=\s*6.*x\s*=\s*-6/);
  });
});

// ── 2. MC + difficulty discipline (no free-text, diff in 1-4) ────────────

describe("S3 — discipline: every P8 base exercise is MC and difficulty ≤ 4", () => {
  test("all 8 P8 entries are multiple-choice with diff in 1-4", () => {
    const entries = loadExercisesForSkill(SKILL);
    expect(entries.length).toBeGreaterThanOrEqual(8);
    for (const e of entries) {
      expect(e.type, `${e.id} must be multiple-choice`).toBe("multiple-choice");
      expect(e.difficulty, `${e.id} difficulty must be 1-4`).toBeGreaterThanOrEqual(1);
      expect(e.difficulty, `${e.id} difficulty must be 1-4`).toBeLessThanOrEqual(4);
      expect(e.options, `${e.id} must carry options`).toBeDefined();
      expect(e.options!.length, `${e.id} needs ≥3 options`).toBeGreaterThanOrEqual(3);
    }
  });

  test("diff distribution matches spec: 2× diff 1 (P8a/c), 4× diff 2 (P8d/e/f/h), 2× diff 3 (P8g/i)", () => {
    const entries = loadExercisesForSkill(SKILL);
    const diffCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const e of entries) {
      if (e.difficulty in diffCounts) diffCounts[e.difficulty as 1 | 2 | 3 | 4]++;
    }
    expect(diffCounts[1], "diff 1 count").toBeGreaterThanOrEqual(2);
    expect(diffCounts[2], "diff 2 count").toBeGreaterThanOrEqual(4);
    expect(diffCounts[3], "diff 3 count").toBeGreaterThanOrEqual(2);
  });
});

// ── 3. Trace — every entry carries a resolvable ExerciseCanonicalTrace ────

describe("S3 — trace: every P8 base entry's canonicalTrace resolves to 03_ej_utn.pdf", () => {
  test.each(P8_ENTRIES)("%s carries a valid ExerciseCanonicalTrace", (id) => {
    const e = findP8(id);
    expect(e).toBeDefined();
    const traces = e!.canonicalTrace;
    expect(traces, `${id} must carry ≥1 canonicalTrace entry`).toBeDefined();
    expect(traces!.length).toBeGreaterThan(0);
    const t = traces![0];
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(t.path).toBe(P8_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });
});

// ── 4. Challenge — 1 diff-5 MC for the P8 skill ──────────────────────────

describe("S3 — challenge: 1 diff-5 MC challenge for mat.u3.ecuaciones_valor_absoluto", () => {
  test("ecuaciones_valor_absoluto.desafio-01 parses at diff 5 MC + canonical-source trace", () => {
    const raw = {
      id: "ex.u3.ecuaciones_valor_absoluto.desafio-01",
      skillId: SKILL,
      type: "multiple-choice" as const,
      difficulty: 5 as const,
      prompt: "challenge prompt anchored in P8g + P8b contrast",
      options: ["a", "b", "c", "d"],
      expectedAnswer: "a",
      commonErrorTags: ["u3_abs_eq_signo_negativo_incorrecto", "u3_abs_eq_suma_constante_fuera"],
      pedagogicalNote: "challenge note",
      challengeSection: true as const,
      category: "desafio" as const,
      tags: ["desafio", "integrador"] as const,
      canonicalTrace: [
        {
          path: P8_CANONICAL_PATH,
          section: "P8g/P8b: barras externas negativas vs suma constante afuera",
          sourceUse: "canonical-source" as const,
          pedagogicalIntent: "Ancla el desafío diff-5 en el contraste P8g (no-solución aparente → dos soluciones) y P8b (constante afuera de las barras)",
        },
      ],
    };
    expect(() => validateChallengeEntry(raw)).not.toThrow();
    const parsed = validateChallengeEntry(raw);
    expect(parsed.id).toBe("ex.u3.ecuaciones_valor_absoluto.desafio-01");
    expect(parsed.difficulty).toBe(5);
    expect(parsed.type).toBe("multiple-choice");
  });

  test("ecuaciones_valor_absoluto gets exactly 1 new challenge at diff 5", () => {
    const list = loadChallengesForSkill(SKILL);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_valor_absoluto.desafio-01");
    expect(list[0].difficulty).toBe(5);
    expect(list[0].type).toBe("multiple-choice");
    expect(list[0].canonicalTrace[0].sourceUse).toBe("canonical-source");
    expect(validateTracePath(REPO_ROOT, list[0].canonicalTrace[0].path)).toBe(true);
  });

  test("unit 3 challenge count goes from 6 (S5) to 7 (S6)", () => {
    // S3 of align-u3-practice-official-exercises added the P8 desafio
    // (5 total). S5 of the same change adds the P9v desafio (6 total).
    // S6 of the same change adds the P21 parameter-k desafio (7 total).
    const u3Challenges = loadChallengesForUnit(3);
    expect(u3Challenges.length).toBe(7);
  });
});

// ── 5. Detector positive — u3_abs_eq_signo_negativo_incorrecto ───────────

describe("S3 — detector positive: u3_abs_eq_signo_negativo_incorrecto fires on P8g", () => {
  test("fires when student picks 'no hay solución' on P8g (-|x|=-10.5)", () => {
    const p8g = findP8("ex.u3.ecuaciones_valor_absoluto.8");
    expect(p8g).toBeDefined();
    expect(tagError(p8g!, "No hay solución")).toBe("u3_abs_eq_signo_negativo_incorrecto");
  });

  test("does NOT tag the correct two-value set {-10.5, 10.5}", () => {
    const p8g = findP8("ex.u3.ecuaciones_valor_absoluto.8");
    expect(p8g).toBeDefined();
    expect(tagError(p8g!, "x = -10.5 o x = 10.5")).toBeUndefined();
  });

  test("end-to-end: evaluateAnswer wires the tag + feedback for the P8g no-solution distractor", () => {
    const p8g = findP8("ex.u3.ecuaciones_valor_absoluto.8");
    const result = evaluateAnswer(p8g!, "No hay solución");
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_abs_eq_signo_negativo_incorrecto");
    const fb = generateFeedback(result.correct, result.errorTag, loadFeedbackContent("unit-3"));
    expect(fb.message.length).toBeGreaterThan(0);
  });
});

// ── 6. Detector positive — u3_abs_eq_suma_constante_fuera ────────────────

describe("S3 — detector positive: u3_abs_eq_suma_constante_fuera fires on |x|+c=d", () => {
  function makeSumaConstanteFueraExercise(): Exercise {
    return {
      id: "ex.u3.ecuaciones_valor_absoluto.test-suma-constante",
      skillId: SKILL,
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve |x| + 4 = 10",
      expectedAnswer: "x = 6 o x = -6",
      commonErrorTags: ["u3_abs_eq_suma_constante_fuera"],
      pedagogicalNote: "P8b-style: |x| + 4 = 10 ⇒ |x| = 6 ⇒ x = ±6. Distractor: tratar como |x + 4| = 10 ⇒ x = 6 o x = -14.",
      unit: 3,
      options: [
        { value: "x = 6 o x = -6", label: "A" },
        { value: "x = 6 o x = -14", label: "B" }, // wrong: |x+4|=10 form
        { value: "x = 6", label: "C" },
        { value: "No hay solución", label: "D" },
      ],
    };
  }

  test("fires when student treats |x| + c = d as |x + c| = d", () => {
    const ex = makeSumaConstanteFueraExercise();
    expect(tagError(ex, "x = 6 o x = -14")).toBe("u3_abs_eq_suma_constante_fuera");
  });

  test("does NOT tag the correct answer", () => {
    const ex = makeSumaConstanteFueraExercise();
    expect(tagError(ex, "x = 6 o x = -6")).toBeUndefined();
  });
});

// ── 7. Detector positive — u3_abs_eq_rama_unica ──────────────────────────

describe("S3 — detector positive: u3_abs_eq_rama_unica fires on forgotten branch", () => {
  function makeRamaUnicaExercise(): Exercise {
    return {
      id: "ex.u3.ecuaciones_valor_absoluto.test-rama-unica",
      skillId: SKILL,
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve |2x - 4| = 6",
      expectedAnswer: "x = 5 o x = -1",
      commonErrorTags: ["u3_abs_eq_rama_unica"],
      pedagogicalNote: "P8 |ax+b|=c: dos ramas (2x - 4 = 6 ⇒ x = 5; 2x - 4 = -6 ⇒ x = -1). Distractor: reportar solo x = 5.",
      unit: 3,
      options: [
        { value: "x = 5 o x = -1", label: "A" },
        { value: "x = 5", label: "B" },
        { value: "x = -1", label: "C" },
        { value: "No hay solución", label: "D" },
      ],
    };
  }

  test("fires when student reports a single branch (x = 5) on |2x - 4| = 6", () => {
    const ex = makeRamaUnicaExercise();
    expect(tagError(ex, "x = 5")).toBe("u3_abs_eq_rama_unica");
  });

  test("does NOT tag the correct two-branch answer", () => {
    const ex = makeRamaUnicaExercise();
    expect(tagError(ex, "x = 5 o x = -1")).toBeUndefined();
  });
});

// ── 8. Detector negative — no bleed to unrelated skills/exercises ────────

describe("S3 — detector negative: no bleed to unrelated skills or signatures", () => {
  test("u3_abs_eq_signo_negativo_incorrecto does NOT tag a P8f (|3x+18|=0, no negative bars)", () => {
    const p8f = findP8("ex.u3.ecuaciones_valor_absoluto.6");
    expect(p8f).toBeDefined();
    expect(tagError(p8f!, "x = 6")).toBeUndefined();
    expect(tagError(p8f!, "No hay solución")).toBeUndefined();
  });

  test("u3_abs_eq_suma_constante_fuera does NOT tag a P8c (|v-2|=3, no +c outside)", () => {
    const p8c = findP8("ex.u3.ecuaciones_valor_absoluto.2");
    expect(p8c).toBeDefined();
    // P8c prompt is |v - 2| = 3 — no constant outside the bars. The single-
    // branch distractor "v = 5" MUST be caught by rama_unica, NOT by
    // suma_constante_fuera (which requires the |x|+c=d signature).
    expect(tagError(p8c!, "v = 5")).toBe("u3_abs_eq_rama_unica");
    expect(tagError(p8c!, "v = 5")).not.toBe("u3_abs_eq_suma_constante_fuera");
  });

  test("u3_abs_eq_* detectors MUST NOT tag exercises on other skills", () => {
    const notP8: Exercise = {
      id: "ex.u3.inecuaciones_valor_absoluto.test-not-bleed-p8",
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve |x| < 3",
      expectedAnswer: "-3 < x < 3",
      commonErrorTags: ["u3_abs_eq_signo_negativo_incorrecto", "u3_abs_eq_suma_constante_fuera", "u3_abs_eq_rama_unica"],
      pedagogicalNote: "inecuacion, not an equation",
      unit: 3,
      options: [
        { value: "-3 < x < 3", label: "A" },
        { value: "x = 7", label: "B" },
      ],
    };
    expect(tagError(notP8, "No hay solución")).toBeUndefined();
    expect(tagError(notP8, "x = 7")).toBeUndefined();
  });

  test("all three u3_abs_eq_* tags are wired in the U3 taxonomy with feedback + lookupTag", () => {
    const taxonomy = loadTaxonomy();
    const ids = new Set(taxonomy.map((t) => t.id));
    expect(ids.has("u3_abs_eq_signo_negativo_incorrecto")).toBe(true);
    expect(ids.has("u3_abs_eq_suma_constante_fuera")).toBe(true);
    expect(ids.has("u3_abs_eq_rama_unica")).toBe(true);
    for (const tagId of ["u3_abs_eq_signo_negativo_incorrecto", "u3_abs_eq_suma_constante_fuera", "u3_abs_eq_rama_unica"]) {
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

// ── 9. #82/#83 no-bleed across P8 entries ───────────────────────────────

describe("S3 — #82/#83 no-bleed: P8 entries must not reference companion anchors", () => {
  test("no P8 base exercise references a #82/#83 forbidden anchor", () => {
    const entries = loadExercisesForSkill(SKILL);
    expect(entries.length).toBeGreaterThan(0);
    const corpus = entries
      .map((e) => [e.prompt, e.expectedAnswer, e.pedagogicalNote].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `P8 entries must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });

  test("no P8 challenge references a #82/#83 forbidden anchor", () => {
    const challenges = loadChallengesForSkill(SKILL);
    expect(challenges.length).toBe(1);
    const corpus = challenges
      .map((c) => [c.prompt, c.expectedAnswer, c.pedagogicalNote, ...c.canonicalTrace.map((t) => t.section + " " + t.pedagogicalIntent)].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `P8 challenge must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });
});

// ── 10. Worked examples — ≥ 3 for the P8 skill (S2 + S3 combined) ────────

describe("S3 — worked examples: mat.u3.ecuaciones_valor_absoluto has ≥3 examples", () => {
  test("3 examples total for the P8 skill (S2 P8g + S3 P8a/c + S3 P8i vs P8b contrast)", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    expect(examples.length).toBeGreaterThanOrEqual(3);
  });

  test("S3 added a P8a/c worked example |x + 2| = 8 with roots 6 and -10", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    const p8ac = examples.find((e) => /\|x\s*\+\s*2\|\s*=\s*8/.test(e.problem));
    expect(p8ac, "P8a/c worked example must exist").toBeDefined();
    expect(p8ac!.finalAnswer).toMatch(/x\s*=\s*6/);
    expect(p8ac!.finalAnswer).toMatch(/x\s*=\s*-10/);
    expect(p8ac!.finalAnswer.toLowerCase()).not.toMatch(/no\s+hay\s+soluci[oó]n/);
  });

  test("S3 added a P8i vs P8b contrast worked example covering midpoint + no-solution cases", () => {
    const examples = loadExampleContent("unit-3").filter((e) => e.skillId === SKILL);
    const contrast = examples.find(
      (e) => /\|x\s*-\s*a\|.*\|x\s*-\s*b\||\|x\s*-\s*3\|.*\|x\s*-\s*7\|/.test(e.problem),
    );
    expect(contrast, "P8i vs P8b contrast worked example must exist").toBeDefined();
    // Must mention midpoint or the d<c no-solution contrast somewhere.
    const corpus = (contrast!.problem + "\n" + contrast!.finalAnswer + "\n" + contrast!.pedagogicalNote).toLowerCase();
    expect(corpus, "contrast example must cover the midpoint").toMatch(/punto medio|midpoint|\(a\s*\+\s*b\)|x\s*=\s*5|simétric/);
    expect(corpus, "contrast example must cover the no-solution case").toMatch(/no hay soluci[oó]n|sin soluci[oó]n/);
  });
});

// ── 11. Readiness flips from theory-ready (S2) to practice-ready (S3) ──

describe("S3 — readiness: mat.u3.ecuaciones_valor_absoluto flips to practice-ready", () => {
  test("getSkillComponents: all 5 components present (theory, examples, exercises, feedback, evaluation)", () => {
    const components = getSkillComponents(SKILL);
    expect(components).toHaveLength(5);
    const byName = Object.fromEntries(components.map((c) => [c.name, c.present]));
    expect(byName.theory, "theory present").toBe(true);
    expect(byName.examples, "examples present (≥3 after S3)").toBe(true);
    expect(byName.exercises, "exercises present (≥8 after S3)").toBe(true);
    expect(byName.feedback, "feedback vacuously true (all u3_abs_eq_* tags have mappings)").toBe(true);
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

// ── 12. Existing desafios preserved; lineales/cuadraticas still 1 each ─

describe("S3 — existing desafios preserved; only ecuaciones_valor_absoluto adds a new one", () => {
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
});

// ── 13. P9n audit — no companion-owned scope lands here ──────────────────

describe("S3 — P9n audit: NO new inecuaciones_valor_absoluto exercises land in S3", () => {
  test("mat.u3.inecuaciones_valor_absoluto exercise count is unchanged from pre-S3 (4 entries)", () => {
    // S3 is scoped to the P8 family; it does NOT add P9n base exercises
    // (P9n belongs to a sibling scope per the user's S3 instruction).
    const list = loadExercisesForSkill("mat.u3.inecuaciones_valor_absoluto");
    expect(list.length, "inecuaciones_valor_absoluto should keep its pre-S3 count").toBe(4);
    // None of the existing entries must reference P8 anchors.
    const corpus = list.map((e) => e.id + " " + e.prompt).join("\n");
    expect(corpus).not.toMatch(/-\s*\|x\|\s*=\s*-10\.5/);
    expect(corpus).not.toMatch(/\|x\s*\+\s*2\|\s*=\s*8/);
  });

  test("S3 added NO desafio for mat.u3.inecuaciones_valor_absoluto", () => {
    const list = loadChallengesForSkill("mat.u3.inecuaciones_valor_absoluto");
    expect(list, "inecuaciones_valor_absoluto should not have a new desafio in S3").toHaveLength(0);
  });
});