/**
 * Regression test: render safety for mat.u1.conjuntos_numericos exercises.
 *
 * Asserts that no exercise prompt, option, or pedagogical note contains
 * a bare math symbol outside $...$ math delimiters. The check covers:
 *   - √ (U+221A) — root sign
 *   - ∈ (U+2208) — membership symbol
 *   - ⊂ (U+2282) — inclusion symbol
 *   - \d+/\d+ — plain-text fraction (e.g. "2/5")
 *
 * Both the main `exercises.json` and the per-skill
 * `exercises/conjuntos-numericos.json` are scanned.
 *
 * See: openspec/changes/conjuntos-numericos-practice-expansion/specs/math-render-safety/spec.md
 */

import { describe, test, expect } from "vitest";
import { parseRichTextSegments } from "../rich-text-parser";
import exercisesJson from "../../../../content/matematica/exercises.json";
import perSkillExercisesJson from "../../../../content/matematica/exercises/conjuntos-numericos.json";

const SKILL_ID = "mat.u1.conjuntos_numericos";

/**
 * Concatenate all exercises for the skill from BOTH the main catalog and
 * the per-skill file. Each entry is the raw JSON object, so the test can
 * read any field present in the source file.
 */
const allSkillExercises: readonly Record<string, unknown>[] = [
  ...(exercisesJson as readonly Record<string, unknown>[]).filter(
    (ex) => (ex.skillId as string) === SKILL_ID
  ),
  ...(perSkillExercisesJson as readonly Record<string, unknown>[]).filter(
    (ex) => (ex.skillId as string) === SKILL_ID
  ),
];

/**
 * Collect all plain-text segments from a rich-text string.
 * Returns an array of text values that sit OUTSIDE $...$ math delimiters.
 */
function plainTextSegments(text: string): string[] {
  return parseRichTextSegments(text)
    .filter((seg) => seg.kind === "text")
    .map((seg) => seg.value);
}

/** Iterate the searchable text fields of a single exercise. */
function* iterateTextFields(
  exercise: Record<string, unknown>
): Generator<{ id: string; field: string; value: string }> {
  const id = exercise.id as string;
  const fields: Array<{ name: string; value: string }> = [
    { name: "prompt", value: exercise.prompt as string },
    { name: "pedagogicalNote", value: exercise.pedagogicalNote as string },
  ];

  if (Array.isArray(exercise.options)) {
    for (const [i, opt] of (exercise.options as string[]).entries()) {
      fields.push({ name: `options[${i}]`, value: opt });
    }
  }

  for (const field of fields) {
    yield { id, field: field.name, value: field.value };
  }
}

const BARE_FRACTION_PATTERN = /\b\d+\s*\/\s*\d+\b/;

describe(`render safety for ${SKILL_ID}`, () => {
  test(`no ${SKILL_ID} exercise contains bare √ outside math delimiters`, () => {
    const offenders: string[] = [];

    for (const exercise of allSkillExercises) {
      for (const { id, field, value } of iterateTextFields(exercise)) {
        for (const textSeg of plainTextSegments(value)) {
          if (textSeg.includes("√")) {
            offenders.push(`${id}.${field}: bare √ in "${textSeg.trim()}"`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare √ outside math delimiters:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  test(`no ${SKILL_ID} exercise contains bare ∈ outside math delimiters`, () => {
    // The membership symbol ∈ must render through KaTeX. A bare Unicode
    // character in plain text would render as a glyph without the
    // mathematical typesetting context.
    const offenders: string[] = [];

    for (const exercise of allSkillExercises) {
      for (const { id, field, value } of iterateTextFields(exercise)) {
        for (const textSeg of plainTextSegments(value)) {
          if (textSeg.includes("∈")) {
            offenders.push(`${id}.${field}: bare ∈ in "${textSeg.trim()}"`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare ∈ outside math delimiters:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  test(`no ${SKILL_ID} exercise contains bare ⊂ outside math delimiters`, () => {
    // The inclusion symbol ⊂ must render through KaTeX.
    const offenders: string[] = [];

    for (const exercise of allSkillExercises) {
      for (const { id, field, value } of iterateTextFields(exercise)) {
        for (const textSeg of plainTextSegments(value)) {
          if (textSeg.includes("⊂")) {
            offenders.push(`${id}.${field}: bare ⊂ in "${textSeg.trim()}"`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare ⊂ outside math delimiters:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  test(`no ${SKILL_ID} exercise contains bare fraction (\\d+/\\d+) outside math delimiters`, () => {
    // Fractions must use \frac{...}{...} inside $...$ delimiters. A bare
    // "2/5" or "3/4" outside math would render as text with a slash, not
    // as a properly typeset fraction.
    const offenders: string[] = [];

    for (const exercise of allSkillExercises) {
      for (const { id, field, value } of iterateTextFields(exercise)) {
        for (const textSeg of plainTextSegments(value)) {
          const match = BARE_FRACTION_PATTERN.exec(textSeg);
          if (match) {
            offenders.push(`${id}.${field}: bare fraction "${match[0]}" in "${textSeg.trim()}"`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare fractions outside math delimiters:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  test(`all ${SKILL_ID} exercises have their prompts parsed into segments`, () => {
    expect(allSkillExercises.length).toBeGreaterThanOrEqual(1);
    for (const exercise of allSkillExercises) {
      const segments = parseRichTextSegments(exercise.prompt as string);
      expect(segments.length).toBeGreaterThanOrEqual(1);
    }
  });

  test(`the per-skill bank (PR#2 + PR#3 + PR#4 + PR#5) contributes 44 exercises to the scan`, () => {
    // Sanity: the per-skill file actually has the 12 PR#2 + 12 PR#3 +
    // 14 PR#4 + 6 PR#5 exercises. This guards against an accidental reset
    // of the per-skill file. After PR#5 the per-skill file holds 44
    // exercises (8 pertenencia + 4 mapa + 12 clasificacion + 8 rvi +
    // 6 decimales + 6 errores-comunes).
    const perSkill = perSkillExercisesJson as readonly Record<string, unknown>[];
    expect(perSkill.length).toBe(44);
  });
});
