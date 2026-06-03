"use client";

import { FocusSelector } from "@/components/practice/FocusSelector";
import type { AccessibleSkill } from "@/domain/catalog/accessibility";
import type { SkillId } from "@/domain/models/skill";

interface PracticeSelectPhaseProps {
  selectedFocus: SkillId | null;
  onSelectFocus: (focus: SkillId) => void;
  /**
   * Optional accessibility map for PILOT_SKILLS. Forwarded to the
   * `FocusSelector` so pilot skills can show rich state (mastery
   * level, missing prerequisites) instead of the binary ready flag.
   */
  accessibleSkills?: ReadonlyMap<SkillId, AccessibleSkill>;
}

/**
 * Initial phase: the learner picks a skill and starts the guided flow.
 * Selecting a skill transitions to the theory phase via `onSelectFocus`.
 */
export function PracticeSelectPhase({
  selectedFocus,
  onSelectFocus,
  accessibleSkills,
}: PracticeSelectPhaseProps) {
  return (
    <FocusSelector
      onSkillSelect={onSelectFocus}
      selectedSkillId={selectedFocus ?? undefined}
      accessibleSkills={accessibleSkills}
    />
  );
}
