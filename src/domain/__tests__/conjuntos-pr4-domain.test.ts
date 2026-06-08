/**
 * Domain tests for PR#4 racionales-vs-irracionales + decimales coverage.
 *
 * Validates the 14 PR#4 exercises (cn-rvi-01..08 + cn-dec-01..06) against
 * the practice-coverage and difficulty-progression specs:
 *   - All 8 racionales-vs-irracionales exercises load
 *   - All 6 decimales exercises load
 *   - Category minimums are met (racionales-vs-irracionales >= 8, decimales >= 6)
 *   - Mandatory numbers from the spec appear: √9, √2, 0,75, 0,3̄, 1/3, π,
 *     and the decimal expansion of √2 (a non-repeating non-terminating decimal)
 *   - The {,} decimal comma convention is enforced (no bare "0.75" outside math)
 *   - Difficulty distribution covers d1..d5 with at least 2 at d3, d4, d5
 *   - Exercises remain keyboard-safe: no exact-match fill-blank for symbolic math
 *   - Error tags reference valid taxonomy entries (4 new PR#4 tags)
 *   - Per-skill feedback file has the 4 PR#4 design-specified entries
 *
 * See: openspec/changes/conjuntos-numericos-practice-expansion/specs/practice-coverage/spec.md
 *      openspec/changes/conjuntos-numericos-practice-expansion/specs/difficulty-progression/spec.md
 *      openspec/changes/conjuntos-numericos-practice-expansion/design.md
 */

import { describe, test, expect } from "vitest";
import {
  loadExercisesForSkill,
  loadSkillBank,
  loadFeedbackContent,
} from "../catalog/content-loaders";
import { loadTaxonomy } from "../error-taxonomy/index";
import { parseRichTextSegments } from "../../components/math/rich-text-parser";
import type { Exercise } from "../models/exercise";
import { getExerciseOptionValue } from "../models/exercise";

const SKILL_ID = "mat.u1.conjuntos_numericos";
const PR4_RVI_COUNT = 8;
const PR4_DEC_COUNT = 6;

/** Returns all segments (text + math) of a rich-text string concatenated. */
function allSegments(text: string): string {
  return parseRichTextSegments(text)
    .map((seg) => seg.value)
    .join(" ");
}

/** Concatenates prompt + expectedAnswer + options + pedagogicalNote as a single searchable string. */
function exerciseText(ex: Exercise): string {
  const parts: string[] = [ex.prompt, ex.expectedAnswer, ex.pedagogicalNote];
  if (ex.options) parts.push(...ex.options.map(getExerciseOptionValue));
  return parts.map(allSegments).join(" ");
}

/** Returns only the plain text segments (outside $...$ math delimiters). */
function plainTextSegments(text: string): string[] {
  return parseRichTextSegments(text)
    .filter((seg) => seg.kind === "text")
    .map((seg) => seg.value);
}

describe(`PR#4 racionales-vs-irracionales + decimales — ${SKILL_ID}`, () => {
  const allBanked = loadSkillBank(SKILL_ID);
  const allExercises = allBanked.exercises;
  const pr4Exercises = allExercises.filter(
    (ex) =>
      /^ex\.u1\.conjuntos_numericos\.cn-rvi-\d{2}$/.test(ex.id) ||
      /^ex\.u1\.conjuntos_numericos\.cn-dec-\d{2}$/.test(ex.id)
  );
  const rviExercises = allExercises.filter(
    (ex) => /^ex\.u1\.conjuntos_numericos\.cn-rvi-\d{2}$/.test(ex.id)
  );
  const decExercises = allExercises.filter(
    (ex) => /^ex\.u1\.conjuntos_numericos\.cn-dec-\d{2}$/.test(ex.id)
  );

  describe("exercise load (behavior 1)", () => {
    test("all 8 PR#4 racionales-vs-irracionales exercises are loaded", () => {
      expect(rviExercises.length).toBe(PR4_RVI_COUNT);
    });

    test("all 6 PR#4 decimales exercises are loaded", () => {
      expect(decExercises.length).toBe(PR4_DEC_COUNT);
    });

    test("every PR#4 exercise has a non-empty prompt, expectedAnswer, and pedagogicalNote", () => {
      for (const ex of pr4Exercises) {
        expect(ex.prompt.trim().length, `${ex.id} prompt empty`).toBeGreaterThan(0);
        expect(
          ex.expectedAnswer.trim().length,
          `${ex.id} expectedAnswer empty`
        ).toBeGreaterThan(0);
        expect(
          ex.pedagogicalNote.trim().length,
          `${ex.id} pedagogicalNote empty`
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("category coverage (behavior 2)", () => {
    test('"racionales-vs-irracionales" category has exactly 8 exercises from PR#4', () => {
      const rvi = pr4Exercises.filter(
        (ex) => ex.category === "racionales-vs-irracionales"
      );
      expect(rvi.length).toBe(PR4_RVI_COUNT);
      for (const ex of rvi) {
        expect(ex.id).toMatch(/^ex\.u1\.conjuntos_numericos\.cn-rvi-\d{2}$/);
      }
    });

    test('"decimales" category has exactly 6 exercises from PR#4', () => {
      const dec = pr4Exercises.filter((ex) => ex.category === "decimales");
      expect(dec.length).toBe(PR4_DEC_COUNT);
      for (const ex of dec) {
        expect(ex.id).toMatch(/^ex\.u1\.conjuntos_numericos\.cn-dec-\d{2}$/);
      }
    });

    test("PR#4 slice contains no other categories besides rvi and dec", () => {
      const otherCategories = pr4Exercises
        .map((ex) => ex.category)
        .filter(
          (cat): cat is string =>
            cat !== "racionales-vs-irracionales" && cat !== "decimales"
        );
      expect(otherCategories).toEqual([]);
    });
  });

  describe("mandatory numbers coverage (behavior 3)", () => {
    // PR#4 (racionales-vs-irracionales + decimales) must cover these
    // numbers / representations. Each entry accepts multiple forms: the
    // Unicode form (e.g. "√9") and the KaTeX form (e.g. "\\sqrt{9}").
    // The numbers come from the practice-coverage spec: √9 rational, √2
    // irrational, 0,75 rational, 0,3̄ rational, 1/3 = 0,3̄, π irrational.
    const mandatoryInPr4: ReadonlyArray<{ forms: readonly string[]; label: string }> = [
      {
        forms: ["√9", "\\sqrt{9}", "\\sqrt 9"],
        label: "square root of 9 (rational)",
      },
      {
        forms: ["√2", "\\sqrt{2}", "\\sqrt 2"],
        label: "square root of 2 (irrational)",
      },
      {
        forms: ["0,75", "0{,}75"],
        label: "finite decimal 0,75 (rational)",
      },
      {
        forms: [
          "0,3̄",
          "0{,}3\\overline",
          "0{,}\\overline{3}",
          "0{,}3\\bar",
          "0{,}\\bar{3}",
        ],
        label: "repeating decimal 0,3̄ (rational)",
      },
      {
        forms: ["1/3", "\\frac{1}{3}"],
        label: "fraction 1/3 equal to 0,3̄",
      },
      {
        forms: ["π", "\\pi"],
        label: "pi (irrational)",
      },
      {
        forms: ["1,41421", "1{,}41421", "1,4142", "1{,}4142"],
        label: "decimal expansion of √2 (~1,41421...)",
      },
    ];

    for (const { forms, label } of mandatoryInPr4) {
      test(`mandatory representation ${label} appears in at least one PR#4 exercise`, () => {
        const found = pr4Exercises.some((ex) =>
          forms.some((form) => exerciseText(ex).includes(form))
        );
        expect(
          found,
          `expected to find one of [${forms.join(", ")}] in PR#4 exercises`
        ).toBe(true);
      });
    }
  });

  describe("rational vs irrational distinction (behavior 3b)", () => {
    // The design emphasizes that PR#4 must explicitly contrast √9 (rational)
    // and √2 (irrational). At least one exercise must have √9 marked rational
    // and at least one must have √2 marked irrational.
    test("at least one rvi exercise marks √9 as RATIONAL (correct answer says so)", () => {
      const rational9 = rviExercises.filter((ex) => {
        const text = exerciseText(ex);
        return (
          (text.includes("√9") || text.includes("\\sqrt{9}")) &&
          // The expected answer must affirm rationality.
          // We accept either "racional" or "ℚ" or "Q" appearing near √9 context.
          /racional|rational|\\mathbb\{Q\}/i.test(ex.expectedAnswer)
        );
      });
      expect(
        rational9.length,
        "expected an rvi exercise whose expectedAnswer classifies √9 as rational"
      ).toBeGreaterThanOrEqual(1);
    });

    test("at least one rvi exercise marks √2 as IRRATIONAL (correct answer says so)", () => {
      const irrational2 = rviExercises.filter((ex) => {
        const text = exerciseText(ex);
        return (
          (text.includes("√2") || text.includes("\\sqrt{2}")) &&
          /irracional|irrational/i.test(ex.expectedAnswer)
        );
      });
      expect(
        irrational2.length,
        "expected an rvi exercise whose expectedAnswer classifies √2 as irrational"
      ).toBeGreaterThanOrEqual(1);
    });

    test("at least one rvi exercise marks π as IRRATIONAL", () => {
      const irrPi = rviExercises.filter((ex) => {
        const text = exerciseText(ex);
        return (
          (text.includes("π") || text.includes("\\pi")) &&
          /irracional|irrational/i.test(ex.expectedAnswer)
        );
      });
      expect(
        irrPi.length,
        "expected an rvi exercise whose expectedAnswer classifies π as irrational"
      ).toBeGreaterThanOrEqual(1);
    });

    test("at least one dec exercise marks 0,75 as RATIONAL", () => {
      const rat075 = decExercises.filter((ex) => {
        const text = exerciseText(ex);
        return (
          (text.includes("0,75") || text.includes("0{,}75")) &&
          /racional|rational|\\mathbb\{Q\}/i.test(ex.expectedAnswer)
        );
      });
      expect(
        rat075.length,
        "expected a dec exercise whose expectedAnswer classifies 0,75 as rational"
      ).toBeGreaterThanOrEqual(1);
    });

    test("at least one dec exercise marks 0,3̄ as RATIONAL (periodic decimals are rational)", () => {
      const ratRepeating = decExercises.filter((ex) => {
        const text = exerciseText(ex);
        return (
          (text.includes("0,3̄") ||
            text.includes("0{,}3\\overline") ||
            text.includes("0{,}\\overline{3}") ||
            text.includes("0{,}3\\bar") ||
            text.includes("0{,}\\bar{3}")) &&
          /racional|rational|\\mathbb\{Q\}/i.test(ex.expectedAnswer)
        );
      });
      expect(
        ratRepeating.length,
        "expected a dec exercise whose expectedAnswer classifies 0,3̄ as rational"
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("{,} decimal comma convention (behavior 4)", () => {
    // The {,} convention is the project's way to render the Spanish decimal
    // comma in KaTeX. Bare "0.75" or "0.3" outside $...$ math would render as
    // a non-Spanish dot decimal. Every decimales exercise must respect this.
    const BARE_DECIMAL_PATTERN = /\b\d+\.\d+\b/;

    test("no decimales exercise has a bare decimal dot in plain text segments", () => {
      const offenders: string[] = [];
      for (const ex of decExercises) {
        const exRecord = ex as unknown as Record<string, unknown>;
        for (const field of ["prompt", "expectedAnswer", "pedagogicalNote"] as const) {
          const value = exRecord[field] as string;
          for (const seg of plainTextSegments(value)) {
            if (BARE_DECIMAL_PATTERN.test(seg)) {
              offenders.push(`${ex.id}.${field}: bare decimal in "${seg.trim()}"`);
            }
          }
        }
        if (ex.options) {
          for (const [i, opt] of ex.options.entries()) {
            const optValue = getExerciseOptionValue(opt);
            for (const seg of plainTextSegments(optValue)) {
              if (BARE_DECIMAL_PATTERN.test(seg)) {
                offenders.push(`${ex.id}.options[${i}]: bare decimal in "${seg.trim()}"`);
              }
            }
          }
        }
      }
      expect(
        offenders,
        `Found bare decimal dots outside math delimiters:\n${offenders.join("\n")}`
      ).toEqual([]);
    });

    test("at least one decimales exercise uses the {,}\\\\overline{...} pattern for repeating decimals", () => {
      // The convention for repeating decimals is 0{,}\\overline{3}.
      const hasOverline = decExercises.some((ex) =>
        exerciseText(ex).includes("0{,}\\overline")
      );
      expect(
        hasOverline,
        "expected at least one decimales exercise to use 0{,}\\overline{...} for repeating decimals"
      ).toBe(true);
    });

    test("at least one decimales exercise uses the {,} pattern (e.g. 0{,}75) for finite decimals", () => {
      const hasComma = decExercises.some((ex) =>
        exerciseText(ex).includes("0{,}75") ||
        // also accept any 0{,}XX finite decimal pattern
        /0\{,\}\d/.test(exerciseText(ex))
      );
      expect(
        hasComma,
        "expected at least one decimales exercise to use 0{,}XX for finite decimals"
      ).toBe(true);
    });
  });

  describe("difficulty distribution (behavior 5)", () => {
    // The design says include d3, d4, d5. We also include d1 and d2 for
    // accessibility (per the difficulty-progression spec).
    test("PR#4 includes at least 2 at difficulty 3 (intermediate)", () => {
      const d3 = pr4Exercises.filter((ex) => ex.difficulty === 3);
      expect(d3.length).toBeGreaterThanOrEqual(2);
    });

    test("PR#4 includes at least 2 at difficulty 4 (challenging)", () => {
      const d4 = pr4Exercises.filter((ex) => ex.difficulty === 4);
      expect(d4.length).toBeGreaterThanOrEqual(2);
    });

    test("PR#4 includes at least 2 at difficulty 5 (challenging)", () => {
      const d5 = pr4Exercises.filter((ex) => ex.difficulty === 5);
      expect(d5.length).toBeGreaterThanOrEqual(2);
    });

    test("rvi includes at least 1 at difficulty 5", () => {
      const d5 = rviExercises.filter((ex) => ex.difficulty === 5);
      expect(d5.length).toBeGreaterThanOrEqual(1);
    });

    test("dec includes at least 1 at difficulty 4", () => {
      const d4 = decExercises.filter((ex) => ex.difficulty === 4);
      expect(d4.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("keyboard-safe answer formats (behavior 6)", () => {
    test("PR#4 has no fill-blank exercises that require LaTeX-only answers", () => {
      const fillBlank = pr4Exercises.filter((ex) => ex.type === "fill-blank");
      expect(fillBlank).toEqual([]);
    });

    test("fraction-to-periodic-decimal exercise is selectable, not typed", () => {
      const fractionToDecimal = decExercises.find(
        (ex) => ex.id === "ex.u1.conjuntos_numericos.cn-dec-03"
      );
      expect(fractionToDecimal?.type).toBe("multiple-choice");
      expect(fractionToDecimal?.options).toContain(fractionToDecimal?.expectedAnswer);
    });

    test("at least 1 rvi exercise is true-false or fill-blank (non-MC)", () => {
      const nonMc = rviExercises.filter(
        (ex) => ex.type === "true-false" || ex.type === "fill-blank"
      );
      expect(nonMc.length).toBeGreaterThanOrEqual(1);
    });

    test("every selectable PR#4 exercise has the required structure for its type", () => {
      for (const ex of pr4Exercises) {
        if (ex.type === "true-false") {
          expect(ex.options, `${ex.id} true-false needs options`).toBeDefined();
          expect(ex.options).toContain("Verdadero");
          expect(ex.options).toContain("Falso");
          expect(
            ex.expectedAnswer === "Verdadero" || ex.expectedAnswer === "Falso",
            `${ex.id} expectedAnswer must be Verdadero or Falso`
          ).toBe(true);
        }
        if (ex.type === "multiple-choice") {
          expect(ex.options, `${ex.id} multiple-choice needs options`).toBeDefined();
          expect(ex.options!.length).toBeGreaterThanOrEqual(2);
          expect(ex.options).toContain(ex.expectedAnswer);
        }
      }
    });
  });

  describe("error tag coverage (behavior 7)", () => {
    const taxonomy = loadTaxonomy();
    const taxonomyIds = new Set<string>(taxonomy.map((t) => t.id));

    test("every commonErrorTag in PR#4 exercises references a known taxonomy entry", () => {
      const offenders: string[] = [];
      for (const ex of pr4Exercises) {
        for (const tag of ex.commonErrorTags) {
          if (!taxonomyIds.has(tag)) {
            offenders.push(`${ex.id}: ${tag}`);
          }
        }
      }
      expect(offenders, `Unknown error tags: ${offenders.join(", ")}`).toEqual([]);
    });

    test("PR#4 references the new design-specified error tag u1_decimal_no_es_siempre_irracional", () => {
      // Core PR#4 misconception: "every decimal is irrational" — false. The
      // bank must surface this misconception in at least one exercise.
      const refs = pr4Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_decimal_no_es_siempre_irracional")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#4 references the new design-specified error tag u1_toda_raiz_no_es_irracional", () => {
      // Core PR#4 misconception: "every root is irrational" — false. √9 = 3
      // is rational. The bank must surface this misconception.
      const refs = pr4Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_toda_raiz_no_es_irracional")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#4 references the new design-specified error tag u1_decimal_periodico_es_racional", () => {
      // Core PR#4 concept: periodic decimals are rational. Must be tagged.
      const refs = pr4Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_decimal_periodico_es_racional")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#4 references the new design-specified error tag u1_raiz_cuadrada_exacta_es_racional", () => {
      // Core PR#4 concept: exact square roots are rational. Must be tagged.
      const refs = pr4Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_raiz_cuadrada_exacta_es_racional")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("per-skill feedback file (behavior 8)", () => {
    test('loadFeedbackContent("unit-1-conjuntos-numericos") returns at least 10 entries (6 PR#2/3 + 4 PR#4)', () => {
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      expect(Array.isArray(feedback)).toBe(true);
      expect(feedback.length).toBeGreaterThanOrEqual(10);
    });

    test("per-skill feedback includes the 4 PR#4 design-specified error tags", () => {
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      const tags = new Set(feedback.map((f) => f.errorTag));
      expect(tags.has("u1_decimal_no_es_siempre_irracional")).toBe(true);
      expect(tags.has("u1_toda_raiz_no_es_irracional")).toBe(true);
      expect(tags.has("u1_decimal_periodico_es_racional")).toBe(true);
      expect(tags.has("u1_raiz_cuadrada_exacta_es_racional")).toBe(true);
    });

    test("per-skill feedback entries have valid type and non-empty messages", () => {
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      const validTypes = new Set(["corrective", "conceptual", "procedural"]);
      for (const mapping of feedback) {
        expect(validTypes.has(mapping.type)).toBe(true);
        expect(mapping.message.trim().length).toBeGreaterThan(10);
      }
    });
  });

  describe("loadExercisesForSkill parity (behavior 9)", () => {
    test("loadExercisesForSkill returns the same 14 PR#4 exercises as loadSkillBank", () => {
      const legacy = loadExercisesForSkill(SKILL_ID);
      const legacyPr4 = legacy.filter(
        (ex) =>
          /^ex\.u1\.conjuntos_numericos\.cn-rvi-\d{2}$/.test(ex.id) ||
          /^ex\.u1\.conjuntos_numericos\.cn-dec-\d{2}$/.test(ex.id)
      );
      const bankedPr4 = allExercises.filter(
        (ex) =>
          /^ex\.u1\.conjuntos_numericos\.cn-rvi-\d{2}$/.test(ex.id) ||
          /^ex\.u1\.conjuntos_numericos\.cn-dec-\d{2}$/.test(ex.id)
      );
      expect(legacyPr4.length).toBe(bankedPr4.length);
      expect(legacyPr4.length).toBe(PR4_RVI_COUNT + PR4_DEC_COUNT);
      expect(legacyPr4.map((e) => e.id).sort()).toEqual(
        bankedPr4.map((e) => e.id).sort()
      );
    });
  });
});
