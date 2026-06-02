/**
 * Decimal-comma-convention scan.
 *
 * For the Spanish-speaking audience, decimal numbers in skill content must
 * use the comma decimal separator. In KaTeX, the convention is
 * `0{,}75` (with `{,}` to force a thin space) inside `$...$` math delimiters.
 * Bare `0.75` (with a dot) is wrong: it would render with a dot, not a comma.
 *
 * This test scans every exercise for the skill (PR#1..PR#4) and flags any
 * text segment that contains a digit.digit pattern outside math mode.
 * Math segments with the correct `0{,}75` form are fine.
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

/**
 * Pattern for a bare decimal number in plain text: digits.digits.
 * Examples: "0.75", "3.14", "1.5", "0.3".
 */
const BARE_DECIMAL_PATTERN = /\b\d+\.\d+\b/;

describe(`{,} decimal comma convention for ${SKILL_ID}`, () => {
  test("no exercise has a bare decimal dot (digit.digit) in plain text segments", () => {
    const offenders: string[] = [];

    for (const exercise of allSkillExercises) {
      for (const { id, field, value } of iterateTextFields(exercise)) {
        const segments = parseRichTextSegments(value);
        for (const seg of segments) {
          if (seg.kind !== "text") continue; // math segments use `{,}` not bare dot
          const match = BARE_DECIMAL_PATTERN.exec(seg.value);
          if (match) {
            offenders.push(
              `${id}.${field}: bare decimal "${match[0]}" in plain text segment "${seg.value.trim()}"`
            );
          }
        }
      }
    }

    expect(
      offenders,
      `Found bare decimal dots (should use Spanish comma via ${"\\{,}"} in math mode):\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});
