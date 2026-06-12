import { describe, expect, it } from "vitest";
import {
  getExerciseTypeLabel,
  usesSelectableAnswerControl,
} from "../exercise-labels";

describe("exercise labels", () => {
  it("returns student-facing labels instead of raw technical type names", () => {
    expect(getExerciseTypeLabel("multiple-choice")).toBe("Opción múltiple");
    expect(getExerciseTypeLabel("numerical")).toBe("Respuesta numérica");
    expect(getExerciseTypeLabel("fill-blank")).toBe("Completar respuesta");
    expect(getExerciseTypeLabel("true-false")).toBe("Verdadero / Falso");
  });

  it("identifies exercise types that should use selectable answer controls", () => {
    expect(usesSelectableAnswerControl("multiple-choice")).toBe(true);
    expect(usesSelectableAnswerControl("true-false")).toBe(true);
    expect(usesSelectableAnswerControl("numerical")).toBe(false);
    expect(usesSelectableAnswerControl("fill-blank")).toBe(false);
  });
});
