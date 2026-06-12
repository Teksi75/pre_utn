import type { ExerciseType } from "@/domain/models/exercise";

const TEXT_INPUT_TYPES = new Set<ExerciseType>([
  "numerical",
  "fill-blank",
]);

export function isTextAnswerType(type: ExerciseType): boolean {
  return TEXT_INPUT_TYPES.has(type);
}

export function getSubmittedExerciseAnswer(
  type: ExerciseType,
  textAnswer: string,
  selectedOption: string | null
): string {
  return isTextAnswerType(type)
    ? textAnswer.trim()
    : selectedOption?.trim() ?? "";
}

export function canSubmitExerciseAnswer(
  type: ExerciseType,
  textAnswer: string,
  selectedOption: string | null
): boolean {
  return getSubmittedExerciseAnswer(type, textAnswer, selectedOption).length > 0;
}
