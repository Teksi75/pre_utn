"use client";

import { useEffect, useState } from "react";
import { StudyPlanCard } from "./StudyPlanCard";
import { loadStudyPlan } from "@/lib/diagnostic-storage";
import { loadProgress } from "@/lib/practice-progress";
import { PILOT_SKILLS } from "@/domain/catalog/pilot-skills";
import type { StudyPlan } from "@/domain/diagnostic/index";
import type { PracticeProgress } from "@/domain/progress/index";

/**
 * Skill labels keyed by skillId. Built once at module load from
 * PILOT_SKILLS so the card can resolve "mat.u1.conjuntos_numericos"
 * to "Conjuntos numéricos" without re-importing the catalog.
 */
const SKILL_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  PILOT_SKILLS.map((skill) => [skill.skillId, skill.label])
);

/**
 * Home page section that renders the persisted study plan, if one exists.
 *
 * Reads `pre-utn.study-plan.v1` + `pre-utn.practice.v1` from localStorage
 * on mount and delegates to `<StudyPlanCard>` for presentation. Renders
 * nothing when:
 *   - no study plan is stored, OR
 *   - the stored plan has zero priorities (all-mastered diagnostic).
 */
export function StudyPlanSection() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);

  useEffect(() => {
    const stored = loadStudyPlan();
    if (!stored || stored.skillPriorities.length === 0) return;
    setPlan(stored);
    setProgress(loadProgress());
  }, []);

  if (!plan || !progress) return null;

  return (
    <StudyPlanCard
      studyPlan={plan}
      skillNames={SKILL_NAMES}
      progress={progress}
    />
  );
}
