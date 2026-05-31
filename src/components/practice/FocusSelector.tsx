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
import type { SkillId } from "@/domain/models/skill";

/** Derive a human-readable label from a skill ID slug. */
function skillLabel(id: SkillId): string {
  const slug = id.split(".").pop() ?? id;
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

interface FocusSelectorProps {
  readonly onSkillSelect: (skillId: SkillId) => void;
  readonly selectedSkillId?: SkillId;
}

export function FocusSelector({
  onSkillSelect,
  selectedSkillId,
}: FocusSelectorProps) {
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const skillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const skillsForUnit = useMemo(() => {
    if (selectedUnit === null) return [];
    return SKILLS_BY_UNIT[selectedUnit] ?? [];
  }, [selectedUnit]);

  const readinessMap = useMemo(() => {
    const map = new Map<SkillId, { ready: boolean; missing: readonly string[] }>();
    for (const skills of Object.values(SKILLS_BY_UNIT)) {
      for (const skillId of skills) {
        map.set(skillId, isSkillReady(skillId));
      }
    }
    return map;
  }, []);

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedUnit(value === "" ? null : Number(value));
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
          className="block text-sm font-semibold text-brand-700 mb-2"
        >
          Unidad
        </label>
        <select
          id="unit-select"
          value={selectedUnit ?? ""}
          onChange={handleUnitChange}
          className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
        >
          <option value="">Seleccionar unidad...</option>
          {UNITS.map((unit) => (
            <option key={unit} value={unit}>
              Unidad {unit}
            </option>
          ))}
        </select>
      </div>

      {selectedUnit !== null && (
        <div>
          <label className="block text-sm font-semibold text-brand-700 mb-2">
            Habilidad
          </label>
          <div className="grid gap-2" role="listbox" aria-label="Habilidades">
            {skillsForUnit.map((skillId, index) => {
              const readiness = readinessMap.get(skillId);
              const isReady = readiness?.ready ?? false;

              return (
                <button
                  key={skillId}
                  ref={(el) => { skillRefs.current[index] = el; }}
                  onClick={() => handleSkillClick(skillId)}
                  onKeyDown={(e) => handleSkillKeyDown(e, index)}
                  disabled={!isReady}
                  role="option"
                  aria-selected={selectedSkillId === skillId}
                  aria-disabled={!isReady}
                  className={`w-full text-left px-4 py-3 text-sm rounded-[var(--radius-card)] border transition-all duration-[var(--duration-fast)] min-h-[44px] ${
                    selectedSkillId === skillId
                      ? "bg-accent-500/10 border-accent-500 text-brand-900 font-medium shadow-[var(--shadow-card)]"
                      : isReady
                        ? "bg-white border-brand-200 text-brand-700 hover:border-brand-400 hover:shadow-[var(--shadow-card)]"
                        : "bg-brand-50 border-brand-100 text-brand-400 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {skillLabel(skillId)}
                    {isReady ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Disponible
                      </span>
                    ) : (
                      <span className="text-xs text-brand-400 bg-brand-100 px-2 py-0.5 rounded-full">
                        Próximamente
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
