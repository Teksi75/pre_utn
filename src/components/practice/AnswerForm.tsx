import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import type { Exercise } from "@/domain/models/exercise";

interface AnswerFormProps {
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
  readonly exercise?: Exercise | null;
  /** Controlled draft: current text answer (text-input types). */
  readonly draftAnswer?: string;
  /** Controlled draft: current selected option (selectable types). */
  readonly draftSelectedOption?: string | null;
  /** Called on text change or option selection. */
  readonly onDraftChange?: (answer: string, selectedOption: string | null) => void;
}

export function AnswerForm({
  onSubmit,
  disabled,
  autoFocus = true,
  exercise,
  draftAnswer,
  draftSelectedOption,
  onDraftChange,
}: AnswerFormProps) {
  if (!exercise) return null;

  return (
    <ExerciseAnswerInput
      exercise={exercise}
      disabled={disabled}
      onSubmit={onSubmit}
      autoFocus={autoFocus}
      inputId="answer-input"
      draftAnswer={draftAnswer}
      draftSelectedOption={draftSelectedOption}
      onDraftChange={onDraftChange}
    />
  );
}
