/**
 * S1b — Cuadraticas P5d/P6b/P6f base + diff-5 challenge + OWN discriminant tag.
 * Scope: .6 P5d diff-3 (roots ±9), .7 P6b diff-4 (set (-∞,0)∪(0,1/4)),
 * .8 P6f diff-4 (set (-∞,-1/4)), cuadraticas.desafio-01 diff-5 (P6b/P6f).
 * Tag `u3_discriminante_signo_incorrecto` scoped to P6 parameter-k signature.
 * No-bleed: P5d numeric-coefficient, P9 log/exp, P8 abs-val. #82/#83 untouched.
 */
import { describe, test, expect } from "vitest";
import { validateTracePath } from "@/lib/trace-path";
import { validateChallengeEntry, loadChallengesForSkill } from "@/lib/challenges/loader";
import { loadExercisesForSkill } from "@/domain/catalog/content-loaders";
import { tagError } from "@/domain/evaluator/error-tagging";
import { loadFeedbackContent } from "@/domain/catalog/content-loaders";
import { loadTaxonomy, lookupTag } from "@/domain/error-taxonomy";
import { generateFeedback } from "@/domain/feedback";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { Exercise } from "@/domain/models/exercise";

const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const CUADRATICAS_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";

const findCuadraticas = (id: string): Exercise | undefined =>
  loadExercisesForSkill("mat.u3.ecuaciones_cuadraticas").find((e) => e.id === id);

// ── 1. P5d roots are -9 AND 9 (NOT only positive) ────────────────────────

describe("S1b — exact math: P5d roots are x = -9 and x = 9", () => {
  test("cuadraticas.6 expectedAnswer carries both roots", () => {
    const p5d = findCuadraticas("ex.u3.ecuaciones_cuadraticas.6");
    expect(p5d, "P5d must exist").toBeDefined();
    expect(p5d!.type).toBe("multiple-choice");
    const expected = p5d!.expectedAnswer;
    expect(expected, "expected must mention x = -9").toMatch(/-\s*9/);
    expect(expected, "expected must mention x = 9").toMatch(/\b9\b/);
    expect(expected, "must NOT collapse to only `x = 9`").not.toBe("x = 9");
  });

  test("P5d options include the compound -9/9 form; prompt references (7x² - 3) / 4 = 141", () => {
    const p5d = findCuadraticas("ex.u3.ecuaciones_cuadraticas.6");
    expect(p5d).toBeDefined();
    const values = (p5d!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
    expect(values.some((v) => /-\s*9/.test(v) && /\b9\b/.test(v))).toBe(true);
    expect(p5d!.prompt, "must reference 7x²").toMatch(/7\s*x\s*(\^?2|²)/);
    expect(p5d!.prompt, "must reference 141").toMatch(/141/);
  });
});

// ── 2. P6b is (-∞,0)∪(0,1/4), P6f is (-∞,-1/4) ─────────────────────────

describe("S1b — exact sets: P6b is (-∞,0)∪(0,1/4), P6f is (-∞,-1/4)", () => {
  test("P6b expectedAnswer is the compound real-distinct set", () => {
    const p6b = findCuadraticas("ex.u3.ecuaciones_cuadraticas.7");
    expect(p6b, "P6b must exist").toBeDefined();
    const e = p6b!.expectedAnswer;
    expect(e, "P6b references -∞").toMatch(/-\s*∞|-∞/);
    expect(e, "P6b references 0 (k=0 exclusion)").toMatch(/\b0\b/);
    expect(e, "P6b references 1/4").toMatch(/1\s*\/\s*4/);
    expect(e, "P6b uses ∪ between intervals").toMatch(/∪/);
  });

  test("P6f expectedAnswer is the single-ray complex set", () => {
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    expect(p6f, "P6f must exist").toBeDefined();
    const e = p6f!.expectedAnswer;
    expect(e, "P6f references -∞").toMatch(/-\s*∞|-∞/);
    expect(e, "P6f references -1/4").toMatch(/-\s*1\s*\/\s*4|-\s*0\.25/);
    expect(e, "P6f is a single ray (no ∪)").not.toMatch(/∪/);
  });

  test("P6b options include the compound (-∞,0)∪(0,1/4) form", () => {
    const p6b = findCuadraticas("ex.u3.ecuaciones_cuadraticas.7");
    const values = (p6b!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
    expect(
      values.some(
        (v) => /-\s*∞/.test(v) && /∪/.test(v) && /0/.test(v) && /1\s*\/\s*4/.test(v),
      ),
      "P6b options must include the compound (-∞,0)∪(0,1/4) form",
    ).toBe(true);
  });

  test("P6f options include (-∞,-1/4) as a single ray", () => {
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    const values = (p6f!.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
    expect(
      values.some(
        (v) => /-\s*∞/.test(v) && /-\s*1\s*\/\s*4|-\s*0\.25/.test(v) && !/∪/.test(v),
      ),
    ).toBe(true);
  });
});

// ── 3. Trace path resolves on disk ──────────────────────────────────────

describe("S1b — trace: P5d/P6b/P6f canonicalTrace resolves to 03_ej_utn.pdf", () => {
  test.each(["6", "7", "8"] as const)(
    "cuadraticas.%s carries a valid ExerciseCanonicalTrace",
    (n) => {
      const e = findCuadraticas(`ex.u3.ecuaciones_cuadraticas.${n}`);
      expect(e).toBeDefined();
      const traces = e!.canonicalTrace;
      expect(traces).toBeDefined();
      expect(traces!.length).toBeGreaterThan(0);
      const t = traces![0];
      // Exercise surface sourceUse enum: reference | adapted | reinforcement.
      expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
      expect(typeof t.path).toBe("string");
      expect(t.path).toBe(CUADRATICAS_CANONICAL_PATH);
      expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
    },
  );
});

// ── 4. MC/DIFF policy — base 3/4, challenge 5, all MC ──────────────────

describe("S1b — MC + difficulty policy", () => {
  test("P5d is MC at diff 3; P6b/P6f are MC at diff 4", () => {
    const p5d = findCuadraticas("ex.u3.ecuaciones_cuadraticas.6");
    const p6b = findCuadraticas("ex.u3.ecuaciones_cuadraticas.7");
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    expect(p5d!.type).toBe("multiple-choice");
    expect(p5d!.difficulty).toBe(3);
    expect(p6b!.type).toBe("multiple-choice");
    expect(p6f!.type).toBe("multiple-choice");
    expect(p6b!.difficulty).toBe(4);
    expect(p6f!.difficulty).toBe(4);
  });

  test("cuadraticas.desafio-01 parses at diff 5 + multiple-choice", () => {
    const raw = {
      id: "ex.u3.ecuaciones_cuadraticas.desafio-01",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      type: "multiple-choice",
      difficulty: 5,
      prompt: "challenge prompt anchored in P6b/P6f",
      options: ["a", "b", "c", "d"],
      expectedAnswer: "a",
      commonErrorTags: ["u3_discriminante_signo_incorrecto"],
      pedagogicalNote: "challenge note",
      challengeSection: true,
      category: "desafio",
      tags: ["desafio", "integrador"],
      canonicalTrace: [
        {
          path: CUADRATICAS_CANONICAL_PATH,
          section: "P6",
          sourceUse: "canonical-source" as const,
          pedagogicalIntent: "challenge pedagogical intent",
        },
      ],
    };
    expect(() => validateChallengeEntry(raw)).not.toThrow();
    const parsed = validateChallengeEntry(raw);
    expect(parsed.id).toBe("ex.u3.ecuaciones_cuadraticas.desafio-01");
    expect(parsed.difficulty).toBe(5);
    expect(parsed.type).toBe("multiple-choice");
    // MUST NOT collide with the translation desafios or lineales desafio.
    expect(parsed.id).not.toMatch(/traduccion_lenguaje_verbal/);
    expect(parsed.id).not.toMatch(/ecuaciones_lineales\.desafio/);
  });

  test("cuadraticas.desafio-01 is registered with diff 5 + MC + resolvable trace", () => {
    const list = loadChallengesForSkill("mat.u3.ecuaciones_cuadraticas");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ex.u3.ecuaciones_cuadraticas.desafio-01");
    expect(list[0].difficulty).toBe(5);
    expect(list[0].type).toBe("multiple-choice");
    expect(list[0].canonicalTrace[0].sourceUse).toBe("canonical-source");
    expect(list[0].canonicalTrace[0].path).toBe(CUADRATICAS_CANONICAL_PATH);
    expect(validateTracePath(REPO_ROOT, list[0].canonicalTrace[0].path)).toBe(true);
  });
});

// ── 5. Detector positive — fires on P6 sign-flipped distractor ─────────

describe("S1b — detector positive: `u3_discriminante_signo_incorrecto` fires on P6", () => {
  test("fires when student picks sign-flipped set for P6f", () => {
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    expect(p6f, "P6f must exist").toBeDefined();
    // Expected (-∞, -1/4); sign-flipped distractor is (-1/4, ∞).
    expect(tagError(p6f!, "(-1/4, ∞)")).toBe("u3_discriminante_signo_incorrecto");
  });

  test("fires when student picks sign-flipped set for P6b", () => {
    const p6b = findCuadraticas("ex.u3.ecuaciones_cuadraticas.7");
    expect(p6b, "P6b must exist").toBeDefined();
    // Expected (-∞,0) ∪ (0,1/4); sign-flipped distractor inverts 1/4 → -1/4.
    expect(tagError(p6b!, "(0, -1/4) ∪ (-1/4, ∞)")).toBe(
      "u3_discriminante_signo_incorrecto",
    );
  });

  test("does NOT tag the correct P6f `(-∞, -1/4)` or P6b `(-∞,0) ∪ (0,1/4)` answer", () => {
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    const p6b = findCuadraticas("ex.u3.ecuaciones_cuadraticas.7");
    expect(tagError(p6f!, "(-∞, -1/4)")).toBeUndefined();
    expect(tagError(p6b!, "(-∞,0) ∪ (0,1/4)")).toBeUndefined();
  });

  test("feedback mapping resolves with discriminant-sign math content", () => {
    const feedback = loadFeedbackContent("unit-3");
    const entry = feedback.find((f) => f.errorTag === "u3_discriminante_signo_incorrecto");
    expect(entry, "feedback must exist in unit-3.json").toBeDefined();
    expect(entry!.message.toLowerCase()).toMatch(/discriminante|b\s*²|b\^2|b2|signo/);
  });

  test("tag is registered in the U3 taxonomy with examples", () => {
    const taxonomy = loadTaxonomy();
    const tag = taxonomy.find((t) => t.id === "u3_discriminante_signo_incorrecto");
    expect(tag).toBeDefined();
    expect(tag!.unit).toBe(3);
    expect(tag!.description.trim().length).toBeGreaterThan(0);
    expect(tag!.examples.length).toBeGreaterThan(0);
    expect(lookupTag("u3_discriminante_signo_incorrecto")?.id).toBe(
      "u3_discriminante_signo_incorrecto",
    );
  });

  test("end-to-end: evaluateAnswer wires the tag + feedback for P6f distractor", () => {
    const p6f = findCuadraticas("ex.u3.ecuaciones_cuadraticas.8");
    const result = evaluateAnswer(p6f!, "(-1/4, ∞)");
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_discriminante_signo_incorrecto");
    const fb = generateFeedback(result.correct, result.errorTag, loadFeedbackContent("unit-3"));
    expect(fb.message.length).toBeGreaterThan(0);
  });
});

// ── 6. Detector negative — no bleed to unrelated quadratics ────────────

describe("S1b — detector negative: no bleed to unrelated quadratic / non-quadratic", () => {
  test("does NOT tag P5d (numeric-coefficient, no parameter k)", () => {
    // P5d has (7x² - 3) / 4 = 141 — NO parameter `k`, so the detector
    // MUST stay out.
    const p5d = findCuadraticas("ex.u3.ecuaciones_cuadraticas.6");
    expect(tagError(p5d!, "x = 9")).toBeUndefined();
    expect(tagError(p5d!, "x = -9")).toBeUndefined();
    expect(tagError(p5d!, "x = 0")).toBeUndefined();
  });

  test("does NOT tag a numeric-coefficient P5-style quadratic (x² - 7x + 12 = 0)", () => {
    const notP6: Exercise = {
      id: "ex.u3.ecuaciones_cuadraticas.test-not-bleed-p5",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      type: "multiple-choice",
      difficulty: 3,
      prompt: "Resuelve x² - 7x + 12 = 0",
      expectedAnswer: "x = 3, x = 4",
      commonErrorTags: ["u3_discriminante_signo_incorrecto"],
      pedagogicalNote: "P5-style numeric-coefficient quadratic, NOT P6",
      unit: 3,
      options: [
        { value: "x = 3, x = 4", label: "A" },
        { value: "x = -3, x = -4", label: "B" },
        { value: "x = 0, x = 7", label: "C" },
        { value: "x = 1, x = 12", label: "D" },
      ],
    };
    expect(tagError(notP6, "x = -3, x = -4")).toBeUndefined();
    expect(tagError(notP6, "x = 0, x = 7")).toBeUndefined();
    expect(tagError(notP6, "x = 1, x = 12")).toBeUndefined();
  });

  test("does NOT tag a log or absolute-value exercise (skillId != cuadraticas)", () => {
    const notP6Log: Exercise = {
      id: "ex.u3.logaritmicas.test-not-bleed-cuadraticas",
      skillId: "mat.u3.logaritmicas",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Calcula log₂(8)",
      expectedAnswer: "3",
      commonErrorTags: ["u3_discriminante_signo_incorrecto"],
      pedagogicalNote: "log, not a quadratic",
      unit: 3,
      options: [
        { value: "3", label: "A" },
        { value: "2", label: "B" },
      ],
    };
    const notP6Abs: Exercise = {
      id: "ex.u3.inecuaciones_valor_absoluto.test-not-bleed-cuadraticas",
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Resuelve |x| < 3",
      expectedAnswer: "-3 < x < 3",
      commonErrorTags: ["u3_discriminante_signo_incorrecto"],
      pedagogicalNote: "abs val, not a quadratic",
      unit: 3,
      options: [
        { value: "-3 < x < 3", label: "A" },
        { value: "x = 7", label: "B" },
      ],
    };
    expect(tagError(notP6Log, "2")).toBeUndefined();
    expect(tagError(notP6Abs, "x = 7")).toBeUndefined();
  });
});

// ── 7. #82/#83 no-bleed across cuadraticas entries ─────────────────────

describe("S1b — #82/#83 no-bleed: cuadraticas entries must not reference companion anchors", () => {
  // #82 owns P7, P10, P13-P19, P31. #83 owns P22, P23, P30. S1b only
  // touches P5d/P6b/P6f + the cuadraticas desafio.
  const FORBIDDEN_TOKENS = [
    "P7", "P10", "P13", "P14", "P15", "P16", "P17", "P18", "P19",
    "P31", "P22", "P23", "P30",
  ];

  test("no cuadraticas exercise references a #82/#83 forbidden anchor", () => {
    const entries = loadExercisesForSkill("mat.u3.ecuaciones_cuadraticas");
    expect(entries.length).toBeGreaterThan(0);
    const corpus = entries
      .map((e) => [e.prompt, e.expectedAnswer, e.pedagogicalNote].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `cuadraticas must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });

  test("no cuadraticas challenge references a #82/#83 forbidden anchor", () => {
    const challenges = loadChallengesForSkill("mat.u3.ecuaciones_cuadraticas");
    expect(challenges.length).toBe(1);
    const corpus = challenges
      .map((c) => [c.prompt, c.expectedAnswer, c.pedagogicalNote, ...c.canonicalTrace.map((t) => t.section + " " + t.pedagogicalIntent)].join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `cuadraticas challenge must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });
});

// ── 8. Existing desafios preserved; cuadraticas gets exactly 1 ─────────

describe("S1b — existing desafios preserved; cuadraticas gets exactly ONE", () => {
  test("traduccion_lenguaje_verbal desafios still load at their original IDs and difficulties", () => {
    const traduccion = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    expect(traduccion.length).toBe(2);
    expect(traduccion.map((c) => c.id).sort()).toEqual([
      "ex.u3.traduccion_lenguaje_verbal.desafio-01",
      "ex.u3.traduccion_lenguaje_verbal.desafio-02",
    ]);
    const d1 = traduccion.find((c) => c.id.endsWith(".desafio-01"))!;
    const d2 = traduccion.find((c) => c.id.endsWith(".desafio-02"))!;
    expect(d1.difficulty).toBe(5);
    expect(d2.difficulty).toBe(4);
  });

  test("cuadraticas gets exactly ONE new challenge; lineales still has its one", () => {
    const cuadraticas = loadChallengesForSkill("mat.u3.ecuaciones_cuadraticas");
    expect(cuadraticas.length).toBe(1);
    expect(cuadraticas[0].id).toBe("ex.u3.ecuaciones_cuadraticas.desafio-01");
    const lineales = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    expect(lineales.length).toBe(1);
    expect(lineales[0].id).toBe("ex.u3.ecuaciones_lineales.desafio-01");
  });
});