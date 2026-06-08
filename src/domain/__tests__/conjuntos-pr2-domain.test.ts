/**
 * Domain tests for PR#2 pertenencia + inclusion map coverage.
 *
 * Validates the 12 PR#2 exercises (cn-per-01..08 + cn-map-01..04) against
 * the practice-coverage spec:
 *   - All 12 load via loadSkillBank / loadExercisesForSkill
 *   - Category minimums are met (pertenencia >= 8, mapa >= 4)
 *   - Mandatory numbers from the spec appear in prompts or options
 *   - N-sin-cero convention is explicitly tested
 *   - Error tags reference valid taxonomy entries
 *   - Per-skill feedback file loads with the 3 design-specified entries
 *
 * See: openspec/changes/conjuntos-numericos-practice-expansion/specs/practice-coverage/spec.md
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
const PR2_PER_COUNT = 8;
const PR2_MAP_COUNT = 4;

/** Returns all segments (text + math) of a rich-text string concatenated. */
function allSegments(text: string): string {
  return parseRichTextSegments(text)
    .map((seg) => seg.value)
    .join(" ");
}

/** Concatenates prompt + expectedAnswer + options + pedagogicalNote as a single searchable string. */
function exerciseText(ex: Exercise): string {
  // The mandatory-number search is about coverage: does the number appear
  // anywhere the student would see it? That includes inside $...$ math
  // delimiters (which KaTeX renders). So we include both text and math
  // segments. The render-safety regression test (separate file) checks
  // that nothing important is left outside delimiters.
  const parts: string[] = [ex.prompt, ex.expectedAnswer, ex.pedagogicalNote];
  if (ex.options) parts.push(...ex.options.map(getExerciseOptionValue));
  return parts.map(allSegments).join(" ");
}

describe(`PR#2 pertenencia + inclusion map — ${SKILL_ID}`, () => {
  const allBanked = loadSkillBank(SKILL_ID);
  const allExercises = allBanked.exercises;
  const pr2Exercises = allExercises.filter(
    (ex) => /^ex\.u1\.conjuntos_numericos\.cn-(per|map)-\d{2}$/.test(ex.id)
  );

  describe("exercise load (behavior 1)", () => {
    test("all 12 PR#2 exercises are loaded", () => {
      // Sanity: the bank must contain the 12 PR#2 exercises. The bank may
      // also contain other exercises (e.g. main-file classification), but
      // the PR#2 slice must be present in full.
      expect(pr2Exercises.length).toBe(PR2_PER_COUNT + PR2_MAP_COUNT);
    });

    test("every PR#2 exercise has a non-empty prompt and expectedAnswer", () => {
      // Triangulation: not just "the exercises exist" — they must be usable.
      for (const ex of pr2Exercises) {
        expect(ex.prompt.trim().length).toBeGreaterThan(0);
        expect(ex.expectedAnswer.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe("category coverage (behavior 2)", () => {
    test("pertenencia category has exactly 8 exercises", () => {
      // The spec requires pertenencia >= 8. The PR#2 slice must contribute
      // exactly 8 to keep accounting clear (PR#3+ adds other categories).
      const pertenencia = pr2Exercises.filter((ex) => ex.category === "pertenencia");
      expect(pertenencia.length).toBe(PR2_PER_COUNT);
      // All IDs must follow the cn-per-NN pattern.
      for (const ex of pertenencia) {
        expect(ex.id).toMatch(/^ex\.u1\.conjuntos_numericos\.cn-per-\d{2}$/);
      }
    });

    test("mapa category has exactly 4 exercises", () => {
      // The spec requires mapa >= 4. The PR#2 slice contributes exactly 4.
      const mapa = pr2Exercises.filter((ex) => ex.category === "mapa");
      expect(mapa.length).toBe(PR2_MAP_COUNT);
      for (const ex of mapa) {
        expect(ex.id).toMatch(/^ex\.u1\.conjuntos_numericos\.cn-map-\d{2}$/);
      }
    });

    test("PR#2 slice contains no other categories besides pertenencia and mapa", () => {
      // Per the design, PR#2 owns only these two categories. Other categories
      // (clasificacion, decimales, etc.) belong to later PRs.
      const otherCategories = pr2Exercises
        .map((ex) => ex.category)
        .filter((cat): cat is string => cat !== undefined && cat !== "pertenencia" && cat !== "mapa");
      expect(otherCategories).toEqual([]);
    });
  });

  describe("mandatory numbers coverage (behavior 3)", () => {
    // The practice-coverage spec lists: 5, 0, -3, 2/5, 0,75, 0,3̄, √2, √9, π, -4/1.
    // PR#2 must cover the numbers relevant to pertenencia/inclusion. The
    // remaining numbers are covered by PR#3+ exercises. We assert that
    // each PR#2-relevant number appears in at least one exercise's text.
    //
    // Each entry accepts multiple forms: the Unicode form (e.g. "√2") and
    // the KaTeX form (e.g. "\sqrt{2}"). Exercises correctly use KaTeX form
    // inside $...$ delimiters per the math-render-safety spec; the Unicode
    // form is also accepted because a future exercise might reference the
    // number in plain prose (e.g. "la raíz cuadrada de 2").
    const mandatoryInPr2: ReadonlyArray<{ forms: readonly string[]; label: string }> = [
      { forms: ["5"], label: "natural number 5" },
      { forms: ["0"], label: "zero (for N-sin-cero)" },
      { forms: ["-3"], label: "negative integer -3" },
      { forms: ["0,75", "0{,}75"], label: "decimal 0,75 (KaTeX {,})" },
      { forms: ["√2", "\\sqrt{2}", "\\sqrt 2"], label: "square root of 2" },
      { forms: ["√9", "\\sqrt{9}", "\\sqrt 9"], label: "square root of 9" },
    ];

    for (const { forms, label } of mandatoryInPr2) {
      test(`mandatory number ${label} appears in at least one PR#2 exercise`, () => {
        const found = pr2Exercises.some((ex) =>
          forms.some((form) => exerciseText(ex).includes(form))
        );
        expect(
          found,
          `expected to find one of [${forms.join(", ")}] in PR#2 exercises`
        ).toBe(true);
      });
    }
  });

  describe("N-sin-cero convention (behavior 4)", () => {
    test("at least one PR#2 exercise explicitly tests 0 and N (N-sin-cero)", () => {
      // The natural-numbers-convention spec requires an explicit test of
      // 0 / ℕ. cn-map-02 is the canonical exercise for this convention.
      const nSinCeroExercises = pr2Exercises.filter((ex) => {
        const text = exerciseText(ex);
        return text.includes("0") && (text.includes("ℕ") || text.includes("N"));
      });
      expect(nSinCeroExercises.length).toBeGreaterThanOrEqual(1);
    });

    test("the N-sin-cero exercise marks 0 ∉ ℕ as the correct answer", () => {
      // Triangulation: the convention must be enforced in the answer, not
      // just mentioned in the prompt. cn-map-02's expectedAnswer should
      // explicitly state that 0 is NOT in ℕ. Since the answer lives in
      // LaTeX (KaTeX) form inside $...$ delimiters, we look for the LaTeX
      // commands \mathbb{N} (the set N) and \notin (the negated-in symbol).
      const nSinCero = pr2Exercises.find(
        (ex) => ex.id === "ex.u1.conjuntos_numericos.cn-map-02"
      );
      expect(nSinCero).toBeDefined();
      expect(nSinCero!.expectedAnswer).toContain("\\mathbb{N}");
      expect(nSinCero!.expectedAnswer).toContain("\\notin");
    });
  });

  describe("error tag coverage (behavior 5)", () => {
    const taxonomy = loadTaxonomy();
    const taxonomyIds = new Set<string>(taxonomy.map((t) => t.id));

    test("every commonErrorTag in PR#2 exercises references a known taxonomy entry", () => {
      // Approval-style: the bank must not reference phantom error tags.
      const offenders: string[] = [];
      for (const ex of pr2Exercises) {
        for (const tag of ex.commonErrorTags) {
          if (!taxonomyIds.has(tag)) {
            offenders.push(`${ex.id}: ${tag}`);
          }
        }
      }
      expect(offenders, `Unknown error tags: ${offenders.join(", ")}`).toEqual([]);
    });

    test("u1_pertenencia_vs_inclusion is referenced by PR#2 exercises", () => {
      // Core PR#2 misconception: confusing ∈ with ⊂. Must be tagged.
      const refs = pr2Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_pertenencia_vs_inclusion")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("u1_inclusion_chain_order is referenced by PR#2 mapa exercises", () => {
      // Core PR#2 misconception: inverting the inclusion chain.
      const refs = pr2Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_inclusion_chain_order")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    test("u1_n_sin_cero is referenced by at least one PR#2 mapa exercise", () => {
      // Core PR#2 convention: 0 ∉ ℕ.
      const refs = pr2Exercises.filter((ex) =>
        ex.commonErrorTags.includes("u1_n_sin_cero")
      );
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("per-skill feedback file (behavior 6)", () => {
    test('loadFeedbackContent("unit-1-conjuntos-numericos") returns the per-skill feedback array', () => {
      // The per-skill file is the preferred source for PR#2 misconceptions.
      // It must exist and be loadable via the standard content-loader API.
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      expect(Array.isArray(feedback)).toBe(true);
      expect(feedback.length).toBeGreaterThanOrEqual(3);
    });

    test("per-skill feedback includes the 3 design-specified error tags", () => {
      // The design names these 3 PR#2 misconception keys explicitly.
      const feedback = loadFeedbackContent("unit-1-conjuntos-numericos");
      const tags = new Set(feedback.map((f) => f.errorTag));
      expect(tags.has("u1_pertenencia_vs_inclusion")).toBe(true);
      expect(tags.has("u1_inclusion_chain_order")).toBe(true);
      expect(tags.has("u1_n_sin_cero")).toBe(true);
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

  describe("loadExercisesForSkill parity (behavior 7)", () => {
    test("loadExercisesForSkill returns the same 12 PR#2 exercises as loadSkillBank", () => {
      // Backward-compat contract: the legacy loader still produces the
      // PR#2 exercises. The new loader is a thin wrapper.
      const legacy = loadExercisesForSkill(SKILL_ID);
      const legacyPr2 = legacy.filter((ex) =>
        /^ex\.u1\.conjuntos_numericos\.cn-(per|map)-\d{2}$/.test(ex.id)
      );
      const bankedPr2 = allBanked.exercises.filter((ex) =>
        /^ex\.u1\.conjuntos_numericos\.cn-(per|map)-\d{2}$/.test(ex.id)
      );
      expect(legacyPr2.length).toBe(bankedPr2.length);
      expect(legacyPr2.map((e) => e.id).sort()).toEqual(bankedPr2.map((e) => e.id).sort());
    });
  });
});
