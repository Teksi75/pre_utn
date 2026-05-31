/**
 * Readiness — computes whether a skill has all components needed for practice.
 * No external dependencies. Pure TypeScript.
 */

/** A named readiness component. */
export interface ReadinessComponent {
  readonly name: string;
  readonly present: boolean;
}

/** The result of a readiness check. */
export interface ReadinessResult {
  readonly skillId: string;
  readonly ready: boolean;
  readonly missing: readonly string[];
}

/** Required component names for a skill to be considered ready. */
const REQUIRED_COMPONENTS = ["theory", "examples", "exercises", "feedback", "evaluation"] as const;

/**
 * Compute readiness for a skill given its component status.
 *
 * @param skillId - The skill to check
 * @param components - Component status list
 * @returns ReadinessResult with ready flag and missing component names
 */
export function computeReadiness(
  skillId: string,
  components: readonly ReadinessComponent[]
): ReadinessResult {
  const presentSet = new Set(
    components.filter((c) => c.present).map((c) => c.name)
  );

  const missing = REQUIRED_COMPONENTS.filter((name) => !presentSet.has(name));

  return {
    skillId,
    ready: missing.length === 0,
    missing,
  };
}
