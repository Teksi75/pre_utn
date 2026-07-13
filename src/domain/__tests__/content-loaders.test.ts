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
  parseTheoryNode,
  parseWorkedExample,
} from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";
import { assertSignChart } from "../visuals/__tests__/helpers";

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

  // parseExerciseId boundary contract — characterization only (no regex inspection).
  // GGA finding reproduction: parseExerciseId introduces domain validation without
  // focused tests covering valid and malformed IDs. The 6 cases below exercise the
  // regex accept branch (2 real catalog IDs) and four distinct rejection branches
  // without modifying production code, regex, or exports.
  describe("parseExerciseId boundary contract", () => {
    test.each(["ex.u3.operaciones_polinomios.4", "ex.u1.conjuntos_numericos.cn-per-01"])(
      "accepts valid id: %s",
      (id) => expect(applyExerciseDefaults({ ...baseRaw, id }).id).toBe(id)
    );
    test.each(["exx.u3.polinomios.1", "ex.u7.polinomios.1", "ex.u3..1", "ex.u3.polinomios."])(
      "rejects malformed id: %s",
      (id) =>
        expect(() => applyExerciseDefaults({ ...baseRaw, id })).toThrow(
          /invalid ExerciseId format/
        )
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
    // loadSkillBank resolves per-skill feedback first; replicate that
    // resolution for the direct call so the triangulation stays exact.
    const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
    const directDiagnostics = validatePracticeBank(SKILL_ID, exercises, feedback);
    const banked = loadSkillBank(SKILL_ID);
    expect(banked.diagnostics).toEqual(directDiagnostics);
  });

  test("resolves per-skill feedback for conjuntos_numericos", () => {
    // When a dedicated per-skill feedback file exists (unit-1-conjuntos-numericos),
    // loadSkillBank must use it instead of the generic unit-1 fallback.
    // The per-skill file has a focused subset of tags — tags only in unit-1.json
    // (e.g. u1_confunde_natural_entero) are correctly flagged as uncovered.
    const banked = loadSkillBank(SKILL_ID);
    // Per-skill feedback has 10 entries. Exercises that reference tags
    // outside this set produce diagnostics — intentional: the per-skill
    // file is the authoritative source for this skill.
    expect(banked.diagnostics.length).toBeGreaterThan(0);
    // Verify the diagnostics are feedback-coverage messages, not
    // category-minimum or other issues.
    for (const diag of banked.diagnostics) {
      expect(diag).toContain("without feedback");
    }
  });

  test("falls back to unit-level feedback when no per-skill file exists", () => {
    // mat.u1.propiedades_operaciones_reales has no dedicated per-skill
    // feedback file in RAW_REGISTRY. loadSkillBank must fall back to
    // unit-1 feedback.
    const banked = loadSkillBank("mat.u1.propiedades_operaciones_reales");
    expect(banked.exercises.length).toBeGreaterThanOrEqual(4);
    // The bank may have diagnostics (category counts, etc.) but the key
    // assertion is that it loads without throwing — the fallback works.
    expect(banked).toHaveProperty("diagnostics");
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

    test("'concept-op-division' uses the canonical 'División de polinomios' title (rename regression guard)", () => {
      // Regression guard for the section-card-topic-count content rename:
      // the concept title was shortened from
      // "3. División larga de polinomios (procedimiento)" to
      // "3. División de polinomios". This is a focused data assertion
      // that goes through the domain loader (loadTheoryContent) and
      // asserts on the parsed ConceptBlock.title field — it does NOT
      // read the JSON file directly, so it is not a source-regex test.
      const theory = loadTheoryContent("unit-2");
      const operaciones = theory.find(
        (n) => n.skillId === "mat.u2.operaciones_polinomios",
      );
      expect(
        operaciones,
        "operaciones_polinomios node not found in unit-2 theory",
      ).toBeDefined();
      const divisionConcept = operaciones!.concepts.find(
        (c) => c.id === "concept-op-division",
      );
      expect(
        divisionConcept,
        "concept-op-division not found in operaciones_polinomios.concepts",
      ).toBeDefined();
      // Positive: the renamed title is in effect.
      expect(divisionConcept!.title).toBe("3. División de polinomios");
      // Negative: the old verbose form must not leak back in.
      expect(divisionConcept!.title).not.toMatch(/División larga de polinomios/);
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
    // Regression: the migration MUST NOT touch SHORT unit-1 concepts.
    // Long unit-1 concepts (body > 350 chars) are migrated in
    // `migrate-all-theory-paragraphs`. Short concepts must keep `body`.
    const nodes = loadTheoryContent("unit-1");
    const firstNode = nodes[0];
    // `concept-familia-conjuntos-numericos` is a short concept (not migrated).
    const shortConcept = firstNode.concepts.find(
      (c) => c.id === "concept-familia-conjuntos-numericos"
    );
    expect(shortConcept).toBeDefined();
    expect(shortConcept!.body).toBeTruthy();
    expect(shortConcept!.bodyParagraphs).toBeUndefined();
  });
});

describe("migrate-all-theory-paragraphs — full catalog smoke", () => {
  // Spec anchor: every long concept (body > 350 chars) in unit-1.json and
  // unit-2.json MUST use `bodyParagraphs` (2+ non-empty chunks) and MUST
  // NOT keep `body`. Short concepts (body <= 350 chars) MUST keep `body`
  // and MUST NOT have `bodyParagraphs`.
  //
  // Inventory (per the tasks artifact):
  //   unit-1: 21 migrated concepts (across 5 theory nodes)
  //   unit-2: 17 new migrated concepts (plus 3 Ruffini shipped in #36) = 20 total

  const MIGRATED_U1_IDS: readonly string[] = [
    "concept-conjuntos-introduccion",
    "concept-lenguaje-basico-conjuntos",
    "concept-pertenencia-vs-inclusion",
    "concept-operaciones-conjuntos",
    "concept-mapa-inclusion",
    "concept-error-comun-correccion",
    "concept-cierre-dominio",
    "concept-fraccion-equivalente",
    "concept-coeficiente-en-denominador",
    "concept-binomio-conjugado",
    "concept-binomio-doble-conjugado",
    "concept-cierre-racionalizacion",
    "concept-conversion-log-exponencial",
    "concept-i-definicion",
    "concept-forma-estandar",
    "concept-partes-real-imaginaria",
    "concept-suma-resta",
    "concept-multiplicacion",
    "concept-conjugado",
    "concept-division",
    "concept-potencias-i",
  ];

  const MIGRATED_U2_IDS: readonly string[] = [
    "concept-op-multiplicacion",
    "concept-op-division",
    "concept-fac-factor-comun",
    "concept-fac-grupos",
    "concept-fac-tcp",
    "concept-fac-cubo-perfecto",
    "concept-fac-potencias-igual-grado",
    "concept-fac-trinomio-segundo-grado",
    "concept-fac-formula-general-discriminante",
    "concept-gauss-enunciado",
    "concept-gauss-algoritmo",
    "concept-gauss-ejemplo",
    "concept-mcm-mcd-definicion",
    "concept-mcm-mcd-algoritmo",
    "concept-mcm-mcd-ejemplo",
    "concept-ec-frac-dominio",
    "concept-ec-frac-procedimiento",
    "concept-ec-frac-sin-solucion",
  ];

  function findConcept(unitKey: "unit-1" | "unit-2", conceptId: string) {
    const nodes = loadTheoryContent(unitKey);
    for (const node of nodes) {
      const found = node.concepts.find((c) => c.id === conceptId);
      if (found) return found;
    }
    return undefined;
  }

  test("unit-1: all 21 long concepts use bodyParagraphs and have no body field", () => {
    expect(MIGRATED_U1_IDS).toHaveLength(21);
    for (const id of MIGRATED_U1_IDS) {
      const concept = findConcept("unit-1", id);
      expect(concept, `concept ${id} not found in unit-1`).toBeDefined();
      // Migrated concepts: bodyParagraphs defined, body removed
      expect(concept!.bodyParagraphs, `${id} should have bodyParagraphs`).toBeDefined();
      expect(concept!.bodyParagraphs!.length, `${id} should have >=2 paragraphs`).toBeGreaterThanOrEqual(2);
      expect(concept!.bodyParagraphs!.length, `${id} should have <=4 paragraphs`).toBeLessThanOrEqual(4);
      // No concept may have both body and bodyParagraphs
      expect(concept!.body, `${id} should have empty body`).toBe("");
    }
  });

  test("unit-2: all 18 new long concepts use bodyParagraphs and have no body field", () => {
    expect(MIGRATED_U2_IDS).toHaveLength(18);
    // issue-42-powers-same-degree: concept-fac-potencias-igual-grado is the
    // only concept in unit-2 that may carry 5-10 paragraphs (the spec for the
    // Caso 6 pedagogical bridge). All other migrated concepts stay within
    // the 2-4 paragraph cap from the original migration contract.
    // refine-issue-42-ruffini-monic-callout: the cap relaxes from 5-6 to 5-10
    // for this concept to accommodate the KaTeX array table, the "resto es 0"
    // closure, the explicit cociente line, the "Importante:" monic-factor
    // callout, and the divide-by-2 reconciliation.
    const EXPANDED_U2_IDS = new Set(["concept-fac-potencias-igual-grado"]);
    for (const id of MIGRATED_U2_IDS) {
      const concept = findConcept("unit-2", id);
      expect(concept, `concept ${id} not found in unit-2`).toBeDefined();
      expect(concept!.bodyParagraphs, `${id} should have bodyParagraphs`).toBeDefined();
      expect(concept!.bodyParagraphs!.length, `${id} should have >=2 paragraphs`).toBeGreaterThanOrEqual(2);
      if (EXPANDED_U2_IDS.has(id)) {
        // Spec: 5-10 paragraphs for the Caso 6 bridge with Ruffini visual table.
        expect(concept!.bodyParagraphs!.length, `${id} should have <=10 paragraphs`).toBeLessThanOrEqual(10);
      } else {
        expect(concept!.bodyParagraphs!.length, `${id} should have <=4 paragraphs`).toBeLessThanOrEqual(4);
      }
      expect(concept!.body, `${id} should have empty body`).toBe("");
    }
  });

  test("unit-2: all Ruffini concepts still use bodyParagraphs (no regression)", () => {
    // The 3 Ruffini concepts were migrated in issue-36 (#e20b7a9).
    // They MUST still be migrated after this change.
    for (const id of [
      "concept-ruffini-procedimiento",
      "concept-teorema-resto",
      "concept-ruffini-signo",
    ]) {
      const concept = findConcept("unit-2", id);
      expect(concept, `Ruffini concept ${id} not found`).toBeDefined();
      expect(concept!.bodyParagraphs).toBeDefined();
      expect(concept!.bodyParagraphs!.length).toBeGreaterThanOrEqual(2);
      expect(concept!.body).toBe("");
    }
  });

  test("every bodyParagraphs chunk is a non-empty string", () => {
    const allIds = [...MIGRATED_U1_IDS, ...MIGRATED_U2_IDS];
    for (const id of allIds) {
      const unitKey = MIGRATED_U1_IDS.includes(id) ? "unit-1" : "unit-2";
      const concept = findConcept(unitKey, id)!;
      for (let i = 0; i < concept.bodyParagraphs!.length; i++) {
        const chunk = concept.bodyParagraphs![i];
        expect(typeof chunk, `${id}[${i}] should be string`).toBe("string");
        expect(chunk.trim().length, `${id}[${i}] should be non-empty`).toBeGreaterThan(0);
      }
    }
  });

  test("no concept has both body and bodyParagraphs set", () => {
    const allIds = [...MIGRATED_U1_IDS, ...MIGRATED_U2_IDS];
    for (const id of allIds) {
      const unitKey = MIGRATED_U1_IDS.includes(id) ? "unit-1" : "unit-2";
      const concept = findConcept(unitKey, id)!;
      const hasBody = concept.body.length > 0;
      const hasParagraphs = Array.isArray(concept.bodyParagraphs) && concept.bodyParagraphs.length > 0;
      expect(hasBody && hasParagraphs, `${id} has both body and bodyParagraphs`).toBe(false);
    }
  });

  test("short concepts in unit-1 still use legacy body field (untouched)", () => {
    // Sanity check: a known short concept must NOT have bodyParagraphs.
    const nodes = loadTheoryContent("unit-1");
    const allU1Concepts = nodes.flatMap((n) => n.concepts);
    const short = allU1Concepts.filter(
      (c) => !MIGRATED_U1_IDS.includes(c.id)
    );
    expect(short.length, "expected some short concepts in unit-1").toBeGreaterThan(0);
    for (const c of short) {
      expect(c.body.length, `${c.id} (short) should have non-empty body`).toBeGreaterThan(0);
      expect(c.bodyParagraphs, `${c.id} (short) should NOT have bodyParagraphs`).toBeUndefined();
    }
  });

  test("short concepts in unit-2 still use legacy body field (untouched)", () => {
    const nodes = loadTheoryContent("unit-2");
    const allU2Concepts = nodes.flatMap((n) => n.concepts);
    const short = allU2Concepts.filter(
      (c) => !MIGRATED_U2_IDS.includes(c.id) && ![
        "concept-ruffini-procedimiento",
        "concept-teorema-resto",
        "concept-ruffini-signo",
      ].includes(c.id)
    );
    expect(short.length, "expected some short concepts in unit-2").toBeGreaterThan(0);
    for (const c of short) {
      expect(c.body.length, `${c.id} (short) should have non-empty body`).toBeGreaterThan(0);
      expect(c.bodyParagraphs, `${c.id} (short) should NOT have bodyParagraphs`).toBeUndefined();
    }
  });

  test("migrated concept preserves KaTeX tokens verbatim in bodyParagraphs", () => {
    // Spec anchor: KaTeX tokens like $\\in$, $\\subset$, $\\sqrt{2}$ must be
    // preserved character-for-character in the migrated paragraphs.
    const pertenencia = findConcept("unit-1", "concept-pertenencia-vs-inclusion")!;
    const all = pertenencia.bodyParagraphs!.join(" ");
    expect(all).toContain("$\\in$");
    expect(all).toContain("$\\subset$");
    expect(all).toContain("$\\sqrt{2}$");
    expect(all).toContain("$\\mathbb{N}$");
  });

  test("migrated concept fac-trinomio-segundo-grado preserves polynomial KaTeX", () => {
    const tsg = findConcept("unit-2", "concept-fac-trinomio-segundo-grado")!;
    const all = tsg.bodyParagraphs!.join(" ");
    // Source uses Unicode superscript ² — preserved verbatim per spec.
    expect(all).toContain("ax² + bx + c");
    expect(all).toContain("(x − 2)(x − 3)");
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

describe("u3-visualizaciones-pedagogicas — visualExamples loader wiring", () => {
  const baseVisual: Record<string, unknown> = {
    id: "vis-1",
    kind: "sign-chart",
    title: "Tabla de signos",
    ariaLabel: "Tabla de signos de x menos 2",
    description: "La expresión es positiva antes de 2 y negativa después.",
    variable: "x",
    expression: "x - 2",
    zeros: [2],
    excludedPoints: [],
    signZones: [
      { lowerBound: null, upperBound: 2, sign: "-" },
      { lowerBound: 2, upperBound: null, sign: "+" },
    ],
  };

  const baseTheoryRaw: Record<string, unknown> = {
    id: "theory-u3-test",
    skillId: "mat.u3.inecuaciones_lineales",
    notation: ["x"],
    commonMistakes: ["olvidar invertir desigualdad"],
    practicePrompts: ["resolver 2x > 4"],
    canonicalTrace: [{ path: "test", sourceUse: "reference", pedagogicalIntent: "test" }],
  };

  const baseExampleRaw: Record<string, unknown> = {
    id: "example-u3-test",
    skillId: "mat.u3.inecuaciones_lineales",
    problem: "Resolver 2x > 4",
    finalAnswer: "x > 2",
    pedagogicalNote: "Nota",
    canonicalTrace: [{ path: "test", sourceUse: "reference", pedagogicalIntent: "test" }],
  };

  test("parseConceptBlock preserves valid concept-level visualExamples", () => {
    const raw = {
      id: "concept-u3-test",
      title: "Concepto con visual",
      body: "Cuerpo",
      visualExamples: [baseVisual],
    };
    const result = parseConceptBlock(raw, "theory-u3-test", 0);
    expect(result.visualExamples).toHaveLength(1);
    const visual = assertSignChart(result.visualExamples![0]);
    expect(visual.expression).toBe("x - 2");
    expect(visual.criticalPoints).toEqual([2]);
  });

  test("parseConceptBlock rejects malformed concept-level visualExamples", () => {
    const raw = {
      id: "concept-u3-test",
      title: "Concepto con visual",
      body: "Cuerpo",
      visualExamples: { kind: "sign-chart" },
    };
    expect(() => parseConceptBlock(raw, "theory-u3-test", 0)).toThrow(/visualExamples/);
  });

  test("parseConceptBlock rejects explicit null concept-level visualExamples", () => {
    const raw = {
      id: "concept-u3-test",
      title: "Concepto con visual",
      body: "Cuerpo",
      visualExamples: null,
    };
    expect(() => parseConceptBlock(raw, "theory-u3-test", 0)).toThrow(/visualExamples/);
  });

  test("parseTheoryNode preserves valid node-level visualExamples", () => {
    const raw = {
      ...baseTheoryRaw,
      visualExamples: [baseVisual],
    };
    const result = parseTheoryNode(raw, 0);
    expect(result.visualExamples).toHaveLength(1);
    expect(result.visualExamples![0].kind).toBe("sign-chart");
  });

  test("parseTheoryNode rejects malformed node-level visualExamples", () => {
    const raw = {
      ...baseTheoryRaw,
      visualExamples: "not-an-array",
    };
    expect(() => parseTheoryNode(raw, 0)).toThrow(/visualExamples/);
  });

  test("parseTheoryNode rejects explicit null node-level visualExamples", () => {
    const raw = {
      ...baseTheoryRaw,
      visualExamples: null,
    };
    expect(() => parseTheoryNode(raw, 0)).toThrow(/visualExamples/);
  });

  test("parseWorkedExample preserves valid step-level visualExamples", () => {
    const raw = {
      ...baseExampleRaw,
      steps: [
        {
          order: 1,
          explanation: "Paso uno",
          visualExamples: [baseVisual],
        },
        {
          order: 2,
          explanation: "Paso dos",
        },
      ],
    };
    const result = parseWorkedExample(raw, 0);
    expect(result.steps[0].visualExamples).toHaveLength(1);
    expect(result.steps[0].visualExamples![0].kind).toBe("sign-chart");
    expect(result.steps[1].visualExamples).toBeUndefined();
  });

  test("parseWorkedExample rejects malformed step-level visualExamples", () => {
    const raw = {
      ...baseExampleRaw,
      steps: [
        {
          order: 1,
          explanation: "Paso uno",
          visualExamples: { kind: "sign-chart" },
        },
        {
          order: 2,
          explanation: "Paso dos",
        },
      ],
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow(/visualExamples/);
  });

  test("parseWorkedExample rejects explicit null step-level visualExamples", () => {
    const raw = {
      ...baseExampleRaw,
      steps: [
        {
          order: 1,
          explanation: "Paso uno",
          visualExamples: null,
        },
        {
          order: 2,
          explanation: "Paso dos",
        },
      ],
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow(/visualExamples/);
  });

  test("U3 theory and examples load without breaking existing content", () => {
    // Backward-compat guard: U3 JSON currently has no visualExamples, but the
    // wiring must not throw and must preserve existing shape.
    expect(() => loadTheoryContent("unit-3")).not.toThrow();
    expect(() => loadExampleContent("unit-3")).not.toThrow();
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    expect(theory.length).toBeGreaterThan(0);
    expect(examples.length).toBeGreaterThan(0);
  });
});
