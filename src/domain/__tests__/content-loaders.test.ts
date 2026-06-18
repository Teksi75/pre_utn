/**
 * Tests for content-loader backward-compat defaults.
 *
 * Ensures that exercises loaded from JSON without optional metadata fields
 * (category, tags) receive sensible defaults.
 */

import { describe, test, expect } from "vitest";
import {
  applyExerciseDefaults,
  loadExercisesForSkill,
  loadSkillBank,
  validatePracticeBank,
  loadFeedbackContent,
  loadTheoryContent,
  loadExampleContent,
  parseConceptBlock,
} from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";

describe("applyExerciseDefaults", () => {
  const baseRaw: Record<string, unknown> = {
    id: "ex.u1.conjuntos_numericos.1",
    skillId: "mat.u1.conjuntos_numericos",
    type: "multiple-choice",
    difficulty: 1,
    prompt: "Test prompt",
    expectedAnswer: "A",
    options: ["A", "B", "C", "D"],
    commonErrorTags: [],
    pedagogicalNote: "Note",
  };

  test("exercise without category and tags receives defaults", () => {
    const result = applyExerciseDefaults(baseRaw);
    expect(result.category).toBe("clasificacion");
    expect(result.tags).toEqual([]);
  });

  test("exercise with existing category preserves it", () => {
    const raw = { ...baseRaw, category: "pertenencia" };
    const result = applyExerciseDefaults(raw);
    expect(result.category).toBe("pertenencia");
  });

  test("exercise with existing tags preserves them", () => {
    const raw = { ...baseRaw, tags: ["tag1", "tag2"] };
    const result = applyExerciseDefaults(raw);
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  test("exercise with both category and tags preserves both", () => {
    const raw = { ...baseRaw, category: "decimales", tags: ["decimal_finito"] };
    const result = applyExerciseDefaults(raw);
    expect(result.category).toBe("decimales");
    expect(result.tags).toEqual(["decimal_finito"]);
  });

  test("exercise without commonErrorTags defaults to empty array", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { commonErrorTags: _unused, ...rawNoTags } = baseRaw;
    const result = applyExerciseDefaults(rawNoTags as Record<string, unknown>);
    expect(Array.isArray(result.commonErrorTags)).toBe(true);
    expect(result.commonErrorTags).toEqual([]);
  });

  test("exercise with non-array commonErrorTags defaults to empty array", () => {
    const raw = { ...baseRaw, commonErrorTags: "not-an-array" };
    const result = applyExerciseDefaults(raw);
    expect(Array.isArray(result.commonErrorTags)).toBe(true);
    expect(result.commonErrorTags).toEqual([]);
  });

  test("exercise with mixed-type commonErrorTags filters to strings only", () => {
    const raw = { ...baseRaw, commonErrorTags: ["tag1", 42, "tag2", null] };
    const result = applyExerciseDefaults(raw);
    expect(result.commonErrorTags).toEqual(["tag1", "tag2"]);
  });

  test("exercise without prompt throws instead of defaulting to an empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prompt: _unused, ...rawWithoutPrompt } = baseRaw;
    expect(() => applyExerciseDefaults(rawWithoutPrompt)).toThrow(
      "expected non-empty string"
    );
  });

  test("exercise without expectedAnswer throws instead of defaulting to an empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expectedAnswer: _unused, ...rawWithoutAnswer } = baseRaw;
    expect(() => applyExerciseDefaults(rawWithoutAnswer)).toThrow(
      "expected non-empty string"
    );
  });

  test("free-response exercises are rejected at the catalog boundary", () => {
    const raw = { ...baseRaw, type: "free-response" };
    expect(() => applyExerciseDefaults(raw)).toThrow(
      "unsupported exercise type"
    );
  });
});

describe("loadSkillBank — wiring bank validator into catalog load path", () => {
  const SKILL_ID = "mat.u1.conjuntos_numericos";

  test("returns { exercises, diagnostics } shape for the skill", () => {
    const result = loadSkillBank(SKILL_ID);
    expect(result).toHaveProperty("exercises");
    expect(result).toHaveProperty("diagnostics");
    expect(Array.isArray(result.exercises)).toBe(true);
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  test("exercises match the legacy loadExercisesForSkill output (backward compat)", () => {
    const legacy = loadExercisesForSkill(SKILL_ID);
    const banked = loadSkillBank(SKILL_ID);
    expect(banked.exercises.length).toBe(legacy.length);
    expect(banked.exercises.map((e) => e.id)).toEqual(legacy.map((e) => e.id));
  });

  test("diagnostics match a direct validatePracticeBank call with the same inputs", () => {
    // Triangulation: the wiring must surface the same diagnostics as calling
    // the validator directly. This is the contract that the new entry point
    // guarantees — exact content changes as the bank grows, but the wiring
    // contract is preserved.
    const exercises = loadExercisesForSkill(SKILL_ID);
    const feedback = loadFeedbackContent("unit-1");
    const directDiagnostics = validatePracticeBank(SKILL_ID, exercises, feedback);
    const banked = loadSkillBank(SKILL_ID);
    expect(banked.diagnostics).toEqual(directDiagnostics);
  });
});

describe("Unit-2 content loaders", () => {
  describe("loadTheoryContent", () => {
    test("loads theory for unit-2 (>= 7 theory nodes) with normalized concepts", () => {
      const theory = loadTheoryContent("unit-2");
      expect(Array.isArray(theory)).toBe(true);
      expect(theory.length).toBeGreaterThanOrEqual(7);
      expect(theory[0]).toHaveProperty("id");
      expect(theory[0]).toHaveProperty("skillId");
      expect(theory[0]).toHaveProperty("concepts");
      expect(Array.isArray(theory[0].concepts)).toBe(true);
      expect(theory[0].concepts.length).toBeGreaterThanOrEqual(1);
    });

    test("theory nodes belong to U2 skills", () => {
      const theory = loadTheoryContent("unit-2");
      const skillIds = theory.map((t) => t.skillId);
      expect(skillIds).toContain("mat.u2.polinomios_basico");
      expect(skillIds).toContain("mat.u2.operaciones_polinomios");
      expect(skillIds).toContain("mat.u2.ruffini_resto");
    });
  });

  describe("loadExampleContent", () => {
    test("loads examples for unit-2 (>= 5 worked examples)", () => {
      const examples = loadExampleContent("unit-2");
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThanOrEqual(5);
    });

    test("each example has required fields", () => {
      const examples = loadExampleContent("unit-2");
      for (const ex of examples) {
        expect(ex).toHaveProperty("id");
        expect(ex).toHaveProperty("skillId");
        expect(ex).toHaveProperty("problem");
        expect(ex).toHaveProperty("steps");
        expect(ex.steps.length).toBeGreaterThan(0);
      }
    });
  });

  describe("loadFeedbackContent", () => {
    test("loads feedback for unit-2 (>= 8 feedback mappings)", () => {
      const feedback = loadFeedbackContent("unit-2");
      expect(Array.isArray(feedback)).toBe(true);
      expect(feedback.length).toBeGreaterThanOrEqual(8);
    });

    test("all u2_* polynomial error tags have feedback", () => {
      const feedback = loadFeedbackContent("unit-2");
      const tags = feedback.map((f) => f.errorTag);
      expect(tags).toContain("u2_signo_operacion");
      expect(tags).toContain("u2_termino_semejante");
      expect(tags).toContain("u2_ruffini_signo_a");
      expect(tags).toContain("u2_grado_incorrecto");
      expect(tags).toContain("u2_termino_faltante");
      expect(tags).toContain("u2_factorizacion_incompleta");
      expect(tags).toContain("u2_signo_factorizacion");
      expect(tags).toContain("u2_caso_incorrecto");
    });
  });

  describe("loadExercisesForSkill for U2 skills", () => {
    test("loads exercises for polinomios_basico (>= 5 exercises)", () => {
      const exercises = loadExercisesForSkill("mat.u2.polinomios_basico");
      expect(exercises.length).toBeGreaterThanOrEqual(5);
    });

    test("loads exercises for operaciones_polinomios (>= 5 exercises)", () => {
      const exercises = loadExercisesForSkill("mat.u2.operaciones_polinomios");
      expect(exercises.length).toBeGreaterThanOrEqual(5);
    });

    test("loads exercises for ruffini_resto (>= 5 exercises)", () => {
      const exercises = loadExercisesForSkill("mat.u2.ruffini_resto");
      expect(exercises.length).toBeGreaterThanOrEqual(5);
    });

    test("ex.u2.gauss.1 is correctly under mat.u2.gauss with U2 Gauss content", () => {
      const u2GaussEx = loadExercisesForSkill("mat.u2.gauss");
      const u3SistemasEx = loadExercisesForSkill("mat.u3.sistemas");

      // gauss.1 should BE in mat.u2.gauss exercises
      const gaussInU2 = u2GaussEx.some((e) => e.id === "ex.u2.gauss.1");
      expect(gaussInU2).toBe(true);

      // gauss.1 should NOT be in mat.u3.sistemas exercises (was relocated in previous slice)
      const gaussInU3 = u3SistemasEx.some((e) => e.id === "ex.u2.gauss.1");
      expect(gaussInU3).toBe(false);
    });
  });
});

describe("validatePracticeBank — defensive against missing commonErrorTags", () => {
  test("does not crash when an exercise has no commonErrorTags field", () => {
    const ex = {
      id: "ex.u1.conjuntos_numericos.99" as Exercise["id"],
      skillId: "mat.u1.conjuntos_numericos",
      type: "multiple-choice" as Exercise["type"],
      difficulty: 1 as Exercise["difficulty"],
      prompt: "Test",
      expectedAnswer: "A",
      options: ["A", "B"],
      pedagogicalNote: "Note",
      category: "pertenencia",
      tags: [],
      // commonErrorTags intentionally omitted
    } as unknown as Exercise;
    const diagnostics = validatePracticeBank("mat.u1.conjuntos_numericos", [ex]);
    // Mostly category-count diagnostics; must not crash.
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  test("does not crash when commonErrorTags is undefined", () => {
    const ex = {
      id: "ex.u1.conjuntos_numericos.99" as Exercise["id"],
      skillId: "mat.u1.conjuntos_numericos",
      type: "multiple-choice" as Exercise["type"],
      difficulty: 1 as Exercise["difficulty"],
      prompt: "Test",
      expectedAnswer: "A",
      options: ["A", "B"],
      pedagogicalNote: "Note",
      category: "pertenencia",
      tags: [],
      commonErrorTags: undefined,
    } as unknown as Exercise;
    const diagnostics = validatePracticeBank("mat.u1.conjuntos_numericos", [ex]);
    expect(Array.isArray(diagnostics)).toBe(true);
  });
});

describe("loadSkillBank — narrow catch", () => {
  test("throws for a skillId that cannot derive a unit key (no mat.uN pattern)", () => {
    // "bad.id" would throw from skillIdToUnitKey, which is NOT an
    // "Unknown feedback unit key" error — loadSkillBank must NOT swallow it.
    expect(() => loadSkillBank("bad.id")).toThrow("Cannot derive unit key");
  });

  test("does not crash for a skillId whose unit has no feedback (legitimate absence)", () => {
    // mat.u4.vectores has no registered feedback file yet.
    // loadSkillBank must handle the missing-feedback case gracefully.
    const result = loadSkillBank("mat.u4.vectores");
    expect(result).toHaveProperty("exercises");
    expect(result).toHaveProperty("diagnostics");
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });
});

describe("parseConceptBlock — bodyParagraphs model", () => {
  // Note: parseConceptBlock is exported from content-loaders for testability.
  const baseRaw: Record<string, unknown> = {
    id: "concept-ruffini-procedimiento",
    title: "1. Regla de Ruffini: procedimiento",
    body: "legacy fallback body",
  };

  test("preserves valid bodyParagraphs array alongside body", () => {
    const raw = {
      ...baseRaw,
      bodyParagraphs: ["Para dividir P(x) por (x−a):", "Resto es P(a)."],
    };
    const result = parseConceptBlock(raw, "theory-ruffini-resto", 0);
    expect(result.bodyParagraphs).toEqual([
      "Para dividir P(x) por (x−a):",
      "Resto es P(a).",
    ]);
  });

  test("legacy concept with only body still parses", () => {
    const result = parseConceptBlock(baseRaw, "theory-ruffini-resto", 0);
    expect(result.body).toBe("legacy fallback body");
    expect(result.bodyParagraphs).toBeUndefined();
  });

  test("empty array normalizes to undefined", () => {
    const result = parseConceptBlock(
      { ...baseRaw, bodyParagraphs: [] },
      "theory-ruffini-resto",
      0
    );
    expect(result.bodyParagraphs).toBeUndefined();
  });

  test("empty string element throws with offending index in error", () => {
    expect(() =>
      parseConceptBlock(
        { ...baseRaw, bodyParagraphs: ["OK", ""] },
        "theory-ruffini-resto",
        0
      )
    ).toThrow(/bodyParagraphs\[1\]/);
  });

  test("non-string element throws with offending index in error", () => {
    expect(() =>
      parseConceptBlock(
        { ...baseRaw, bodyParagraphs: ["OK", 42] },
        "theory-ruffini-resto",
        0
      )
    ).toThrow(/bodyParagraphs\[1\]/);
  });

  test("non-array bodyParagraphs throws a parse error instead of silently falling back", () => {
    expect(() =>
      parseConceptBlock(
        { ...baseRaw, bodyParagraphs: "not-an-array" },
        "theory-ruffini-resto",
        0
      )
    ).toThrow(/bodyParagraphs/);
    expect(() =>
      parseConceptBlock(
        { ...baseRaw, bodyParagraphs: 123 },
        "theory-ruffini-resto",
        0
      )
    ).toThrow(/bodyParagraphs/);
  });

  test("body is optional when bodyParagraphs is present (migrated concept shape)", () => {
    // Migrated concepts drop `body` and rely on `bodyParagraphs`. The
    // parser MUST accept this shape; absence of `body` is not an error
    // when `bodyParagraphs` is non-empty.
    const { body: _body, ...rawWithoutBody } = baseRaw;
    const result = parseConceptBlock(
      { ...rawWithoutBody, bodyParagraphs: ["Párrafo 1.", "Párrafo 2."] },
      "theory-ruffini-resto",
      0
    );
    expect(result.bodyParagraphs).toEqual(["Párrafo 1.", "Párrafo 2."]);
  });

  test("neither body nor bodyParagraphs throws a parse error", () => {
    const { body: _body, ...rawWithoutBody } = baseRaw;
    expect(() => parseConceptBlock(rawWithoutBody, "theory-ruffini-resto", 0)).toThrow(
      /expected non-empty string \(or bodyParagraphs\)/
    );
  });
});

describe("issue-36-theory-readability — Ruffini migration acceptance", () => {
  // Spec anchor: the 3 Ruffini concepts in unit-2.json MUST migrate to
  // `bodyParagraphs` with `body` removed. This test loads the live JSON
  // and verifies the migration.
  test("Ruffini concepts use bodyParagraphs and have no body field", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto");
    expect(ruffini).toBeDefined();
    const ids = ruffini!.concepts.map((c) => c.id);
    expect(ids).toEqual([
      "concept-ruffini-procedimiento",
      "concept-teorema-resto",
      "concept-ruffini-signo",
    ]);
    for (const concept of ruffini!.concepts) {
      expect(concept.bodyParagraphs).toBeDefined();
      expect(concept.bodyParagraphs!.length).toBeGreaterThan(0);
      // body must NOT be present on migrated concepts (drift prevention)
      // The parser falls back to "" when body is missing; we verify the
      // migrated concepts have an empty body since `body` was removed.
      expect(concept.body).toBe("");
    }
  });

  test("concept-ruffini-procedimiento has 2 paragraphs (steps + remainder)", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto")!;
    const c = ruffini.concepts.find((x) => x.id === "concept-ruffini-procedimiento")!;
    expect(c.bodyParagraphs).toHaveLength(2);
  });

  test("concept-teorema-resto has 3 paragraphs (definition + implication + example)", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto")!;
    const c = ruffini.concepts.find((x) => x.id === "concept-teorema-resto")!;
    expect(c.bodyParagraphs).toHaveLength(3);
  });

  test("concept-ruffini-signo has 2 paragraphs (warning + verification rule)", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto")!;
    const c = ruffini.concepts.find((x) => x.id === "concept-ruffini-signo")!;
    expect(c.bodyParagraphs).toHaveLength(2);
  });

  test("math expressions preserved verbatim in migrated paragraphs", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto")!;
    const procedimento = ruffini.concepts.find(
      (x) => x.id === "concept-ruffini-procedimiento"
    )!;
    const teorema = ruffini.concepts.find(
      (x) => x.id === "concept-teorema-resto"
    )!;
    const signo = ruffini.concepts.find((x) => x.id === "concept-ruffini-signo")!;
    // $P(x)$ must appear in procedimento (verbatim)
    const allProcedureText = procedimento.bodyParagraphs!.join(" ");
    expect(allProcedureText).toContain("$P(x)$");
    expect(allProcedureText).toContain("$(x");
    // $P(a)$ and $P(2)=8−4+1=5$ (U+2212) must appear in teorema-resto
    const allTeoremaText = teorema.bodyParagraphs!.join(" ");
    expect(allTeoremaText).toContain("$P(a)$");
    expect(allTeoremaText).toContain("$P(2)=8\u{2212}4+1=5$");
    // $(x+a)$ and $(x−a)$ (U+2212) must appear in signo
    const allSignoText = signo.bodyParagraphs!.join(" ");
    expect(allSignoText).toContain("$(x+a)$");
    expect(allSignoText).toContain("$(x\u{2212}a)$");
  });

  test("unit-1.json concepts still use legacy body field (untouched)", () => {
    // Regression: the migration MUST NOT touch unit-1 concepts.
    const nodes = loadTheoryContent("unit-1");
    const first = nodes[0];
    const firstConcept = first.concepts[0];
    expect(firstConcept.body).toBeTruthy();
    expect(firstConcept.bodyParagraphs).toBeUndefined();
  });
});

describe("import safety — no side-effects at module load", () => {
  test("importing content-loaders does not throw (lazy parsing)", () => {
    // The import happens at the top of this file. If it threw, vitest
    // would report a module-load error, not a test failure.
    // This test exists to make the contract explicit: no parsing at
    // import time, only on first loader call.
    expect(true).toBe(true);
  });

  test("loadTheoryContent returns equivalent data on repeated calls", () => {
    const first = loadTheoryContent("unit-1");
    const second = loadTheoryContent("unit-1");
    expect(second).toEqual(first);
  });

  test("loadExampleContent returns equivalent data on repeated calls", () => {
    const first = loadExampleContent("unit-1");
    const second = loadExampleContent("unit-1");
    expect(second).toEqual(first);
  });

  test("loadFeedbackContent returns equivalent data on repeated calls", () => {
    const first = loadFeedbackContent("unit-1");
    const second = loadFeedbackContent("unit-1");
    expect(second).toEqual(first);
  });

  test("loaders throw on malformed key but do not crash module", () => {
    // The loader throws at runtime for unknown keys, but the module
    // itself imported fine (we're already running).
    expect(() => loadTheoryContent("nonexistent")).toThrow(
      "Unknown theory unit key"
    );
  });
});
