/**
 * Student profile fixture — ProfilesState builder.
 *
 * Produces a JSON-serializable object matching the storage shape used by
 * `src/lib/student-profile-storage.ts` (the canonical `ProfilesState` from
 * `src/domain/student-profile/index.ts:31`). A Playwright `addInitScript`
 * can JSON.stringify this and write it to localStorage under
 * `pre-utn.profiles.v1` before Next.js hydration, so the practice UI has an
 * active student identity from the first render.
 *
 * The timestamp is a stable ISO constant so companion vitest tests can assert
 * exact equality without flakiness.
 */

import type {
  ProfilesState,
  StudentProfile,
} from "../../../src/domain/student-profile/index";

/**
 * Stable ISO timestamp shared by the challenge-smoke-e2e fixtures.
 * Chosen so companion tests can assert exact equality on `createdAt` /
 * `lastActiveAt`.
 */
export const DEFAULT_FIXTURE_TIMESTAMP = "2026-06-17T10:00:00.000Z";

/** Default display name for a seeded profile. */
const DEFAULT_DISPLAY_NAME = "E2E Test User";

export interface BuildStudentProfileInput {
  readonly studentId: string;
  /** Override the default display name ("E2E Test User"). */
  readonly displayName?: string;
  /** Override the stable timestamp used for `createdAt` / `lastActiveAt`. */
  readonly timestamp?: string;
}

/**
 * Build a single-profile `ProfilesState` fixture.
 *
 * The returned state has exactly one profile keyed to `studentId`, with
 * `activeStudentId` set to the same id — matching the canary seed described
 * in `openspec/changes/challenge-smoke-e2e/design.md`.
 */
export function buildStudentProfileFixture(
  input: BuildStudentProfileInput,
): ProfilesState {
  const { studentId } = input;
  const displayName = input.displayName ?? DEFAULT_DISPLAY_NAME;
  const timestamp = input.timestamp ?? DEFAULT_FIXTURE_TIMESTAMP;

  const profile: StudentProfile = {
    studentId,
    displayName,
    createdAt: timestamp,
    lastActiveAt: timestamp,
  };

  return {
    profiles: [profile],
    activeStudentId: studentId,
  };
}
