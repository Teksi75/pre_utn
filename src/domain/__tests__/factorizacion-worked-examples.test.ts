import { describe, expect, test } from "vitest";

import { loadExampleContent } from "../catalog/content-loaders";
import { validateWorkedExample, type WorkedExample } from "../models/worked-example";

const FACTORIZATION_SKILL_ID = "mat.u2.factorizacion";
const EXPECTED_IDS = [
  "example-factorizacion-6",
  "example-factorizacion-7",
  "example-factorizacion-2",
  "example-factorizacion-8",
  "example-factorizacion-1",
  "example-factorizacion-3",
  "example-factorizacion-4",
  "example-factorizacion-5",
  "example-factorizacion-9",
] as const;
const EXPECTED_CASES = [1, 2, 3, 4, 5, 6, 6, 6, 7] as const;

function loadFactorizationExamples(): readonly WorkedExample[] {
  return loadExampleContent("unit-2").filter(
    (example) => example.skillId === FACTORIZATION_SKILL_ID
  );
}

function readCaseNumber(example: WorkedExample): number {
  const match = example.problem.match(/Caso ([1-7])/);
  expect(match, `${example.id} must name its canonical case`).not.toBeNull();
  return Number(match?.[1]);
}

describe("factorization worked examples", () => {
  test("exposes nine unique examples in the canonical Case 1 to 7 progression", () => {
    const examples = loadFactorizationExamples();
    const ids = examples.map(({ id }) => id);
    const cases = examples.map(readCaseNumber);

    expect(ids).toEqual(EXPECTED_IDS);
    expect(new Set(ids).size).toBe(9);
    expect(cases).toEqual(EXPECTED_CASES);
    expect([...new Set(cases)]).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("preserves the three Case 6 examples and their stable identities", () => {
    const caseSixExamples = loadFactorizationExamples().filter(
      (example) => readCaseNumber(example) === 6
    );

    expect(caseSixExamples.map(({ id }) => id)).toEqual([
      "example-factorizacion-3",
      "example-factorizacion-4",
      "example-factorizacion-5",
    ]);
  });

  test("uses a non-monic quadratic trinomial for Case 7", () => {
    const caseSeven = loadFactorizationExamples().find(
      (example) => readCaseNumber(example) === 7
    );

    expect(caseSeven?.problem, "Case 7 leading coefficient").toMatch(
      /factorizar [2-9]x²/
    );
  });

  test("validates every example and keeps its steps sequential", () => {
    const examples = loadFactorizationExamples();
    expect(examples).toHaveLength(9);

    for (const example of examples) {
      expect(validateWorkedExample(example), example.id).toEqual({
        ok: true,
        value: example,
      });
      expect(example.steps.map(({ order }) => order), example.id).toEqual(
        Array.from({ length: example.steps.length }, (_, index) => index + 1)
      );
    }
  });

  test("makes the result, expansion check, traceability, and error signal explicit", () => {
    const examples = loadFactorizationExamples();
    expect(examples).toHaveLength(9);

    for (const example of examples) {
      const finalStep = example.steps.at(-1)?.explanation ?? "";
      const fullSolution = example.steps.map(({ explanation }) => explanation).join(" ");

      expect(finalStep, `${example.id} final result`).toContain(example.finalAnswer);
      const expansionCheck = fullSolution.match(/verific(?:ación|amos)[^✓]*✓/i)?.[0] ?? "";
      expect(expansionCheck, `${example.id} explicit expansion check`).toContain("=");
      expect(example.pedagogicalNote, `${example.id} focused error note`).toMatch(
        /error|no confundir|ojo/i
      );
      expect(example.canonicalTrace.length, `${example.id} canonical trace`).toBeGreaterThan(0);
      for (const trace of example.canonicalTrace) {
        expect(trace.path.trim(), `${example.id} trace path`).not.toBe("");
        expect(trace.section?.trim(), `${example.id} trace section`).not.toBe("");
        expect(trace.pedagogicalIntent.trim(), `${example.id} trace intent`).not.toBe("");
      }
    }
  });
});
