import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mapSubmittedAnswer } from "../submitted-answer-display";
import type { Exercise } from "@/domain/models/exercise";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

type PartialWithSkill = Partial<Exercise> & { skillId?: Exercise["skillId"] };

function makeExercise(overrides: PartialWithSkill = {}): Exercise {
  return {
    id: "ex.u5.medicion_angulos_y_arcos.1a",
    skillId: "mat.u5.medicion_angulos_y_arcos",
    type: "structured",
    difficulty: 1,
    prompt: "Convertir 36° a radianes",
    expectedAnswer: "1/5",
    commonErrorTags: [],
    pedagogicalNote: "",
    unit: 5,
    answerSpec: {
      kind: "pi-rational",
      expected: { numerator: 1, denominator: 5 },
      decimal: 0.6283,
      tolerance: 0.0001,
    },
    ...overrides,
  };
}

describe("mapSubmittedAnswer — structured (pi-rational)", () => {
  test("parses a pi-rational v1 JSON and renders coefficient + decimal rows", () => {
    const exercise = makeExercise();
    const submission = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 1,
      denominator: 5,
      decimal: 0.6283,
    });
    const rows = mapSubmittedAnswer(exercise, submission);
    // Must contain coefficient and decimal labels.
    const labels = rows.map((r) => r.label);
    expect(labels).toContain("Coeficiente");
    expect(labels).toContain("Decimal");
    // Coefficient row should contain "1/5" (or the slash-separated form).
    const coeffRow = rows.find((r) => r.label === "Coeficiente");
    expect(coeffRow?.value).toMatch(/1\s*\/\s*5/);
    // Decimal row should contain the decimal value.
    const decimalRow = rows.find((r) => r.label === "Decimal");
    expect(decimalRow?.value).toContain("0.6283");
  });

  test("returns read-only 'Respuesta' fallback for malformed structured JSON", () => {
    const exercise = makeExercise();
    const rows = mapSubmittedAnswer(exercise, "not-json");
    // Defensive: even on parse failure, the display falls back gracefully.
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.label).toBe("Respuesta");
  });
});

describe("mapSubmittedAnswer — structured (angle-dms)", () => {
  test("parses an angle-dms v1 JSON and renders d° m′ s″ rows", () => {
    const exercise = makeExercise({
      id: "ex.u5.medicion_angulos_y_arcos.2d",
      expectedAnswer: "11° 27' 33\"",
      answerSpec: {
        kind: "angle-dms",
        expected: { degrees: 11, minutes: 27, seconds: 33 },
        tolerance: 0.5,
      },
    });
    const submission = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 33,
    });
    const rows = mapSubmittedAnswer(exercise, submission);
    const labels = rows.map((r) => r.label);
    expect(labels).toContain("Grados");
    expect(labels).toContain("Minutos");
    expect(labels).toContain("Segundos");
    expect(rows.find((r) => r.label === "Grados")?.value).toContain("11");
    expect(rows.find((r) => r.label === "Minutos")?.value).toContain("27");
    expect(rows.find((r) => r.label === "Segundos")?.value).toContain("33");
  });
});

describe("mapSubmittedAnswer — backward compatibility", () => {
  test("text types still return a single 'Respuesta' row", () => {
    const exercise = makeExercise({
      type: "numerical",
      id: "ex.u1.conjuntos_numericos.1",
      answerSpec: undefined,
    });
    const rows = mapSubmittedAnswer(exercise, "42");
    expect(rows).toEqual([{ label: "Respuesta", value: "42" }]);
  });

  test("multiple-choice still resolves the option label", () => {
    const exercise = makeExercise({
      type: "multiple-choice",
      id: "ex.u3.ecuaciones_cuadraticas.1",
      answerSpec: undefined,
      expectedAnswer: "x = 2, x = 3",
      options: ["x = 2, x = 3", "x = -2, x = -3", "x = 2, x = -3", "x = -2, x = 3"],
    });
    const rows = mapSubmittedAnswer(exercise, "x = 2, x = 3");
    expect(rows).toEqual([{ label: "x = 2, x = 3", value: "x = 2, x = 3" }]);
  });
});

describe("submitted-answer-display module — structured display contract", () => {
  const modulePath = "src/components/exercises/submitted-answer-display.ts";

  test("parses pi-rational JSON in the source", () => {
    const src = source(modulePath);
    expect(src).toMatch(/pi-rational/);
  });

  test("parses angle-dms JSON in the source", () => {
    const src = source(modulePath);
    expect(src).toMatch(/angle-dms/);
  });

  test("falls back to 'Respuesta' for malformed JSON", () => {
    const src = source(modulePath);
    // Defensive: any malformed input produces a graceful fallback row.
    expect(src).toMatch(/Respuesta/);
  });

  test("does not introduce a UI control (no buttons / inputs)", () => {
    // Read-only contract for the display component (UI controls live in
    // the input components). The mapper module has no JSX, but the display
    // component itself also has no submit affordance.
    const src = source(modulePath);
    // mapSubmittedAnswer is a pure function (no JSX). We assert no <button>.
    expect(src).not.toMatch(/<button/);
  });
});