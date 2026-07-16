"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  UNIT_1_SKILLS,
  UNIT_2_SKILLS,
  UNIT_3_SKILLS,
  UNIT_4_SKILLS,
  UNIT_5_SKILLS,
  UNIT_6_SKILLS,
} from "@/domain/models/skill-catalog";
import { isSkillReady } from "@/domain/catalog/readiness";
import type { AccessibleSkill } from "@/domain/catalog/accessibility";
import { skillLabel } from "@/lib/skill-label";
import { StatusPill } from "@/components/ui/StatusPill";
import type { SkillId } from "@/domain/models/skill";
import type { MasteryLevel } from "@/domain/progress";

interface MasteryPillInfo {
  readonly label: string;
  readonly variant: "success" | "weak" | "active";
}

/**
 * Maps a MasteryLevel to the pill info to render on the left side of a
 * skill row. Returns null when the skill has not been started — no pill
 * is rendered in that case.
 */
function getMasteryPillInfo(
  masteryLevel: MasteryLevel
): MasteryPillInfo | null {
  switch (masteryLevel) {
    case "mastered":
      return { label: "Dominada", variant: "success" };
    case "review":
      return { label: "Necesita repaso", variant: "weak" };
    case "practicing":
    case "learning":
      return { label: "En práctica", variant: "active" };
    case "not-started":
      return null;
  }
}

const UNITS = [1, 2, 3, 4, 5, 6] as const;

const SKILLS_BY_UNIT: Record<number, readonly SkillId[]> = {
  1: UNIT_1_SKILLS,
  2: UNIT_2_SKILLS,
  3: UNIT_3_SKILLS,
  4: UNIT_4_SKILLS,
  5: UNIT_5_SKILLS,
  6: UNIT_6_SKILLS,
};

/**
 * Derive a unit's availability from its active skill count.
 * U5-01 contract: the selector MUST NOT hardcode per-unit (e.g., U5)
 * unavailability flags — availability follows the live
 * `SKILLS_BY_UNIT` table, so a unit that gains active skills in a
 * future slice is automatically selectable again.
 */
function getUnitAvailability(
  unit: number
): { readonly available: boolean; readonly activeSkillCount: number } {
  const activeSkillCount = SKILLS_BY_UNIT[unit]?.length ?? 0;
  return { available: activeSkillCount > 0, activeSkillCount };
}

interface FocusSelectorProps {
  readonly onSkillSelect: (skillId: SkillId) => void;
  readonly selectedSkillId?: SkillId;
  /**
   * Optional accessibility map keyed by skillId for PILOT_SKILLS.
   * When provided, pilot skills use the rich accessibility info
   * (mastery level, missing prerequisites) instead of the binary
   * `isSkillReady` verdict. Non-pilot skills always fall back to
   * `isSkillReady` for content-readiness.
   */
  readonly accessibleSkills?: ReadonlyMap<SkillId, AccessibleSkill>;
}

export function FocusSelector({
  onSkillSelect,
  selectedSkillId,
  accessibleSkills,
}: FocusSelectorProps) {
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const skillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const skillsForUnit = useMemo(() => {
    if (selectedUnit === null) return [];
    return SKILLS_BY_UNIT[selectedUnit] ?? [];
  }, [selectedUnit]);

  // Derive the empty-unit render state from the same live SKILLS_BY_UNIT
  // count used for option availability. A previously-disabled unit that
  // gains active skills flips back to the normal skill-list on the next
  // render without any flag mutation or persistence change.
  const showEmptyUnitState =
    selectedUnit !== null && skillsForUnit.length === 0;

  // When the accessible-skills map is provided we treat a skill as
  // accessible ONLY when it appears in the map AND `accessible === true`.
  // Otherwise we fall back to the legacy `isSkillReady` (content readiness)
  // verdict so existing call sites keep working.
  const readinessMap = useMemo(() => {
    const map = new Map<SkillId, { ready: boolean; missing: readonly string[] }>();
    for (const skills of Object.values(SKILLS_BY_UNIT)) {
      for (const skillId of skills) {
        const rich = accessibleSkills?.get(skillId);
        if (rich) {
          map.set(skillId, { ready: rich.accessible, missing: [] });
        } else {
          map.set(skillId, isSkillReady(skillId));
        }
      }
    }
    return map;
  }, [accessibleSkills]);

  // First missing prereq label per skill, for the "Requiere: …" badge.
  // Empty when the skill is accessible or has no missing prereqs.
  const missingPrereqLabelMap = useMemo(() => {
    const map = new Map<SkillId, string>();
    if (!accessibleSkills) return map;
    for (const [skillId, info] of accessibleSkills) {
      const firstMissing = info.missingPrerequisites[0];
      if (!firstMissing) continue;
      // Prefer the pilot label if the prereq is a pilot skill,
      // otherwise derive a label from the skillId slug.
      const prereqInfo = accessibleSkills.get(firstMissing);
      const label = prereqInfo?.name ?? skillLabel(firstMissing);
      map.set(skillId, label);
    }
    return map;
  }, [accessibleSkills]);

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "") {
      setSelectedUnit(null);
      return;
    }
    const candidateUnit = Number(value);
    // Reject zero-skill (unavailable) unit values defensively. The
    // native `disabled` attribute on the <option> already prevents
    // the user from picking one through the UI, but stale state from
    // back/forward navigation or programmatic events could still
    // surface an unavailable value here.
    if (!getUnitAvailability(candidateUnit).available) {
      setSelectedUnit(null);
      return;
    }
    setSelectedUnit(candidateUnit);
  }

  function handleSkillClick(skillId: SkillId) {
    const readiness = readinessMap.get(skillId);
    if (!readiness?.ready) return;
    onSkillSelect(skillId);
  }

  const handleSkillKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const skills = skillsForUnit;
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextIndex = (index + 1) % skills.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = (index - 1 + skills.length) % skills.length;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleSkillClick(skills[index]);
          return;
        case "Escape":
          e.preventDefault();
          setSelectedUnit(null);
          return;
      }

      if (nextIndex !== null) {
        skillRefs.current[nextIndex]?.focus();
      }
    },
    [skillsForUnit, handleSkillClick]
  );

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="unit-select"
          className="block text-sm font-semibold text-brand-800 mb-2"
        >
          Unidad
        </label>
        <div className="relative">
          <select
            id="unit-select"
            value={selectedUnit ?? ""}
            onChange={handleUnitChange}
            className="w-full appearance-none border border-brand-300 rounded-[var(--radius-button)] pl-3 pr-9 py-2.5 text-sm bg-white text-brand-900 min-h-[44px] cursor-pointer transition-colors duration-[var(--duration-fast)] hover:border-brand-400 focus-visible:shadow-[var(--ring-focus)]"
          >
            <option value="">Seleccionar unidad...</option>
            {UNITS.map((unit) => {
              const { available } = getUnitAvailability(unit);
              return (
                <option
                  key={unit}
                  value={unit}
                  disabled={!available}
                  aria-disabled={!available}
                >
                  {available ? `Unidad ${unit}` : `Unidad ${unit} — Próximamente`}
                </option>
              );
            })}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-brand-500)]"
          >
            ▾
          </span>
        </div>
      </div>

      {selectedUnit !== null && (
        <div>
          <label className="block text-sm font-semibold text-brand-700 mb-2">
            Habilidad
          </label>
          {showEmptyUnitState ? (
            <div
              className="rounded-[var(--radius-card)] border border-brand-100 bg-brand-50 p-4 text-sm text-brand-400 flex items-center justify-between gap-3"
              data-testid="unit-empty-state"
            >
              <span className="text-brand-700">
                Esta unidad todavía no expone habilidades practicables.
              </span>
              <StatusPill
                variant="neutral"
                className="shrink-0"
                data-testid="availability-pill"
              >
                Próximamente
              </StatusPill>
            </div>
          ) : (
            <div className="grid gap-2" role="listbox" aria-label="Habilidades">
              {skillsForUnit.map((skillId, index) => {
                const readiness = readinessMap.get(skillId);
                const isReady = readiness?.ready ?? false;
                const missingPrereqLabel = missingPrereqLabelMap.get(skillId);
                // Three visual states: available, blocked-by-prereq, no-content.
                const blockedByPrereq = !isReady && Boolean(missingPrereqLabel);
                const accessibleSkill = accessibleSkills?.get(skillId);
                const masteryPillInfo = accessibleSkill
                  ? getMasteryPillInfo(accessibleSkill.masteryLevel)
                  : null;

                return (
                  <button
                    key={skillId}
                    ref={(el) => { skillRefs.current[index] = el; }}
                    onClick={() => handleSkillClick(skillId)}
                    onKeyDown={(e) => handleSkillKeyDown(e, index)}
                    disabled={!isReady}
                    aria-disabled={!isReady}
                    aria-describedby={
                      blockedByPrereq ? `skill-prereq-${index}` : undefined
                    }
                    title={
                      blockedByPrereq && missingPrereqLabel
                        ? `Necesitás dominar ${missingPrereqLabel} antes`
                        : undefined
                    }
                    role="option"
                    aria-selected={selectedSkillId === skillId}
                    className={`w-full text-left px-4 py-3 text-sm rounded-[var(--radius-card)] border transition-colors duration-[var(--duration-fast)] min-h-[44px] ${
                      selectedSkillId === skillId
                        ? "bg-accent-500/10 border-accent-500 text-brand-900 font-medium shadow-[var(--shadow-card)]"
                        : isReady
                          ? "bg-white border-brand-200 text-brand-700 hover:border-brand-400 hover:shadow-[var(--shadow-card)]"
                          : blockedByPrereq
                            ? "bg-amber-50 border-amber-200 text-amber-900 cursor-not-allowed opacity-80"
                            : "bg-brand-50 border-brand-100 text-brand-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 flex-wrap">
                          {masteryPillInfo !== null && (
                            <StatusPill
                              variant={masteryPillInfo.variant}
                              data-testid="mastery-pill"
                              className="shrink-0"
                            >
                              {masteryPillInfo.label}
                            </StatusPill>
                          )}
                          <span className="min-w-0 truncate">{skillLabel(skillId)}</span>
                        </span>
                        {blockedByPrereq && missingPrereqLabel && (
                          <span
                            id={`skill-prereq-${index}`}
                            className="block mt-0.5 text-xs text-amber-700"
                          >
                            Requiere: {missingPrereqLabel}
                          </span>
                        )}
                      </span>
                      {isReady ? (
                        <StatusPill variant="available" className="shrink-0" data-testid="availability-pill">
                          Disponible
                        </StatusPill>
                      ) : blockedByPrereq ? (
                        <StatusPill variant="locked" className="shrink-0" data-testid="availability-pill">
                          Bloqueada
                        </StatusPill>
                      ) : (
                        <StatusPill variant="neutral" className="shrink-0" data-testid="availability-pill">
                          Próximamente
                        </StatusPill>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
