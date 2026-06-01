import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import type { Exercise } from "@/domain/models/exercise";

interface AnswerFormProps {
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
  readonly exercise?: Exercise | null;
}

export function AnswerForm({ onSubmit, disabled, autoFocus = true, exercise }: AnswerFormProps) {
  if (!exercise) return null;

  return (
    <ExerciseAnswerInput
      exercise={exercise}
      disabled={disabled}
      onSubmit={onSubmit}
      autoFocus={autoFocus}
      inputId="answer-input"
    />
  );
}
