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
import {
  validateChallengeEntry,
  loadChallengesForSkill,
  loadChallengesForUnit,
} from "../loader";

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

  test("rejects tags with extra entries beyond desafio/integrador", () => {
    const entry = { ...VALID_BASE, tags: ["desafio", "integrador", "extra"] as unknown as readonly ["desafio", "integrador"] };
    expect(() => validateChallengeEntry(entry)).toThrow(/tags/);
  });

  test("rejects tags with reversed order (integrador before desafio)", () => {
    const entry = { ...VALID_BASE, tags: ["integrador", "desafio"] as unknown as readonly ["desafio", "integrador"] };
    expect(() => validateChallengeEntry(entry)).toThrow(/tags/);
  });

  test("rejects tags that contain desafio/integrador but also duplicate desafio", () => {
    const entry = { ...VALID_BASE, tags: ["desafio", "integrador", "desafio"] as unknown as readonly ["desafio", "integrador"] };
    expect(() => validateChallengeEntry(entry)).toThrow(/tags/);
  });

  test("accepts tags exactly equal to ['desafio','integrador']", () => {
    const entry = { ...VALID_BASE, tags: ["desafio", "integrador"] as const };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // canonicalTrace — empty/whitespace rejection (path/section/pedagogicalIntent)
  // ---------------------------------------------------------------------------

  test("rejects canonicalTrace entry with empty whitespace string for path", () => {
    const entry = {
      ...VALID_BASE,
      canonicalTrace: [{ ...VALID_CAHNNEL_TRACE_ENTRY, path: "   " }],
    };
    expect(() => validateChallengeEntry(entry)).toThrow(/path/);
  });

  test("rejects canonicalTrace entry with empty whitespace string for section", () => {
    const entry = {
      ...VALID_BASE,
      canonicalTrace: [{ ...VALID_CAHNNEL_TRACE_ENTRY, section: "   " }],
    };
    expect(() => validateChallengeEntry(entry)).toThrow(/section/);
  });

  test("rejects canonicalTrace entry with empty whitespace string for pedagogicalIntent", () => {
    const entry = {
      ...VALID_BASE,
      canonicalTrace: [{ ...VALID_CAHNNEL_TRACE_ENTRY, pedagogicalIntent: "   " }],
    };
    expect(() => validateChallengeEntry(entry)).toThrow(/pedagogicalIntent/);
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

  // -------------------------------------------------------------------------
  // PR 3 loader hardening: non-MC challenge answer shape must reject the
  // AGENTS.md-prohibited structured mathematical free-text patterns. Each
  // prohibited pattern would otherwise force the student to type one of
  // these structured math expressions into a fill-blank (or be graded via
  // exact-match on an exact-matched whole-expression string in another
  // non-MC type), which AGENTS.md forbids:
  //
  //   - raíces (roots)
  //   - fracciones con raíces
  //   - intervalos (notation requiring brackets / parenthesis)
  //   - conjuntos solución con unión o intersección
  //   - números complejos en forma `a+bi`
  //   - dos soluciones del tipo `x = -2` o `x = 2`
  //   - expresiones logarítmicas completas
  //
  // REGRESSION FOR GGA BLOCKER (loader non-MC shape):
  // The previous loader validated MC options / expectedAnswer but left
  // non-MC types (`fill-blank`, `true-false`, `numerical`, etc.) unchecked,
  // so a fill-blank challenge could ship with an `expectedAnswer` like
  // `"√2"` or `"[-1, 1]"` or `"x = -2 o x = 2"` — each a prohibited pattern
  // that forces free-text structured math. This loader MUST fail fast at
  // module initialization when such a challenge entry is present, before
  // any evaluator renders it.
  // -------------------------------------------------------------------------

  /**
   * Minimal VALID_BASE without the `options` / multiple-choice binding so
   * each non-MC validation test can override `type` and `expectedAnswer` to
   * the specific prohibited pattern under test.
   */
  function makeNonMcEntry(overrides: Record<string, unknown>): Record<string, unknown> {
    const base: Record<string, unknown> = { ...VALID_BASE };
    delete base["options"]; // non-MC entries must not carry options
    return { ...base, ...overrides };
  }

  test("fill-blank rejects expectedAnswer containing a square root", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "√2",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|√|sqrt|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing \\sqrt (LaTeX-form root)", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "\\sqrt{2}",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|sqrt|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing an interval notation", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "[-1, 1]",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|interval|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing a two-solution form `x = -2 o x = 2`", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "x = -2 o x = 2",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|two solutions|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing a logarithmic expression", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "log_2(8)",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|logarithm|log|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing a complex number `a+bi` form", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "2+3i",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|complex|structured|prohibited/i,
    );
  });

  test("fill-blank rejects expectedAnswer containing a union set operation", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "(-∞, 1) ∪ (1, ∞)",
    });
    expect(() => validateChallengeEntry(entry)).toThrow(
      /fill-blank|expectedAnswer|union|∪|structured|prohibited/i,
    );
  });

  test("fill-blank accepts a SIMPLE non-prohibited expectedAnswer (e.g. plain number)", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "5",
    });
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("fill-blank accepts a simple word expectedAnswer", () => {
    const entry = makeNonMcEntry({
      type: "fill-blank",
      expectedAnswer: "Verdadero",
    });
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // GGA BLOCKER FIX — full required-field validation
  // -------------------------------------------------------------------------
  //
  // The previous loader accepted entries with missing skillId / prompt /
  // commonErrorTags / pedagogicalNote / unit because none of those
  // fields were type-checked before the final `as unknown as
  // ChallengeExercise` cast. Each of these tests pins the contract
  // documented in the loader: every required ChallengeExercise field
  // must be validated before the cast, so the returned record is
  // genuinely well-typed (no unjustified cast).

  describe("GGA BLOCKER — full required-field validation", () => {
    test("rejects entry missing skillId", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { skillId: _drop, ...rest } = VALID_BASE;
      void _drop;
      expect(() => validateChallengeEntry(rest)).toThrow(/skillId/);
    });

    test("rejects entry with non-string skillId", () => {
      const entry = { ...VALID_BASE, skillId: 42 as unknown as string };
      expect(() => validateChallengeEntry(entry)).toThrow(/skillId/);
    });

    test("rejects entry with skillId that does not match mat.uN... pattern", () => {
      const entry = { ...VALID_BASE, skillId: "not-a-skill-id" };
      expect(() => validateChallengeEntry(entry)).toThrow(/skillId/);
    });

    test("rejects entry missing prompt", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { prompt: _drop, ...rest } = VALID_BASE;
      void _drop;
      expect(() => validateChallengeEntry(rest)).toThrow(/prompt/);
    });

    test("rejects entry with empty prompt", () => {
      const entry = { ...VALID_BASE, prompt: "   " };
      expect(() => validateChallengeEntry(entry)).toThrow(/prompt/);
    });

    test("rejects entry with non-string prompt", () => {
      const entry = { ...VALID_BASE, prompt: 42 as unknown as string };
      expect(() => validateChallengeEntry(entry)).toThrow(/prompt/);
    });

    test("rejects entry missing commonErrorTags", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { commonErrorTags: _drop, ...rest } = VALID_BASE;
      void _drop;
      expect(() => validateChallengeEntry(rest)).toThrow(/commonErrorTags/);
    });

    test("rejects entry with commonErrorTags that is not an array", () => {
      const entry = { ...VALID_BASE, commonErrorTags: "tag1" as unknown as string[] };
      expect(() => validateChallengeEntry(entry)).toThrow(/commonErrorTags/);
    });

    test("rejects entry with non-string commonErrorTags entry", () => {
      const entry = { ...VALID_BASE, commonErrorTags: [42] as unknown as string[] };
      expect(() => validateChallengeEntry(entry)).toThrow(/commonErrorTags\[0\]/);
    });

    test("rejects entry missing pedagogicalNote", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pedagogicalNote: _drop, ...rest } = VALID_BASE;
      void _drop;
      expect(() => validateChallengeEntry(rest)).toThrow(/pedagogicalNote/);
    });

    test("rejects entry with non-string pedagogicalNote", () => {
      const entry = { ...VALID_BASE, pedagogicalNote: 42 as unknown as string };
      expect(() => validateChallengeEntry(entry)).toThrow(/pedagogicalNote/);
    });

    test("rejects entry whose unit field disagrees with the unit derived from skillId", () => {
      const entry = { ...VALID_BASE, unit: 99 as unknown as number };
      expect(() => validateChallengeEntry(entry)).toThrow(/unit/);
    });

    test("rejects entry with non-integer unit", () => {
      const entry = { ...VALID_BASE, unit: 1.5 as unknown as number };
      expect(() => validateChallengeEntry(entry)).toThrow(/unit/);
    });

    test("accepts entry whose unit field matches the unit derived from skillId", () => {
      // VALID_BASE.skillId is "mat.u1.complejos" → unit 1
      const entry = { ...VALID_BASE, unit: 1 as unknown as number };
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("returned entry carries a typed unit (no unjustified cast)", () => {
      // JSON entries in the catalog do NOT carry an explicit unit field.
      // The loader must inject it from skillId so the returned record
      // genuinely satisfies the typed ChallengeExercise contract.
      const parsed = validateChallengeEntry(VALID_BASE);
      expect(parsed.unit).toBe(1);
      expect(typeof parsed.unit).toBe("number");
      expect(Number.isInteger(parsed.unit)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // GGA BLOCKER FIX — non-MC expectedAnswer per-type shape
  // -------------------------------------------------------------------------
  //
  // The previous loader only validated fill-blank's prohibited-pattern
  // guard; other non-MC types (`numerical`, `true-false`, `matching`,
  // `ordering`, `graphical`) shipped unchecked. The new contract
  // requires every non-MC type to validate that expectedAnswer is a
  // non-empty string AND matches the documented per-type shape:
  //   - numerical       → finite scalar (no sets, no equations, no multi-value)
  //   - true-false      → "Verdadero" | "Falso" | "true" | "false"
  //   - fill-blank      → AGENTS.md-prohibited shapes are rejected
  //   - matching / ordering / graphical → non-empty string

  describe("GGA BLOCKER — non-MC expectedAnswer per-type shape", () => {
    test("numerical: rejects non-empty expectedAnswer that is not a scalar", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "1, 2", // comma-separated list — not a scalar
      });
      expect(() => validateChallengeEntry(entry)).toThrow(
        /numerical.*scalar|sets, ranges/i,
      );
    });

    test("numerical: rejects structured-math expectedAnswer (set notation)", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "{1, 2}",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/numerical/);
    });

    test("numerical: rejects equation-shaped expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "x = 5",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/numerical/);
    });

    test("numerical: rejects interval-shaped expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "(-1, 1)",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/numerical/);
    });

    test("numerical: accepts a plain integer scalar expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "42",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("numerical: accepts a decimal scalar expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "-3.14",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("numerical: accepts a negative scalar expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "-7",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("numerical: rejects empty expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "numerical",
        expectedAnswer: "",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/numerical/);
    });

    test("true-false: rejects non-literal expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "true-false",
        expectedAnswer: "Maybe",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/true-false/);
    });

    test("true-false: rejects empty expectedAnswer", () => {
      const entry = makeNonMcEntry({
        type: "true-false",
        expectedAnswer: "",
      });
      expect(() => validateChallengeEntry(entry)).toThrow(/true-false/);
    });

    test("true-false: accepts 'Verdadero'", () => {
      const entry = makeNonMcEntry({
        type: "true-false",
        expectedAnswer: "Verdadero",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("true-false: accepts 'Falso'", () => {
      const entry = makeNonMcEntry({
        type: "true-false",
        expectedAnswer: "Falso",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    test("true-false: accepts 'true' (English literal)", () => {
      const entry = makeNonMcEntry({
        type: "true-false",
        expectedAnswer: "true",
      });
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    });

    // The `matching` / `ordering` / `graphical` types are listed in the
    // exercise type union (`ExerciseType`) for FUTURE structured controls,
    // but the challenge loader does NOT yet have structured controls or
    // evaluators for them. Per the minimal-safe approach, the loader
    // rejects these types up front at module-init time so a malformed
    // entry fails fast instead of silently shipping with an unsafe /
    // manual-review input surface. The type-whitelist check rejects
    // BEFORE the per-type `expectedAnswer` shape validator runs, so
    // any value — including an apparently-valid string — is thrown.
    test.each(["matching", "ordering", "graphical"] as const)(
      "%s: rejects empty expectedAnswer (type-whitelist catches first)",
      (type) => {
        const entry = makeNonMcEntry({ type, expectedAnswer: "" });
        expect(() => validateChallengeEntry(entry)).toThrow(/type/);
      },
    );

    test.each(["matching", "ordering", "graphical"] as const)(
      "%s: rejects non-string expectedAnswer (type-whitelist catches first)",
      (type) => {
        const entry = makeNonMcEntry({
          type,
          expectedAnswer: 42 as unknown as string,
        });
        expect(() => validateChallengeEntry(entry)).toThrow(/type/);
      },
    );

    test.each(["matching", "ordering", "graphical"] as const)(
      "%s: rejects a non-empty string expectedAnswer (structured controls/evaluator absent)",
      (type) => {
        // Even though the value is a well-formed non-empty string, the
        // loader MUST reject the entry because structured controls and an
        // evaluator for this type don't exist yet. Shipping it would put
        // it in the manual-review bucket.
        const entry = makeNonMcEntry({
          type,
          expectedAnswer: "any-shape-ok",
        });
        expect(() => validateChallengeEntry(entry)).toThrow(/type/);
      },
    );
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

  test("returns unit 3 challenges (PR 2 translation + S1a lineales + S1b cuadraticas + S3 P8 + S5 P9 + S6 P21)", () => {
    // PR 2 added the 2 translation desafios; S1a of
    // align-u3-practice-official-exercises adds the lineales desafio
    // (P1l diff-5 MC). S1b adds the cuadraticas desafio (P6b/P6f diff-5 MC).
    // S3 adds the P8 desafio (P8g/P8b contrast diff-5 MC).
    // S5 adds the P9 desafio (P9v full sign chart diff-5 MC).
    // S6 adds the P21 desafio (parameter-k family 2kx − 5y + 2k + 3 = 0 diff-5 MC).
    // The pre-PR-2 count was 0; post-PR2 it became 2; post-S1a it is 3;
    // post-S1b it is 4; post-S3 it is 5; post-S5 it is 6; post-S6 it is 7.
    const challenges = loadChallengesForUnit(3);
    expect(challenges.length).toBe(7);
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
    expect(prompt).toMatch(/per[ií]metro/i);
    expect(prompt).toMatch(/triple|doble|raz[oó]n|proporci[oó]n/i);
    const correct = desafio!.options!.find(
      (o) => (typeof o === "string" ? o : o.value) === desafio!.expectedAnswer,
    )!;
    const correctText = typeof correct === "string" ? correct : correct.value;
    expect(correctText).toMatch(/verifico/i);
    expect(correctText).toMatch(/4 cm/);
    expect(correctText).toMatch(/12 cm/);
  });
});
