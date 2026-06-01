import type { ExerciseType } from "@/domain/models/exercise";

const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  "multiple-choice": "Opción múltiple",
  "true-false": "Verdadero / Falso",
  numerical: "Respuesta numérica",
  symbolic: "Respuesta algebraica",
  "fill-blank": "Completar respuesta",
  matching: "Relacionar conceptos",
  ordering: "Ordenar pasos",
  "free-response": "Respuesta desarrollada",
  graphical: "Respuesta gráfica",
};

export function getExerciseTypeLabel(type: ExerciseType): string {
  return EXERCISE_TYPE_LABELS[type];
}

export function usesSelectableAnswerControl(type: ExerciseType): boolean {
  return type === "multiple-choice" || type === "true-false";
}
