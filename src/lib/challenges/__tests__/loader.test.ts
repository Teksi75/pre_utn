/**
 * Tests for challenge catalog loader and validation.
 *
 * Tests:
 * - validateChallengeEntry rejects malformed entries
 * - loadChallengesForSkill loads and validates from JSON
 * - loadChallengesForSkill returns challenges for a skill
 * - loadChallengesForUnit returns challenges for a unit
 * - loadChallengesForSkill returns only challenges for that skill
 * - clear error reporting for malformed challenges
 */

import { describe, test, expect } from "vitest";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";
import {
  validateChallengeEntry,
  loadChallengesForSkill,
  loadChallengesForUnit,
} from "../loader";
import { loadTaxonomy } from "@/domain/error-taxonomy";

// loadChallengesForSkill/Unit are thin wrappers in the domain index;
// test loadChallengesForSkill/Unit directly (same implementation).

// ---------------------------------------------------------------------------
// Fixtures — minimal valid challenge entry (used as base for invalid variants)
// ---------------------------------------------------------------------------

const VALID_CAHNNEL_TRACE_ENTRY = {
  path: "capitulo-3.ejercicio-7",
  section: "Números Complejos — Forma Polar",
  sourceUse: "canonical-source" as const,
  pedagogicalIntent: "Evalúa dominio de forma polar",
};

const VALID_BASE = {
  id: "ex.u1.complejos.desafio-01",
  skillId: "mat.u1.complejos",
  type: "multiple-choice" as const,
  difficulty: 4 as const,
  prompt: "¿Cuál es el módulo de (3 - 4i)?",
  expectedAnswer: "5",
  options: ["3", "4", "5", "7"] as string[],
  commonErrorTags: [] as string[],
  pedagogicalNote: "Módulo de complejo",
  challengeSection: true as const,
  category: "desafio" as const,
  tags: ["desafio", "integrador"] as const,
  canonicalTrace: [VALID_CAHNNEL_TRACE_ENTRY],
};

// ---------------------------------------------------------------------------
// validateChallengeEntry — valid entry passes
// ---------------------------------------------------------------------------

describe("validateChallengeEntry", () => {
  test("valid entry passes validation", () => {
    expect(() => validateChallengeEntry(VALID_BASE)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // canonicalTrace presence and structure
  // ---------------------------------------------------------------------------

  test("rejects entry missing canonicalTrace entirely", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { canonicalTrace: _removed, ...noTrace } = VALID_BASE;
    expect(() => validateChallengeEntry(noTrace)).toThrow("canonicalTrace");
  });

  test("rejects entry with empty canonicalTrace array", () => {
    const empty = { ...VALID_BASE, canonicalTrace: [] };
    expect(() => validateChallengeEntry(empty)).toThrow("canonicalTrace");
  });

  test("rejects canonicalTrace entry missing 'path' field", () => {
    const invalidTrace = [
      {
        // path missing
        section: "Números Complejos",
        sourceUse: "canonical-source",
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("path");
  });

  test("rejects canonicalTrace entry missing 'section' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        // section missing
        sourceUse: "canonical-source",
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("section");
  });

  test("rejects canonicalTrace entry missing 'sourceUse' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        // sourceUse missing
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("sourceUse");
  });

  test("rejects canonicalTrace entry missing 'pedagogicalIntent' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        sourceUse: "canonical-source",
        // pedagogicalIntent missing
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("pedagogicalIntent");
  });

  // ---------------------------------------------------------------------------
  // sourceUse values
  // ---------------------------------------------------------------------------

  test("rejects unknown sourceUse value", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        sourceUse: "unknown-value" as any,
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("sourceUse");
  });

  test("accepts all four valid sourceUse values", () => {
    const validSourceUses = [
      "canonical-source",
      "adapted",
      "calibrated-from-exam",
      "solution-pattern",
    ] as const;
    for (const sourceUse of validSourceUses) {
      const trace = [{ ...VALID_CAHNNEL_TRACE_ENTRY, sourceUse }];
      const entry = { ...VALID_BASE, canonicalTrace: trace };
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    }
  });

  // ---------------------------------------------------------------------------
  // challengeSection
  // ---------------------------------------------------------------------------

  test("rejects challengeSection !== true", () => {
    const entry = { ...VALID_BASE, challengeSection: false as any };
    expect(() => validateChallengeEntry(entry)).toThrow("challengeSection");
  });

  test("rejects missing challengeSection", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { challengeSection: _removed, ...noSection } = VALID_BASE;
    expect(() => validateChallengeEntry(noSection)).toThrow("challengeSection");
  });

  // ---------------------------------------------------------------------------
  // category
  // ---------------------------------------------------------------------------

  test("rejects category !== 'desafio'", () => {
    const entry = { ...VALID_BASE, category: "practica" as any };
    expect(() => validateChallengeEntry(entry)).toThrow("category");
  });

  test("rejects missing category", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category: _removed, ...noCategory } = VALID_BASE;
    expect(() => validateChallengeEntry(noCategory)).toThrow("category");
  });

  // ---------------------------------------------------------------------------
  // tags
  // ---------------------------------------------------------------------------

  test("rejects missing 'desafio' tag", () => {
    const entry = { ...VALID_BASE, tags: ["integrador"] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("desafio");
  });

  test("rejects missing 'integrador' tag", () => {
    const entry = { ...VALID_BASE, tags: ["desafio"] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("integrador");
  });

  test("rejects empty tags array", () => {
    const entry = { ...VALID_BASE, tags: [] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("desafio");
  });

  // ---------------------------------------------------------------------------
  // difficulty
  // ---------------------------------------------------------------------------

  test("rejects difficulty < 4", () => {
    const entry = { ...VALID_BASE, difficulty: 3 as any };
    expect(() => validateChallengeEntry(entry)).toThrow("difficulty");
  });

  test("accepts difficulty === 4", () => {
    const entry = { ...VALID_BASE, difficulty: 4 as const };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("accepts difficulty === 5", () => {
    const entry = { ...VALID_BASE, difficulty: 5 as const };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("rejects difficulty > 5", () => {
    const entry = { ...VALID_BASE, difficulty: 6 as any };
    expect(() => validateChallengeEntry(entry)).toThrow("difficulty");
  });

  // ---------------------------------------------------------------------------
  // ID format
  // ---------------------------------------------------------------------------

  test("rejects invalid ID format (missing ex. prefix)", () => {
    const entry = { ...VALID_BASE, id: "u1.complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).toThrow("id");
  });

  test("rejects invalid ID format (missing unit)", () => {
    const entry = { ...VALID_BASE, id: "ex..complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).toThrow("id");
  });

  test("accepts valid ID format ex.u1.complejos.desafio-01", () => {
    const entry = { ...VALID_BASE, id: "ex.u1.complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("accepts valid ID format ex.u2.ecuaciones_fraccionarias.desafio-01", () => {
    const entry = { ...VALID_BASE, id: "ex.u2.ecuaciones_fraccionarias.desafio-01" };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // clear error reporting
  // ---------------------------------------------------------------------------

  test("throws with descriptive error message on invalid entry", () => {
    const entry = { ...VALID_BASE, category: "wrong" as any };
    expect(() => validateChallengeEntry(entry)).toThrow(/category.*desafio/);
  });

  // ---------------------------------------------------------------------------
  // PR 2 loader hardening: expectedAnswer ∈ options, expectedAnswer non-empty string,
  // and options[i].value is a string (the previous loader mapped invalid object
  // options to `undefined` silently and never validated expectedAnswer).
  // ---------------------------------------------------------------------------

  test("multiple-choice entry: rejects expectedAnswer not in options, accepts when present", () => {
    const notInOptions = {
      ...VALID_BASE,
      expectedAnswer: "Resumen que no aparece textual en options",
      options: ["Planteo x + 2y = 45.", "Planteo x + 2y = 45; resuelvo x = 16, y = 13."],
    };
    expect(() => validateChallengeEntry(notInOptions)).toThrow(/options/);
    // VALID_BASE.expectedAnswer === "5" and options includes "5" → accept path.
    expect(() => validateChallengeEntry(VALID_BASE)).not.toThrow();
  });

  test.each([
    ["number", 42],
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
  ])("multiple-choice entry rejects non-empty-string expectedAnswer (%s)", (_label, badValue) => {
    const entry = { ...VALID_BASE, expectedAnswer: badValue as any };
    expect(() => validateChallengeEntry(entry)).toThrow(/expectedAnswer.*string/);
  });

  test("multiple-choice entry rejects object option whose value is missing or non-string", () => {
    const badOpts = [
      [{ value: 42 as any }, "other"],
      [{ label: "no value" } as any, "other"],
    ] as any[];
    for (const options of badOpts) {
      expect(() => validateChallengeEntry({ ...VALID_BASE, options })).toThrow(
        /options\[0\]\.value.*string/,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForSkill
// ---------------------------------------------------------------------------

describe("loadChallengesForSkill", () => {
  test("loads and returns challenges for a valid skillId", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    expect(Array.isArray(challenges)).toBe(true);
    expect(challenges.length).toBeGreaterThan(0);
    for (const c of challenges) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("skillId");
      expect(c).toHaveProperty("challengeSection");
      expect(c.challengeSection).toBe(true);
    }
  });

  test("returns challenge with correct ChallengeExercise shape", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    expect(challenges.length).toBeGreaterThan(0);
    const challenge = challenges[0];
    expect(challenge.challengeSection).toBe(true);
    expect(challenge.category).toBe("desafio");
    expect(challenge.tags).toContain("desafio");
    expect(challenge.tags).toContain("integrador");
    expect(Array.isArray(challenge.canonicalTrace)).toBe(true);
    expect(challenge.canonicalTrace.length).toBeGreaterThan(0);
  });

  test("returns empty array for unknown skill", () => {
    const challenges = loadChallengesForSkill("mat.u99.unknown_skill");
    expect(challenges).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForSkill
// ---------------------------------------------------------------------------

describe("loadChallengesForSkill", () => {
  test("returns only challenges for that skillId", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    for (const c of challenges) {
      expect(c.skillId).toBe("mat.u1.complejos");
    }
  });

  test("returns empty array for unknown skill", () => {
    const challenges = loadChallengesForSkill("mat.u99.unknown");
    expect(challenges).toEqual([]);
  });

  test("returns ChallengeExercise[] type", () => {
    const result = loadChallengesForSkill("mat.u1.complejos");
    // If it returns a non-empty array, check type safety
    if (result.length > 0) {
      expect(result[0].challengeSection).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForUnit
// ---------------------------------------------------------------------------

describe("loadChallengesForUnit", () => {
  test("returns only challenges for unit 1", () => {
    const challenges = loadChallengesForUnit(1);
    expect(challenges.length).toBeGreaterThan(0);
    for (const c of challenges) {
      expect(c.skillId).toMatch(/^mat\.u1\./);
    }
  });

  test("returns only challenges for unit 2", () => {
    const challenges = loadChallengesForUnit(2);
    for (const c of challenges) {
      expect(c.skillId).toMatch(/^mat\.u2\./);
    }
  });

  test("returns unit 3 modeling-transfer challenges (PR 2) + canonical-max P1l (PR 2 recuperar-u3-ecuaciones-lineales)", () => {
    const challenges = loadChallengesForUnit(3);
    // 2 modeling-transfer (fortalecer-u3) + 1 P1l (recuperar-u3-ecuaciones-lineales) = 3.
    expect(challenges.length).toBe(3);
    for (const c of challenges) {
      expect(c.skillId).toMatch(/^mat\.u3\./);
      expect(c.challengeSection).toBe(true);
      expect(c.category).toBe("desafio");
      expect(c.tags).toContain("desafio");
      expect(c.tags).toContain("integrador");
      expect(c.difficulty).toBeGreaterThanOrEqual(4);
      expect(c.canonicalTrace.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForSkill — U3 modeling-transfer target skill (PR 2)
// ---------------------------------------------------------------------------

describe("loadChallengesForSkill — mat.u3.traduccion_lenguaje_verbal", () => {
  test("returns the 2 PR 2 modeling-transfer challenges for the U3 translation skill", () => {
    const challenges = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    expect(challenges.length).toBe(2);
    for (const c of challenges) {
      expect(c.skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
      expect(c.id).toMatch(/^ex\.u3\.traduccion_lenguaje_verbal\.desafio-\d{2}$/);
      expect(c.type).toBe("multiple-choice");
      expect(c.options).toBeDefined();
      expect(c.options!.length).toBe(4);
    }
  });

  test("every multiple-choice challenge keeps expectedAnswer as exactly one of its options", () => {
    // Guards against the PR 2 fresh-review finding: the evaluator uses exact
    // matching, so a visible correct option that doesn't match expectedAnswer
    // would be graded wrong even when the student picks it.
    const challenges = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal");
    expect(challenges.length).toBe(2);
    for (const c of challenges) {
      const optionValues = (c.options ?? []).map((o) =>
        typeof o === "string" ? o : o.value
      );
      expect(optionValues).toContain(c.expectedAnswer);
    }
  });

  test("desafio-01 requires translating two distinct conditions (multi-relation setup)", () => {
    const desafio = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal")
      .find((c) => c.id === "ex.u3.traduccion_lenguaje_verbal.desafio-01");
    expect(desafio).toBeDefined();
    const prompt = desafio!.prompt;
    // Prompt must name BOTH relations and commit to a direction so the verification step is non-redundant.
    expect(prompt).toMatch(/metro de cable|precio del cable|cable/i);
    expect(prompt).toMatch(/doble.*taco|taco.*doble|2\s*\*?\s*taco/i);
    expect(prompt).toMatch(/diferencia|excede|exced|supera|mayor que|menor que|le saca|le faltan/i);
    const correct = desafio!.options!.find(
      (o) => (typeof o === "string" ? o : o.value) === desafio!.expectedAnswer,
    )!;
    const correctText = typeof correct === "string" ? correct : correct.value;
    expect(correctText).toMatch(/=/);
    expect(correctText).toMatch(/verifico/i);
    expect(correctText).toMatch(/\$|\d/);
  });

  test("desafio-02 requires verification and geometric interpretation (exam-transfer)", () => {
    const desafio = loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal")
      .find((c) => c.id === "ex.u3.traduccion_lenguaje_verbal.desafio-02");
    expect(desafio).toBeDefined();
    const prompt = desafio!.prompt;
    expect(prompt).toMatch(/per[í]metro/i);
    expect(prompt).toMatch(/triple|doble|raz[ó]n|proporci[ó]n/i);
    const correct = desafio!.options!.find(
      (o) => (typeof o === "string" ? o : o.value) === desafio!.expectedAnswer,
    )!;
    const correctText = typeof correct === "string" ? correct : correct.value;
    expect(correctText).toMatch(/verifico/i);
    expect(correctText).toMatch(/4 cm/);
    expect(correctText).toMatch(/12 cm/);
  });
});

describe("loadChallengesForSkill — mat.u3.ecuaciones_lineales (PR2 P1l challenge)", () => {
  test("U3LIN-CHAL-001..003: challenge at d=5, 4 options, adapted sourceUse, new tag, profe-digital-free", () => {
    const d = loadChallengesForSkill("mat.u3.ecuaciones_lineales")[0];
    expect([d?.difficulty, d?.options!.length, d?.challengeSection, d?.category, d?.canonicalTrace.length > 0, d?.canonicalTrace.some((t) => t.sourceUse === "adapted"), d?.commonErrorTags.includes("u3_racionalizacion_irracional")]).toEqual([5, 4, true, "desafio", true, true, true]);
    expect(d?.canonicalTrace[0].pedagogicalIntent.toLowerCase()).not.toMatch(/profe digital|tu profe|soy tu/i);
    expect(d?.tags).toEqual(expect.arrayContaining(["desafio", "integrador"]));
  });

  test("U3LIN-CHAL-005: mat.u3.traduccion_lenguaje_verbal keeps its 2 challenges", () => {
    expect(loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal").map((c) => c.id).sort()).toEqual([
      "ex.u3.traduccion_lenguaje_verbal.desafio-01",
      "ex.u3.traduccion_lenguaje_verbal.desafio-02",
    ]);
  });

  test("U3LIN-CHAL-006: Unit 3 challenge total grows from 2 to 3 (additive)", () => {
    const counts = Object.fromEntries(["mat.u3.ecuaciones_lineales", "mat.u3.traduccion_lenguaje_verbal"].map((s) => [s, loadChallengesForUnit(3).filter((c) => c.skillId === s).length]));
    expect(counts).toEqual({ "mat.u3.ecuaciones_lineales": 1, "mat.u3.traduccion_lenguaje_verbal": 2 });
  });
});
describe("U3 LIN-CHAL spec scenario coverage (PR2)", () => {
  test("U3LIN-CHAL-002 (positive): P1l challenge sourceUse is NOT 'canonical-source'", () => {
    expect(loadChallengesForSkill("mat.u3.ecuaciones_lineales")[0].canonicalTrace.map((t) => t.sourceUse)).toEqual(["adapted"]);
  });

  test("Free-text root (positive): every loaded U3 challenge is MC", () => {
    expect(loadChallengesForUnit(3).every((c) => c.type === "multiple-choice")).toBe(true);
  });

  test("Unknown tag (positive): every loaded U3 challenge's commonErrorTags resolves in taxonomy", () => {
    const taxonomyIds = new Set((loadTaxonomy() as unknown as Array<{ id: string }>).map((t) => t.id));
    expect(loadChallengesForUnit(3).flatMap((c) => c.commonErrorTags ?? []).every((tag) => taxonomyIds.has(tag))).toBe(true);
  });

  test("Non-Spanish fragment (positive): P1l pedagogical fields carry Spanish markers", () => {
    const d = loadChallengesForSkill("mat.u3.ecuaciones_lineales")[0];
    const SPANISH = /[áéíóúñü¿¡]|racionaliz|resuelv|verific|aislad|distractor|correcto/i;
    expect(SPANISH.test(d.pedagogicalNote) && SPANISH.test(d.canonicalTrace[0].pedagogicalIntent)).toBe(true);
  });
});

describe("validateChallengeEntry — strict loader rejection on invalid fixtures (PR2 remediation)", () => {
  test("U3LIN-CHAL-002: canonical-source on canonical P1l PDF path is REJECTED", () => {
    // CANONICAL_P1L_PROMPT is the literal/verbatim P1l prompt from PDF 03_ej_utn.pdf (bare equation form); Autonomous P1l Decision: verbatim reproduction forbidden.
    const CANONICAL_P1L_PROMPT = "Resolver (3+√5)·x = 14 + 6√5, hallar x.";
    const verbatim = { ...VALID_BASE, id: "ex.u3.ecuaciones_lineales.desafio-01", skillId: "mat.u3.ecuaciones_lineales", prompt: CANONICAL_P1L_PROMPT,
      canonicalTrace: [{ ...VALID_CAHNNEL_TRACE_ENTRY, path: "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf", sourceUse: "canonical-source" as const, pedagogicalIntent: "Adaptar ítem canónico P1l a la app." }] };
    expect(() => validateChallengeEntry(verbatim)).toThrow(/canonical-source|verbatim|adapt/i);
  });
  test("free-text root rejected: type='numerical' is REJECTED (AGENTS.md)", () => {
    expect(() => validateChallengeEntry({ ...VALID_BASE, type: "numerical" as any })).toThrow(/multiple-choice|type/i);
  });
  test("unknown error tag rejected: undeclared commonErrorTag for U3 is REJECTED by taxonomy", () => {
    expect(() => validateChallengeEntry({ ...VALID_BASE, id: "ex.u3.ecuaciones_lineales.desafio-01", skillId: "mat.u3.ecuaciones_lineales", commonErrorTags: ["u3_esta_tag_no_existe_en_taxonomy"] })).toThrow(/taxonomy|undeclared|commonErrorTag/i);
  });
  test("non-Spanish fragment rejected: pedagogical fields without Spanish markers are REJECTED", () => {
    expect(() => validateChallengeEntry({ ...VALID_BASE, pedagogicalNote: "Rationalize the coefficient.",
      canonicalTrace: [{ ...VALID_CAHNNEL_TRACE_ENTRY, pedagogicalIntent: "Adapt P1l PDF item for app." }] })).toThrow(/spanish|non-spanish|marker/i);
  });
});
