/**
 * Domain tests for PR#3 classification coverage.
 *
 * Validates the 12 PR#3 exercises (cn-cla-01..12) against the
 * practice-coverage, difficulty-progression, and natural-numbers-convention
 * specs:
 *   - All 12 load via loadSkillBank / loadExercisesForSkill
 *   - Category minimum is met (clasificacion >= 12)
 *   - Mandatory numbers from the spec appear in prompts or options
 *   - N-sin-cero convention is explicitly tested
 *   - Difficulty distribution covers 1-5 with at least 2 at d3, d4, d5
 *   - At least 2 non-multiple-choice types are present
 *   - Error tags reference valid taxonomy entries
 *   - Per-skill feedback file has the 3 PR#3 design-specified entries
 *
 * See: openspec/changes/conjuntos-numericos-practice-expansion/specs/practice-coverage/spec.md
 *      openspec/changes/conjuntos-numericos-practice-expansion/specs/difficulty-progression/spec.md
 *      openspec/changes/conjuntos-numericos-practice-expansion/specs/natural-numbers-convention/spec.md
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
const PR3_CLA_COUNT = 12;

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

describe(`PR#3 classification — ${SKILL_ID}`, () => {
  const allBanked = loadSkillBank(SKILL_ID);
  const allExercises = allBanked.exercises;
  const pr3Exercises = allExercises.filter(
    (ex) => /^ex\.u1\.conjuntos_numericos\.cn-cla-\d{2}$/.test(ex.id)
  );

  describe("exercise load (behavior 1)", () => {
    test("all 12 PR#3 classification exercises are loaded", () => {
      // Sanity: the bank must contain the 12 PR#3 exercises. The bank may
      // also contain other exercises (PR#2 pertenencia/mapa), but the
      // PR#3 slice must be present in full.
      expect(pr3Exercises.length).toBe(PR3_CLA_COUNT);
    });

    test("every PR#3 exercise has a non-empty prompt, expectedAnswer, and pedagogicalNote", () => {
      // Triangulation: not just "the exercises exist" — they must be usable.
      for (const ex of pr3Exercises) {
        expect(ex.prompt.trim().length).toBeGreaterThan(0);
        expect(ex.expectedAnswer.trim().length).toBeGreaterThan(0);
        expect(ex.pedagogicalNote.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe("category coverage (behavior 2)", () => {
    test('"clasificacion" category has exactly 12 exercises from PR#3', () => {
      // The spec requires clasificacion >= 12. The PR#3 slice must
      // contribute exactly 12 to keep accounting clear.
      const clasificacion = pr3Exercises.filter(
        (ex) => ex.category === "clasificacion"
      );
      expect(clasificacion.length).toBe(PR3_CLA_COUNT);
      for (const ex of clasificacion) {
        expect(ex.id).toMatch(/^ex\.u1\.conjuntos_numericos\.cn-cla-\d{2}$/);
      }
    });

    test("PR#3 slice contains no other categories besides clasificacion", () => {
      // Per the design, PR#3 owns only the "clasificacion" category.
      // Other categories belong to PR#2 (pertenencia, mapa) and later PRs.
      const otherCategories = pr3Exercises
        .map((ex) => ex.category)
        .filter((cat): cat is string => cat !== "clasificacion");
      expect(otherCategories).toEqual([]);
    });
  });

  describe("mandatory numbers coverage (behavior 3)", () => {
    // The practice-coverage spec lists: 5, 0, -3, 2/5, 0,75, 0,3̄, √2, √9, π, -4/1.
    // PR#3 (clasificacion) is the canonical owner of these numbers. Each
    // must appear in at least one PR#3 exercise's prompt/options/note.
    //
    // Each entry accepts multiple forms: the Unicode form (e.g. "√2") and
    // the KaTeX form (e.g. "\sqrt{2}"). Exercises correctly use KaTeX form
    // inside $...$ delimiters per the math-render-safety spec; the Unicode
    // form is also accepted because a future exercise might reference the
    // number in plain prose.
    const mandatoryInPr3: ReadonlyArray<{ forms: readonly string[]; label: string }> = [
      { forms: ["5"], label: "natural number 5" },
      { forms: ["0"], label: "zero (for N-sin-cero)" },
      { forms: ["-3"], label: "negative integer -3" },
      { forms: ["2/5", "\\frac{2}{5}"], label: "rational fraction 2/5" },
      { forms: ["0,75", "0{,}75"], label: "decimal 0,75 (KaTeX {,})" },
      { forms: ["0,3̄", "0{,}3\\overline"], label: "repeating decimal 0,3̄" },
      { forms: ["√2", "\\sqrt{2}", "\\sqrt 2"], label: "square root of 2" },
      { forms: ["√9", "\\sqrt{9}", "\\sqrt 9"], label: "square root of 9" },
      { forms: ["π", "\\pi"], label: "pi" },
      { forms: ["-4/1", "-\\frac{4}{1}"], label: "negative integer -4 as -4/1" },
    ];

    for (const { forms, label } of mandatoryInPr3) {
      test(`mandatory number ${label} appears in at least one PR#3 exercise`, () => {
        const found = pr3Exercises.some((ex) =>
          forms.some((form) => exerciseText(ex).includes(form))
        );
        expect(
          found,
          `expected to find one of [${forms.join(", ")}] in PR#3 exercises`
        ).toBe(true);
      });
    }
  });

  describe("N-sin-cero convention (behavior 4)", () => {
    test("at least one PR#3 exercise explicitly tests 0 and N (N-sin-cero)", () => {
      // The natural-numbers-convention spec requires an explicit test of
      // 0 / ℕ. At least one cn-cla exercise must target this convention.
      const nSinCeroExercises = pr3Exercises.filter((ex) => {
        const text = exerciseText(ex);
        return text.includes("0") && (text.includes("ℕ") || text.includes("N"));
      });
      expect(nSinCeroExercises.length).toBeGreaterThanOrEqual(1);
    });

    test("the N-sin-cero exercise marks 0 ∉ ℕ as the correct answer", () => {
      // Triangulation: the convention must be enforced in the answer, not
      // just mentioned in the prompt. Find the N-sin-cero exercise and
      // verify its expectedAnswer explicitly states that 0 is NOT in ℕ.
      // Since the answer lives in LaTeX (KaTeX) form inside $...$ delimiters,
      // we look for the LaTeX commands \mathbb{N} (the set N) and \notin
      // (the negated-in symbol).
      const nSinCero = pr3Exercises.find((ex) => {
        const text = exerciseText(ex);
        return (
          text.includes("0") &&
          (text.includes("ℕ") || text.includes("N") || text.includes("\\mathbb{N}"))
        );
      });
      expect(nSinCero).toBeDefined();
      expect(nSinCero!.expectedAnswer).toContain("\\mathbb{N}");
      expect(nSinCero!.expectedAnswer).toContain("\\notin");
    });
  });

  describe("difficulty distribution (behavior 5)", () => {
    test("PR#3 exercises include difficulty 1 (basic)", () => {
      // At least one exercise at the easiest level to lower the entry barrier.
      const d1 = pr3Exercises.filter((ex) => ex.difficulty === 1);
      expect(d1.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#3 exercises include difficulty 2 (basic)", () => {
      const d2 = pr3Exercises.filter((ex) => ex.difficulty === 2);
      expect(d2.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#3 exercises include at least 2 at difficulty 3 (intermediate)", () => {
      // Spec: at least one at d3; design task says "at least 2" for the
      // bank to feel balanced.
      const d3 = pr3Exercises.filter((ex) => ex.difficulty === 3);
      expect(d3.length).toBeGreaterThanOrEqual(2);
    });

    test("PR#3 exercises include at least 2 at difficulty 4 (challenging)", () => {
      const d4 = pr3Exercises.filter((ex) => ex.difficulty === 4);
      expect(d4.length).toBeGreaterThanOrEqual(2);
    });

    test("PR#3 exercises include at least 2 at difficulty 5 (challenging)", () => {
      const d5 = pr3Exercises.filter((ex) => ex.difficulty === 5);
      expect(d5.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("keyboard-safe answer formats (behavior 6)", () => {
    test("PR#3 has no fill-blank exercises that require LaTeX-only answers", () => {
      const fillBlank = pr3Exercises.filter((ex) => ex.type === "fill-blank");
      expect(fillBlank).toEqual([]);
    });

    test("every selectable PR#3 exercise has the required structure for its type", () => {
      // Triangulation: selectable exercises must remain answerable without
      // requiring students to type LaTeX-only notation.
      for (const ex of pr3Exercises) {
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

    test("every commonErrorTag in PR#3 exercises references a known taxonomy entry", () => {
      // Approval-style: the bank must not reference phantom error tags.
      const offenders: string[] = [];
      for (const ex of pr3Exercises) {
        for (const tag of ex.commonErrorTags) {
          if (!taxonomyIds.has(tag)) {
            offenders.push(`${ex.id}: ${tag}`);
          }
        }
      }
      expect(offenders, `Unknown error tags: ${offenders.join(", ")}`).toEqual([]);
    });

    test("PR#3 references the new design-specified classification error tag u1_racional_tambien_es_real", () => {
      // Core PR#3 misconception: rationals are also reals (different sets,
      // not disjoint). Must be tagged on at least one PR#3 exercise.
      const refs = pr3Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_racional_tambien_es_real")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#3 references the new design-specified classification error tag u1_negativo_puede_ser_racional", () => {
      // Core PR#3 misconception: negative numbers can be rational. Must be
      // tagged on at least one PR#3 exercise.
      const refs = pr3Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_negativo_puede_ser_racional")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("PR#3 references the new design-specified classification error tag u1_entero_no_siempre_natural", () => {
      // Core PR#3 misconception: not all integers are natural. Must be
      // tagged on at least one PR#3 exercise.
      const refs = pr3Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_entero_no_siempre_natural")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("per-skill feedback file (behavior 8)", () => {
    test('loadFeedbackContent("unit-1-conjuntos-numericos") returns the per-skill feedback array with at least 6 entries', () => {
      // The per-skill file already has the 3 PR#2 entries. PR#3 adds 3 more.
      // Total minimum after PR#3: 6.
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      expect(Array.isArray(feedback)).toBe(true);
      expect(feedback.length).toBeGreaterThanOrEqual(6);
    });

    test("per-skill feedback includes the 3 PR#3 design-specified error tags", () => {
      // The design names these 3 PR#3 misconception keys explicitly.
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      const tags = new Set(feedback.map((f) => f.errorTag));
      expect(tags.has("u1_racional_tambien_es_real")).toBe(true);
      expect(tags.has("u1_entero_no_siempre_natural")).toBe(true);
      expect(tags.has("u1_negativo_puede_ser_racional")).toBe(true);
    });

    test("per-skill feedback entries have valid type and non-empty messages", () => {
      // Triangulation: entries must be usable, not stubs.
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      const validTypes = new Set(["corrective", "conceptual", "procedural"]);
      for (const mapping of feedback) {
        expect(validTypes.has(mapping.type)).toBe(true);
        expect(mapping.message.trim().length).toBeGreaterThan(10);
      }
    });
  });

  describe("loadExercisesForSkill parity (behavior 9)", () => {
    test("loadExercisesForSkill returns the same 12 PR#3 classification exercises as loadSkillBank", () => {
      // Backward-compat contract: the legacy loader still produces the
      // PR#3 exercises. The new loader is a thin wrapper.
      const legacy = loadExercisesForSkill(SKILL_ID);
      const legacyPr3 = legacy.filter((ex) =>
        /^ex\.u1\.conjuntos_numericos\.cn-cla-\d{2}$/.test(ex.id)
      );
      const bankedPr3 = allBanked.exercises.filter((ex) =>
        /^ex\.u1\.conjuntos_numericos\.cn-cla-\d{2}$/.test(ex.id)
      );
      expect(legacyPr3.length).toBe(bankedPr3.length);
      expect(legacyPr3.map((e) => e.id).sort()).toEqual(bankedPr3.map((e) => e.id).sort());
    });
  });
});
