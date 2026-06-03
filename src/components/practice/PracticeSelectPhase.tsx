"use client";

import { FocusSelector } from "@/components/practice/FocusSelector";
import type { SkillId } from "@/domain/models/skill";

interface PracticeSelectPhaseProps {
  selectedFocus: SkillId | null;
  onSelectFocus: (focus: SkillId) => void;
}

/**
 * Initial phase: the learner picks a skill and starts the guided flow.
 * Selecting a skill transitions to the theory phase via `onSelectFocus`.
 */
export function PracticeSelectPhase({
  selectedFocus,
  onSelectFocus,
}: PracticeSelectPhaseProps) {
  return (
    <FocusSelector
      onSkillSelect={onSelectFocus}
      selectedSkillId={selectedFocus ?? undefined}
    />
  );
}
