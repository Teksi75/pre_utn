import type { RoadmapSkill } from "../../domain/next-step/index";
import type { SkillId } from "../../domain/models/skill";
import { getRoadmapVisuals } from "./roadmap-visuals";

interface SkillRoadmapProps {
  /** Ordered list of pilot skills with their mastery state. */
  readonly skills: readonly RoadmapSkill[];
  /** ID of the skill that should be highlighted as "next step". */
  readonly nextSkillId?: SkillId;
}

/**
 * Renders the 4-pilot-skills roadmap (Zone 2 of the home page).
 *
 * - Horizontal layout on `md:` and up, vertical on mobile.
 * - Each skill is a colored dot + name + state label.
 * - Connecting line between dots is a thin gray bar (CSS only).
 *
 * Pure presentation — receives the data already computed by
 * `deriveHomeNextStep` in the domain layer.
 */
export function SkillRoadmap({ skills, nextSkillId }: SkillRoadmapProps) {
  return (
    <ol
      aria-label="Camino de la Unidad 1"
      className="flex flex-col gap-3 md:flex-row md:items-center md:gap-0"
    >
      {skills.map((skill, index) => {
        const isNext = skill.skillId === nextSkillId;
        const visuals = getRoadmapVisuals(skill.masteryLevel, isNext);
        const isLast = index === skills.length - 1;
        const progressPercent = Math.round(skill.accuracy * 100);

        return (
          <li
            key={skill.skillId}
            aria-label={visuals.ariaLabel}
            className="flex md:flex-1 md:items-center"
          >
            <div className="flex items-center gap-3 md:flex-col md:items-center md:gap-2 md:flex-1">
              <div className="flex items-center md:flex-col md:w-full">
                {/* Dot */}
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 rounded-full shrink-0 ${visuals.dotClass}`}
                />
                {/* Connecting line — desktop only, between dots */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="hidden md:block md:flex-1 md:h-px md:bg-[var(--color-brand-300)]"
                  />
                )}
                {/* Connecting line — mobile only, vertical */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="md:hidden ml-3 h-6 w-px bg-[var(--color-brand-300)]"
                  />
                )}
              </div>

              <div className="min-w-0 md:text-center">
                <p className="text-sm font-medium text-brand-900 truncate">
                  {skill.name}
                </p>
                <p className="text-xs text-brand-500">
                  {visuals.labelText}
                  {skill.accuracy > 0 && (
                    <>
                      {" · "}
                      <span className="text-brand-700">{progressPercent}%</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
