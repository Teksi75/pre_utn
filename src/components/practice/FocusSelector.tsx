"use client";

import { useState, useMemo } from "react";
import {
  UNIT_1_SKILLS,
  UNIT_2_SKILLS,
  UNIT_3_SKILLS,
  UNIT_4_SKILLS,
  UNIT_5_SKILLS,
  UNIT_6_SKILLS,
} from "@/domain/models/skill-catalog";
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

  const skillsForUnit = useMemo(() => {
    if (selectedUnit === null) return [];
    return SKILLS_BY_UNIT[selectedUnit] ?? [];
  }, [selectedUnit]);

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedUnit(value === "" ? null : Number(value));
  }

  function handleSkillClick(skillId: SkillId) {
    onSkillSelect(skillId);
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="unit-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Unidad
        </label>
        <select
          id="unit-select"
          value={selectedUnit ?? ""}
          onChange={handleUnitChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Habilidad
          </label>
          <div className="space-y-1">
            {skillsForUnit.map((skillId) => (
              <button
                key={skillId}
                onClick={() => handleSkillClick(skillId)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedSkillId === skillId
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {skillLabel(skillId)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
