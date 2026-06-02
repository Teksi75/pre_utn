/**
 * Regression test: render safety for mat.u1.conjuntos_numericos exercises.
 *
 * Asserts that no exercise prompt, option, or pedagogical note contains
 * a bare √ (U+221A) text node outside $...$ math delimiters.
 *
 * See: openspec/changes/conjuntos-numericos-practice-expansion/specs/math-render-safety/spec.md
 */

import { describe, test, expect } from "vitest";
import { parseRichTextSegments } from "../rich-text-parser";
import exercisesJson from "../../../../content/matematica/exercises.json";

const SKILL_ID = "mat.u1.conjuntos_numericos";

const conjuntosExercises = (exercisesJson as readonly Record<string, unknown>[]).filter(
  (ex) => (ex.skillId as string) === SKILL_ID
);

/**
 * Collect all plain-text segments from a rich-text string.
 * Returns an array of text values that sit OUTSIDE $...$ math delimiters.
 */
function plainTextSegments(text: string): string[] {
  return parseRichTextSegments(text)
    .filter((seg) => seg.kind === "text")
    .map((seg) => seg.value);
}

describe(`render safety for ${SKILL_ID}`, () => {
  test(`no ${SKILL_ID} exercise contains bare √ outside math delimiters`, () => {
    const offenders: string[] = [];

    for (const exercise of conjuntosExercises) {
      const id = exercise.id as string;
      const fields: Array<{ name: string; value: string }> = [
        { name: "prompt", value: exercise.prompt as string },
        { name: "pedagogicalNote", value: exercise.pedagogicalNote as string },
      ];

      // Include options if present
      if (Array.isArray(exercise.options)) {
        for (const [i, opt] of (exercise.options as string[]).entries()) {
          fields.push({ name: `options[${i}]`, value: opt });
        }
      }

      for (const field of fields) {
        for (const textSeg of plainTextSegments(field.value)) {
          if (textSeg.includes("√")) {
            offenders.push(`${id}.${field.name}: bare √ in "${textSeg.trim()}"`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare √ outside math delimiters:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  test(`all ${SKILL_ID} exercises have their prompts parsed into segments`, () => {
    expect(conjuntosExercises.length).toBeGreaterThanOrEqual(1);
    for (const exercise of conjuntosExercises) {
      const segments = parseRichTextSegments(exercise.prompt as string);
      expect(segments.length).toBeGreaterThanOrEqual(1);
    }
  });
});
