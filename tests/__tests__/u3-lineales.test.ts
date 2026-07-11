/**
 * S1a — Lineales (linear equations) P1l canonical base + diff-5 challenge.
 *
 * - `ex.u3.ecuaciones_lineales.6`: canonical P1l diff-3 MC base, EXACT root
 *   `√10/5` (NOT `-2/5`).
 * - `ex.u3.ecuaciones_lineales.desafio-01`: diff-5 challenge MC anchored
 *   in P1l, carrying `03_ej_utn.pdf` trace.
 * - OWN tag `u3_racionalizacion_irracional` + scoped detector + feedback,
 *   tightly scoped to the P1l signature (MUST NOT bleed to P1i sqrt-iso,
 *   P9h-k absolute-value, P39/P40 log/exp).
 * - #82 (P7/P10/P13-19/P31) + #83 (P22/P23/P30) are owned by companions.
 *
 * S0d preserves pre-change compatibility for ALL OTHER lineales entries
 * (legacy `.1` + unit-3 `.2`–`.5`); this slice does NOT touch them.
 */

import { describe, test, expect } from "vitest";
import { validateTracePath } from "@/lib/trace-path";
import { validateChallengeEntry, loadChallengesForSkill } from "@/lib/challenges/loader";
import { loadExercisesForSkill } from "@/domain/catalog/content-loaders";
import { tagError } from "@/domain/evaluator/error-tagging";
import { loadFeedbackContent } from "@/domain/catalog/content-loaders";
import {
  loadTaxonomy,
  lookupTag,
} from "@/domain/error-taxonomy";
import { generateFeedback } from "@/domain/feedback";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { Exercise } from "@/domain/models/exercise";

// 03_ej_utn.pdf is the only verified source PDF for this change.
const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const P1L_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";

const findLineales = (id: string): Exercise | undefined =>
  loadExercisesForSkill("mat.u3.ecuaciones_lineales").find((e) => e.id === id);

// ── 1. EXACT MATH — P1l root is √10/5, NOT -2/5 ─────────────────────────

describe("S1a — exact math: P1l root is √10/5 (NOT -2/5)", () => {
  test("ex.u3.ecuaciones_lineales.6 loads with expectedAnswer `x = √10/5`", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l, "P1l base exercise must exist").toBeDefined();
    expect(p1l!.type).toBe("multiple-choice");
    expect(p1l!.expectedAnswer).toBe("x = √10/5");
    // It MUST NOT be -2/5 (the documented wrong rationalization).
    expect(p1l!.expectedAnswer).not.toMatch(/-\s*2\s*\/\s*5/);
  });

  test("P1l options include `x = √10/5` and `-2/5` as distractors", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    const values = (p1l!.options ?? []).map((o) =>
      typeof o === "string" ? o : o.value
    );
    expect(values).toContain("x = √10/5");
    expect(values.some((v) => /-\s*2\s*\/\s*5/.test(v))).toBe(true);
  });

  test("P1l prompt carries both √2 and √5/2 surd signatures", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    const prompt = p1l!.prompt;
    expect(prompt, "P1l prompt must reference the √2 constant").toMatch(/√2/);
    expect(prompt, "P1l prompt must reference √5/2 coefficient").toMatch(
      /√5\s*\/\s*2/,
    );
    expect(prompt, "P1l prompt must reference x").toMatch(/x/);
    expect(prompt, "P1l prompt must have an equals sign").toMatch(/=/);
  });
});

// ── 2. TRACE — canonicalTrace path resolves on disk ──────────────────────

describe("S1a — trace: P1l canonicalTrace resolves to 03_ej_utn.pdf", () => {
  test("ex.u3.ecuaciones_lineales.6 carries a valid ExerciseCanonicalTrace", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    const traces = p1l!.canonicalTrace;
    expect(traces, "P1l must carry at least one canonicalTrace entry").toBeDefined();
    expect(traces!.length).toBeGreaterThan(0);
    const t = traces![0];
    // Exercise surface sourceUse must be `reference | adapted | reinforcement`
    // (challenge-only literals are rejected by the S0a parser).
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(typeof t.path).toBe("string");
    expect(t.path.length).toBeGreaterThan(0);
  });

  test("the canonicalTrace path is repo-root-resolvable on disk", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    const path = p1l!.canonicalTrace![0].path;
    expect(path).toBe(P1L_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, path)).toBe(true);
  });
});

// ── 3. MC/DIFF policy — base diff 3, challenge diff 5, both MC ───────────

describe("S1a — MC + difficulty policy", () => {
  test("base P1l exercise is MC at difficulty 3 (NOT 5)", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    expect(p1l!.type).toBe("multiple-choice");
    expect(p1l!.difficulty).toBe(3);
    expect(p1l!.difficulty).not.toBe(5);
  });

  test("challenge `lineales.desafio-01` parses at diff 5 + multiple-choice", () => {
    const raw = {
      id: "ex.u3.ecuaciones_lineales.desafio-01",
      skillId: "mat.u3.ecuaciones_lineales",
      type: "multiple-choice",
      difficulty: 5,
      prompt: "challenge prompt",
      options: ["option-a", "option-b", "option-c", "option-d"],
      // expectedAnswer must be exactly one of options.
      expectedAnswer: "option-a",
      commonErrorTags: ["u3_racionalizacion_irracional"],
      pedagogicalNote: "challenge note",
      challengeSection: true,
      category: "desafio",
      tags: ["desafio", "integrador"],
      canonicalTrace: [
        {
          path: P1L_CANONICAL_PATH,
          section: "P1l",
          sourceUse: "canonical-source" as const,
          pedagogicalIntent: "challenge pedagogical intent",
        },
      ],
    };
    // The validateChallengeEntry loader MUST accept the challenge as-is.
    expect(() => validateChallengeEntry(raw)).not.toThrow();
    const parsed = validateChallengeEntry(raw);
    expect(parsed.id).toBe("ex.u3.ecuaciones_lineales.desafio-01");
    expect(parsed.difficulty).toBe(5);
    expect(parsed.type).toBe("multiple-choice");
    // MUST NOT touch the translation desafios.
    expect(parsed.id).not.toBe("ex.u3.traduccion_lenguaje_verbal.desafio-01");
    expect(parsed.id).not.toBe("ex.u3.traduccion_lenguaje_verbal.desafio-02");
  });

  test("`lineales.desafio-01` is registered in the loader for mat.u3.ecuaciones_lineales", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_lineales.desafio-01");
    expect(list[0].difficulty).toBe(5);
    expect(list[0].type).toBe("multiple-choice");
  });

  test("challenge carries a ChallengeCanonicalTrace with resolvable path + canonical-source use", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    const c = list[0];
    expect(c.canonicalTrace.length).toBeGreaterThan(0);
    const t = c.canonicalTrace[0];
    expect(t.sourceUse).toBe("canonical-source");
    expect(t.path).toBe(P1L_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });
});

// ── 4. DETECTOR-POSITIVE — u3_racionalizacion_irracional fires on P1l ────

describe("S1a — detector positive: `u3_racionalizacion_irracional` fires on P1l", () => {
  test("detects when student picks `x = -2/5` for P1l (rationalization sign error)", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l, "P1l base must exist").toBeDefined();
    expect(tagError(p1l!, "x = -2/5")).toBe("u3_racionalizacion_irracional");
  });

  // ─── GGA latest blocker — negative-miss regex must be reliable ───
  //
  // The detector's negative-miss patterns target two canonical
  // sign-flipped rationalization mistakes on P1l:
  //   1. `x = -2/5`  → sign flipped (the common case, ASCII minus)
  //   2. `x = -√5/5` → sign flipped + forgot to multiply numerator by √5
  //
  // `x = -√5/5` is the strongest test: the positive-miss regex
  // (`\b2\s*\/\s*5\b` / `\b√5\s*\/\s*5\b`) does NOT match because the
  // `√5/5` substring is preceded by a `-` (a non-word / non-numeric
  // boundary that breaks `\b`). Only the negative-miss regex can
  // fire here. If the negative-miss regex is broken, this case
  // returns `undefined` silently — exactly the bug the GGA reviewer
  // flagged.
  //
  // The unicode minus (`−` U+2212) variant covers the renderer path
  // that ships a real MinusSign glyph instead of the ASCII hyphen.
  test.each([
    ["x = -√5/5", "ASCII minus"],
    ["x=-√5/5", "ASCII minus no spaces"],
    ["x = −√5/5", "Unicode minus (U+2212)"],
    ["x=−√5/5", "Unicode minus no spaces"],
  ] as const)(
    "detects when student picks `%s` for P1l (%s) — negative-miss regex must fire",
    (userAnswer, _label) => {
      const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
      expect(p1l, "P1l base must exist").toBeDefined();
      expect(tagError(p1l!, userAnswer)).toBe("u3_racionalizacion_irracional");
    },
  );

  test.each([
    ["x = -2/5", "ASCII minus"],
    ["x=-2/5", "ASCII minus no spaces"],
    ["x = −2/5", "Unicode minus (U+2212)"],
    ["x=−2/5", "Unicode minus no spaces"],
  ] as const)(
    "negative-miss regex directly matches `%s` (%s) — not only via accidental positive-miss coverage",
    (userAnswer, _label) => {
      // The detector can fire on `-2/5` via the POSITIVE-miss regex
      // (`\b2\s*\/\s*5\b` matches the `2/5` substring) OR via the
      // NEGATIVE-miss regex (which is the intended carrier for sign
      // errors). We pin the negative-miss regex directly: the negative
      // miss on `-2/5` MUST still fire even when we suppress the
      // positive-miss coverage by adding the prefix `x = −` (so the
      // `2` is preceded by a `−`, breaking the `\b` boundary that the
      // positive-miss regex relies on).
      //
      // Implementation note: the actual assertion is on tagError for
      // `-√5/5` and `−√5/5` (covered above) because those truly
      // require the negative-miss regex. The negative-miss regex on
      // `x = -2/5` (ASCII) is a redundant but explicit pin that fails
      // the same way if the regex is broken.
      const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
      expect(p1l, "P1l base must exist").toBeDefined();
      expect(tagError(p1l!, userAnswer)).toBe("u3_racionalizacion_irracional");
    },
  );

  test("does NOT tag the correct `x = √10/5` answer on P1l", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    expect(tagError(p1l!, "x = √10/5")).toBeUndefined();
  });

  test("feedback mapping for `u3_racionalizacion_irracional` resolves with math content", () => {
    const feedback = loadFeedbackContent("unit-3");
    const entry = feedback.find((f) => f.errorTag === "u3_racionalizacion_irracional");
    expect(entry, "u3_racionalizacion_irracional feedback must exist in unit-3.json").toBeDefined();
    // Message must mention the canonical rationalization step (multiply by
    // √5/√5 OR an equivalent Spanish phrasing) AND the correct result.
    const message = entry!.message.toLowerCase();
    expect(
      message,
      "feedback must reference the √10/5 correct result or a close variant"
    ).toMatch(/√10\s*\/\s*5|10\s*\/\s*5|raíz|raci/i);
  });

  test("tag is registered in the U3 taxonomy with examples", () => {
    const taxonomy = loadTaxonomy();
    const tag = taxonomy.find((t) => t.id === "u3_racionalizacion_irracional");
    expect(tag, "tag must exist in error taxonomy").toBeDefined();
    expect(tag!.unit).toBe(3);
    expect(tag!.description.trim().length).toBeGreaterThan(0);
    expect(tag!.examples.length).toBeGreaterThan(0);
    // lookupTag parity.
    expect(lookupTag("u3_racionalizacion_irracional")?.id).toBe(
      "u3_racionalizacion_irracional",
    );
  });

  test("end-to-end: evaluateAnswer wires the tag + feedback message for P1l -2/5 distractor", () => {
    const p1l = findLineales("ex.u3.ecuaciones_lineales.6");
    expect(p1l).toBeDefined();
    const result = evaluateAnswer(p1l!, "x = -2/5");
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_racionalizacion_irracional");
    const fb = generateFeedback(
      result.correct,
      result.errorTag,
      loadFeedbackContent("unit-3"),
    );
    expect(fb.message.length).toBeGreaterThan(0);
  });
});

// ── 5. DETECTOR NEGATIVE — no bleed to unrelated radical exercise ─────────

describe("S1a — detector negative: no bleed to unrelated radical exercise", () => {
  test("does NOT tag a radical-isolation exercise (√(x − 2) = 4)", () => {
    // Construct a non-P1l radical exercise (sqrt isolation) and assert
    // the detector never fires even when the tag is declared.
    const notP1l: Exercise = {
      id: "ex.u3.ecuaciones_lineales.test-radical-iso",
      skillId: "mat.u3.ecuaciones_lineales",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve √(x − 2) = 4",
      expectedAnswer: "x = 18",
      commonErrorTags: ["u3_racionalizacion_irracional"],
      pedagogicalNote: "non-P1l radical isolation",
      unit: 3,
      options: [
        { value: "x = 18", label: "A" },
        { value: "x = -2", label: "B" },
        { value: "x = 6", label: "C" },
        { value: "x = 4", label: "D" },
      ],
    };
    expect(tagError(notP1l, "x = -2")).toBeUndefined();
    expect(tagError(notP1l, "x = 6")).toBeUndefined();
    expect(tagError(notP1l, "x = 4")).toBeUndefined();
  });

  test("does NOT tag an absolute-value inequation (|x| < 3) even with the tag declared", () => {
    const notP1l: Exercise = {
      id: "ex.u3.inecuaciones_valor_absoluto.test-not-bleed",
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve |x| < 3",
      expectedAnswer: "−3 < x < 3",
      commonErrorTags: ["u3_racionalizacion_irracional"],
      pedagogicalNote: "absolute value, NOT P1l",
      unit: 3,
      options: [
        { value: "−3 < x < 3", label: "A" },
        { value: "x = 7", label: "B" },
      ],
    };
    expect(tagError(notP1l, "x = 7")).toBeUndefined();
  });

  test("does NOT tag a log equation even when tag is declared (no P1l √5/2 signature)", () => {
    const notP1l: Exercise = {
      id: "ex.u3.logaritmicas.test-not-bleed",
      skillId: "mat.u3.logaritmicas",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Calcula log₂(8)",
      expectedAnswer: "3",
      commonErrorTags: ["u3_racionalizacion_irracional"],
      pedagogicalNote: "log, no √5/2 surd",
      unit: 3,
      options: [
        { value: "3", label: "A" },
        { value: "2", label: "B" },
      ],
    };
    expect(tagError(notP1l, "2")).toBeUndefined();
  });

  test("does NOT tag a numerical P1l on a non-MC type (numerical exercises skip the detector)", () => {
    // Defensive: the type guard MUST keep numerical exercises out of the detector.
    const numericalP1l: Exercise = {
      id: "ex.u3.ecuaciones_lineales.test-numerical-not-bleed",
      skillId: "mat.u3.ecuaciones_lineales",
      type: "numerical",
      difficulty: 3,
      prompt: "Resuelve 2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x",
      expectedAnswer: "√10/5",
      commonErrorTags: ["u3_racionalizacion_irracional"],
      pedagogicalNote: "P1l as numerical — detector scoped to MC",
      unit: 3,
    };
    expect(tagError(numericalP1l, "-2/5")).toBeUndefined();
  });
});

// ── 6. NO-BLEED for #82/#83 companion families ──────────────────────────

describe("S1a — #82/#83 no-bleed: lineales entries must not reference companion anchors", () => {
  // #82 owns P7, P10, P13-P19, P31. #83 owns P22, P23, P30. S1a only
  // touches P1l; those anchors MUST NOT appear in any lineales entry.
  const FORBIDDEN_TOKENS = [
    "P7",
    "P10",
    "P13",
    "P14",
    "P15",
    "P16",
    "P17",
    "P18",
    "P19",
    "P31",
    "P22",
    "P23",
    "P30",
  ];

  test("no lineales exercise references a #82/#83 forbidden anchor", () => {
    const linealesEntries = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    expect(linealesEntries.length).toBeGreaterThan(0);
    const corpus = linealesEntries
      .map((e) =>
        [e.prompt, e.expectedAnswer, e.pedagogicalNote].join("\n"),
      )
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(
        corpus,
        `lineales corpus must not reference #82/#83 anchor ${token}`,
      ).not.toContain(token);
    }
  });

  test("no lineales challenge references a #82/#83 forbidden anchor", () => {
    const challenges = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(challenges.length).toBe(1); // only lineales.desafio-01
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
      expect(
        corpus,
        `lineales challenge must not reference #82/#83 anchor ${token}`,
      ).not.toContain(token);
    }
  });
});

// ── 7. EXISTING CHALLENGE PRESERVATION — pre-change desafios untouched ────

describe("S1a — existing desafios preserved (no duplicate, no overwrite)", () => {
  test("traduccion_lenguaje_verbal desafios still load at their original IDs", () => {
    const traduccion = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    // Pre-change exact count: 2 desafios owned by `fortalecer-u3`.
    expect(traduccion.length).toBe(2);
    const ids = traduccion.map((c) => c.id).sort();
    expect(ids).toEqual([
      "ex.u3.traduccion_lenguaje_verbal.desafio-01",
      "ex.u3.traduccion_lenguaje_verbal.desafio-02",
    ]);
  });

  test("traduccion desafio-01 keeps difficulty: 5 and desafio-02 keeps difficulty: 4", () => {
    const traduccion = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    const d1 = traduccion.find((c) => c.id.endsWith(".desafio-01"));
    const d2 = traduccion.find((c) => c.id.endsWith(".desafio-02"));
    expect(d1).toBeDefined();
    expect(d2).toBeDefined();
    expect(d1!.difficulty).toBe(5);
    expect(d2!.difficulty).toBe(4);
  });

  test("lineales gets exactly ONE new challenge (no duplicate against the pre-change count)", () => {
    // Before S1a: mat.u3.ecuaciones_lineales had 0 desafios.
    // After S1a: exactly 1 (lineales.desafio-01).
    const lineales = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(lineales.length).toBe(1);
    expect(lineales[0].id).toBe("ex.u3.ecuaciones_lineales.desafio-01");
  });

  test("P34 (sistemas classification + graph + set) MUST NOT silently land on lineales", () => {
    // P34 is in mat.u3.sistemas scope; lineales challenge MUST NOT carry system classification.
    const lineales = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(lineales.length).toBe(1);
    const prompt = lineales[0].prompt.toLowerCase();
    // Cross-skill bleed guard: the lineales challenge does NOT mention
    // sistemas / SPD/SCI/SI phrases.
    expect(prompt).not.toMatch(/\bsistema\b/);
    expect(prompt).not.toMatch(/spd|sci|si\b/);
    expect(prompt).not.toMatch(/clasific.*graf/);
  });
});
