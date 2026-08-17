import katex from "katex";
import { describe, expect, test } from "vitest";
import exercisesJson from "../../../../content/matematica/exercises.json";
import unit3Json from "../../../../content/matematica/exercises/unit-3.json";
import { parseRichTextSegments } from "../rich-text-parser";

const EXPONENTIAL_IDS = [
  "ex.u3.exponenciales.2",
  "ex.u3.exponenciales.3",
  "ex.u3.exponenciales.4",
  "ex.u3.exponenciales.5",
  "ex.u3.exponenciales.03",
  "ex.u3.exponenciales.6",
  "ex.u3.exponenciales.7",
  "ex.u3.exponenciales.8",
  "ex.u3.exponenciales.9",
  "ex.u3.exponenciales.10",
  "ex.u3.exponenciales.11",
  "ex.u3.exponenciales.12",
  "ex.u3.exponenciales.13",
  "ex.u3.exponenciales.14",
  "ex.u3.exponenciales.15",
  "ex.u3.exponenciales.16",
  "ex.u3.exponenciales.17",
] as const;
const LINEAR_ID = "ex.u3.ecuaciones_lineales.6";
const TARGET_IDS = [...EXPONENTIAL_IDS, LINEAR_ID] as const;
const TARGET_ID_SET = new Set<string>(TARGET_IDS);

type ExerciseRecord = Record<string, unknown>;
type TextField = { id: string; field: string; value: string };
type Option = string | { value: string; label: string };

const allCatalogExercises = [
  ...(exercisesJson as readonly ExerciseRecord[]),
  ...(unit3Json as readonly ExerciseRecord[]),
];
const targetExercises = allCatalogExercises.filter((exercise) =>
  TARGET_ID_SET.has(exercise.id as string),
);

const EXPECTED_METADATA = [
  [LINEAR_ID, "x = 3 + √5", ["u3_racionalizacion_irracional"], ["x = (14 + 6√5) / (3 − √5)", "x = 3 + √5", "x = 3 − √5", "x = 14 + 6√5"]],
  ["ex.u3.exponenciales.2", "x = 3", [], ["x = 3", "x = 2", "x = 4", "x = 8"]],
  ["ex.u3.exponenciales.3", "x = 3/2", [], ["x = 3/2", "x = 3", "x = 2", "x = 9/2"]],
  ["ex.u3.exponenciales.4", "3", [], []],
  ["ex.u3.exponenciales.5", "x = -3", [], ["x = -3", "x = 3", "x = -1/3", "x = 1/8"]],
  ["ex.u3.exponenciales.03", "x = 5/2", ["u3_igualdad_exponenciales"], ["x = 5/2", "x = 5", "x = 2", "x = 5/4"]],
  ["ex.u3.exponenciales.6", "true", ["u3_igualdad_exponenciales"], []],
  ["ex.u3.exponenciales.7", "4", ["u3_igualdad_exponenciales"], []],
  ["ex.u3.exponenciales.8", "x = 5", ["u3_igualdad_exponenciales"], ["x = 5", "x = -5", "x = 1/5", "x = -1/32"]],
  ["ex.u3.exponenciales.9", "x = 0 o x = 2", ["u3_igualdad_exponenciales"], ["x = 0 o x = 2", "x = 1 o x = 4", "x = -1 o x = -4", "x = 0"]],
  ["ex.u3.exponenciales.10", "1", ["u3_igualdad_exponenciales"], []],
  ["ex.u3.exponenciales.11", "true", ["u3_igualdad_exponenciales"], []],
  ["ex.u3.exponenciales.12", "x = -1 o x = 1", ["u3_igualdad_exponenciales"], ["x = -1 o x = 1", "x = 1", "x = -1", "x = 0"]],
  ["ex.u3.exponenciales.13", "x = -1 o x = 1", ["u3_igualdad_exponenciales"], ["x = -1 o x = 1", "x = 1", "x = -1", "x = 0"]],
  ["ex.u3.exponenciales.14", "x = 0 o x = 1", ["u3_igualdad_exponenciales"], ["x = 0 o x = 1", "x = 1", "x = 0", "x = -1"]],
  ["ex.u3.exponenciales.15", "x ≈ 2.73", ["u3_igualdad_exponenciales"], ["x ≈ 2.73", "x ≈ 1.73", "x ≈ 3.73", "x ≈ 2.00"]],
  ["ex.u3.exponenciales.16", "x = 6", ["u3_igualdad_exponenciales"], ["x = 6", "x = 3", "x = 4", "x = 2"]],
  ["ex.u3.exponenciales.17", "2", ["u3_igualdad_exponenciales"], []],
] as const;

const REQUIRED_MATH_FIELDS: Readonly<Record<string, readonly string[]>> = {
  "ex.u3.exponenciales.2": ["prompt"],
  "ex.u3.exponenciales.3": ["prompt", "options[0]", "options[3]", "pedagogicalNote"],
  "ex.u3.exponenciales.4": ["prompt"],
  "ex.u3.exponenciales.5": ["prompt", "options[3]", "pedagogicalNote"],
  "ex.u3.exponenciales.03": ["prompt", "options[0]", "options[3]", "pedagogicalNote"],
  "ex.u3.exponenciales.6": ["prompt"],
  "ex.u3.exponenciales.7": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.8": ["prompt", "options[2]", "options[3]", "pedagogicalNote"],
  "ex.u3.exponenciales.9": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.10": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.11": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.12": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.13": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.14": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.15": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.16": ["prompt", "pedagogicalNote"],
  "ex.u3.exponenciales.17": ["prompt", "pedagogicalNote"],
  [LINEAR_ID]: ["prompt", "options[0]", "options[1]", "options[2]", "options[3]", "pedagogicalNote"],
};

function optionValue(option: Option): string {
  return typeof option === "string" ? option : option.value;
}

function optionLabel(option: Option): string {
  return typeof option === "string" ? option : option.label;
}

function* iterateTextFields(exercise: ExerciseRecord): Generator<TextField> {
  const id = exercise.id as string;
  yield { id, field: "prompt", value: exercise.prompt as string };

  for (const [index, option] of ((exercise.options ?? []) as Option[]).entries()) {
    yield { id, field: `options[${index}]`, value: optionLabel(option) };
  }

  if (typeof exercise.pedagogicalNote === "string") {
    yield { id, field: "pedagogicalNote", value: exercise.pedagogicalNote };
  }
}

function assertNoBareNotation({ id, field, value }: TextField): void {
  const offenders = parseRichTextSegments(value)
    .filter((segment) => segment.kind === "text")
    .flatMap((segment) => {
      const matches = segment.value.match(/\^|√|\b\d+\s*\/\s*\d+\b/g);
      return matches?.map((match) => `${id}.${field}: bare "${match}"`) ?? [];
    });

  expect(offenders, offenders.join("\n")).toEqual([]);
}

describe("U3 exponential render safety", () => {
  test("selects the complete target namespace once and in source order", () => {
    const exponentialIds = targetExercises
      .filter((exercise) => exercise.skillId === "mat.u3.exponenciales")
      .map((exercise) => exercise.id);
    const linearMatches = targetExercises.filter((exercise) => exercise.id === LINEAR_ID);

    expect(exponentialIds).toEqual(EXPONENTIAL_IDS);
    expect(linearMatches).toHaveLength(1);
    expect(targetExercises).toHaveLength(18);
  });

  test("preserves answer identity and option order", () => {
    const projection = targetExercises.map((exercise) => {
      const options = (exercise.options ?? []) as Option[];
      return [
        exercise.id,
        exercise.expectedAnswer,
        exercise.commonErrorTags,
        options.map(optionValue),
      ];
    });

    expect(projection).toEqual(EXPECTED_METADATA);
  });

  test("parses every required display field into valid KaTeX math", () => {
    for (const exercise of targetExercises) {
      const fields = new Map(
        [...iterateTextFields(exercise)].map(({ field, value }) => [field, value]),
      );

      for (const field of REQUIRED_MATH_FIELDS[exercise.id as string]) {
        const value = fields.get(field);
        expect(value, `${exercise.id}.${field} is missing`).toBeTypeOf("string");
        const mathSegments = parseRichTextSegments(value as string).filter(
          (segment) => segment.kind === "math",
        );
        expect(mathSegments.length, `${exercise.id}.${field} has no math segment`).toBeGreaterThan(0);

        for (const segment of mathSegments) {
          expect(segment.value.trim(), `${exercise.id}.${field} has empty math`).not.toBe("");
          expect(() =>
            katex.renderToString(segment.value, {
              throwOnError: true,
              displayMode: segment.displayMode,
            }),
          ).not.toThrow();
        }
      }
    }
  });

  test("rejects bare carets, roots, and numeric fractions in rendered text", () => {
    expect(targetExercises).toHaveLength(18);
    for (const exercise of targetExercises) {
      for (const field of iterateTextFields(exercise)) {
        assertNoBareNotation(field);
      }
    }
  });
});
