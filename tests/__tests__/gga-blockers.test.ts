/**
 * GGA BLOCKER FIX — focused regression tests for the 10 review blockers
 * flagged by the dual-judge review of `feat/align-u3-practice-official-exercises`.
 *
 * Each test pins one blocker. Compatibility fixtures stay GREEN throughout.
 *
 *  1. isProgressMap validate activeStudentId and nested parseProgress
 *  2. Challenge object options preserve validated label and intervalRepresentation
 *  3. Challenge skillId must be in known skill catalog
 *  4. parseOptionalObjectArray present non-array must throw
 *  5. parseCanonicalTraceArray missing/malformed must fail where required
 *  6. progressionOrder finite nonnegative
 *  7. runLegacyMigration validate every legacy PracticeAttempt field
 *
 * Blockers 8, 9, 10 (unused imports) are pinned by `tsc --noEmit` /
 * `tsc --noEmit --noUnusedLocals` rather than by behavioral tests.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  applyExerciseDefaults,
  parseRecord,
  parseWorkedExample,
} from "@/domain/catalog/content-loaders";
import { validateChallengeEntry } from "@/lib/challenges/loader";
import { parseProgress, isLegacyShape } from "@/lib/practice-progress";
import { FROZEN_U3_PRACTICE_PROGRESS_BASELINE } from "../fixtures/compatibility/u3-practice-progress-baseline";
import { KNOWN_SKILL_IDS } from "@/domain/models/skill-catalog";

// ---------------------------------------------------------------------------
// Block 6: progressionOrder finite nonnegative
// ---------------------------------------------------------------------------

describe("GGA Block 6 — progressionOrder finite nonnegative", () => {
  function loaded(id: string, order: unknown): ReturnType<typeof applyExerciseDefaults> {
    const raw: Record<string, unknown> = {
      id,
      skillId: "mat.u3.logaritmicas",
      type: "multiple-choice",
      difficulty: 1,
      prompt: "p",
      expectedAnswer: "A",
      commonErrorTags: [],
      pedagogicalNote: "n",
      options: ["A", "B"],
      progressionFamily: "log-expansion",
      progressionOrder: order,
    };
    return applyExerciseDefaults(parseRecord(raw, `test[${id}]`));
  }

  test("positive progressionOrder survives", () => {
    expect(loaded("ex.u3.logaritmicas.7", 2).progressionOrder).toBe(2);
  });

  test("zero progressionOrder survives (boundary of nonnegativity)", () => {
    expect(loaded("ex.u3.logaritmicas.7", 0).progressionOrder).toBe(0);
  });

  test("negative progressionOrder is dropped (silently rejected)", () => {
    const out = loaded("ex.u3.logaritmicas.7", -1);
    expect(out.progressionOrder).toBeUndefined();
    // progressionFamily is independent — the comparator requires BOTH fields
    // to fire the override, so dropping only the order is sufficient.
  });

  test("deeply negative progressionOrder is dropped", () => {
    expect(loaded("ex.u3.logaritmicas.7", -100).progressionOrder).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Block 4: parseOptionalObjectArray present non-array must throw
// ---------------------------------------------------------------------------

describe("GGA Block 4 — parseOptionalObjectArray rejects present-but-not-array", () => {
  // parseOptionalObjectArray is the internal helper; we exercise it
  // through parseWorkedExample which parses
  // `steps[i].intervalRepresentations` for each step. The legacy helper
  // silently returned `undefined` when the field was present but not an
  // array — a malformed JSON entry would then slip through the loader
  // with `intervalRepresentations` set to `undefined`, indistinguishable
  // from an absent field. The fix MUST throw so the loader fails fast.
  test("steps[i].intervalRepresentations present-but-not-array throws", () => {
    const raw = {
      id: "example-inecuaciones-lineales-1",
      skillId: "mat.u3.inecuaciones_lineales",
      problem: "Resolver x + 2 > 5",
      steps: [
        { order: 1, explanation: "step 1", intervalRepresentations: "not-an-array" },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "x > 3",
      pedagogicalNote: "Note",
      canonicalTrace: [
        {
          path: "content/matematica/examples/unit-3.json",
          section: "sec",
          sourceUse: "adapted",
          pedagogicalIntent: "x",
        },
      ],
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow();
  });

  test("absent intervalRepresentations is fine (undefined when missing)", () => {
    const raw = {
      id: "example-inecuaciones-lineales-1",
      skillId: "mat.u3.inecuaciones_lineales",
      problem: "Resolver x + 2 > 5",
      steps: [
        { order: 1, explanation: "step 1" },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "x > 3",
      pedagogicalNote: "Note",
      canonicalTrace: [
        {
          path: "content/matematica/examples/unit-3.json",
          section: "sec",
          sourceUse: "adapted",
          pedagogicalIntent: "x",
        },
      ],
    };
    expect(() => parseWorkedExample(raw, 0)).not.toThrow();
  });

  test("empty intervalRepresentations array is fine (treated as absent)", () => {
    const raw = {
      id: "example-inecuaciones-lineales-1",
      skillId: "mat.u3.inecuaciones_lineales",
      problem: "Resolver x + 2 > 5",
      steps: [
        { order: 1, explanation: "step 1", intervalRepresentations: [] },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "x > 3",
      pedagogicalNote: "Note",
      canonicalTrace: [
        {
          path: "content/matematica/examples/unit-3.json",
          section: "sec",
          sourceUse: "adapted",
          pedagogicalIntent: "x",
        },
      ],
    };
    expect(() => parseWorkedExample(raw, 0)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Block 3: Challenge skillId must be in known skill catalog
// ---------------------------------------------------------------------------

describe("GGA Block 3 — challenge skillId must be in KNOWN_SKILL_IDS", () => {
  const VALID_BASE = {
    id: "ex.u1.complejos.desafio-01",
    skillId: "mat.u1.complejos",
    type: "multiple-choice" as const,
    difficulty: 4 as const,
    prompt: "Sample challenge",
    expectedAnswer: "A",
    options: ["A", "B", "C"] as string[],
    commonErrorTags: [] as string[],
    pedagogicalNote: "Note",
    challengeSection: true as const,
    category: "desafio" as const,
    tags: ["desafio", "integrador"] as const,
    canonicalTrace: [
      {
        path: "content/matematica/challenges/unit-1.json",
        section: "sec",
        sourceUse: "canonical-source" as const,
        pedagogicalIntent: "Evalúa",
      },
    ],
  };

  test("rejects a challenge skillId that is not in KNOWN_SKILL_IDS", () => {
    // `mat.u3.fake_skill` matches the format regex `^mat\.u[1-6]\.` so the
    // format check passes; the catalog guard then rejects it because it is
    // not in KNOWN_SKILL_IDS.
    const entry = { ...VALID_BASE, skillId: "mat.u3.fake_skill" };
    expect(() => validateChallengeEntry(entry)).toThrow(/skillId/);
  });

  test("accepts a challenge skillId that IS in KNOWN_SKILL_IDS", () => {
    expect(KNOWN_SKILL_IDS.has("mat.u1.complejos")).toBe(true);
    expect(() => validateChallengeEntry(VALID_BASE)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Block 2: Challenge object options preserve validated label and
//          intervalRepresentation
// ---------------------------------------------------------------------------

describe("GGA Block 2 — challenge object options preserve label and intervalRepresentation", () => {
  const VALID_BASE = {
    id: "ex.u1.intervalos.desafio-01",
    skillId: "mat.u1.intervalos",
    type: "multiple-choice" as const,
    difficulty: 4 as const,
    prompt: "Marcá la opción cuyo intervalo es [-2, 5]",
    expectedAnswer: "[-2, 5]",
    commonErrorTags: [] as string[],
    pedagogicalNote: "Note",
    challengeSection: true as const,
    category: "desafio" as const,
    tags: ["desafio", "integrador"] as const,
    canonicalTrace: [
      {
        path: "content/matematica/challenges/unit-1.json",
        section: "sec",
        sourceUse: "canonical-source" as const,
        pedagogicalIntent: "Evalúa",
      },
    ],
  };

  test("object options with label+intervalRepresentation survive validation", () => {
    const parsed = validateChallengeEntry({
      ...VALID_BASE,
      options: [
        {
          value: "[-2, 5]",
          label: "Opción A: intervalo cerrado",
          intervalRepresentation: {
            id: "ir-1",
            notation: "[-2, 5]",
            setBuilderLabel: "{x : -2 ≤ x ≤ 5}",
            lower: { kind: "finite", value: -2 },
            upper: { kind: "finite", value: 5 },
            lowerInclusion: "closed",
            upperInclusion: "closed",
            ariaLabel: "Intervalo cerrado de -2 a 5",
          },
        },
        { value: "(-2, 5)", label: "Opción B: abierto" },
      ],
    });
    expect(parsed.options).toBeDefined();
    expect(parsed.options!.length).toBe(2);
    const first = parsed.options![0];
    // The result must be the full ExerciseOption shape, NOT a string.
    expect(typeof first).toBe("object");
    if (typeof first === "string") throw new Error("expected object option, got string");
    expect(first.value).toBe("[-2, 5]");
    expect(first.label).toBe("Opción A: intervalo cerrado");
    expect(first.intervalRepresentation).toBeDefined();
    expect(first.intervalRepresentation?.notation).toBe("[-2, 5]");
  });

  test("object options without intervalRepresentation keep just { value, label }", () => {
    const parsed = validateChallengeEntry({
      ...VALID_BASE,
      options: [
        { value: "[-2, 5]", label: "A" },
        { value: "(-2, 5)", label: "B" },
      ],
    });
    const first = parsed.options![0];
    expect(typeof first).toBe("object");
    if (typeof first === "string") throw new Error("expected object option, got string");
    expect(first.value).toBe("[-2, 5]");
    expect(first.label).toBe("A");
    expect(first.intervalRepresentation).toBeUndefined();
  });

  test("string options still work alongside object options", () => {
    const parsed = validateChallengeEntry({
      ...VALID_BASE,
      options: [
        "[-2, 5]",
        { value: "(-2, 5)", label: "B" },
      ],
    });
    expect(parsed.options![0]).toBe("[-2, 5]");
    const second = parsed.options![1];
    expect(typeof second).toBe("object");
    if (typeof second === "string") throw new Error("expected object option, got string");
    expect(second.value).toBe("(-2, 5)");
    expect(second.label).toBe("B");
  });

  // ─── GGA latest blocker — intervalRepresentation uses the runtime validator ───
  //
  // The previous loader accepted any non-null, non-array object as the
  // `intervalRepresentation` field value, then forwarded it RAW into the
  // typed `ChallengeExercise` contract via `as ExerciseOption`. That meant
  // a malformed IntervalRepresentation (e.g. `lower.value: "not-a-number"`)
  // would silently sail past the loader and corrupt downstream rendering.
  //
  // The fix routes the raw object through `parseIntervalRepresentation`
  // (the same runtime validator `content-loaders.ts` uses for the base
  // Exercise surface). A malformed shape now throws at module-init time
  // with a precise diagnostic; a valid shape round-trips through the
  // validator into a strictly-typed `ExerciseOption` literal — NO cast.

  test("rejects a malformed intervalRepresentation (missing notation)", () => {
    expect(() =>
      validateChallengeEntry({
        ...VALID_BASE,
        options: [
          {
            value: "[-2, 5]",
            label: "A",
            intervalRepresentation: {
              // `notation` missing — parseIntervalRepresentation rejects
              id: "ir-malformed-1",
              setBuilderLabel: "{x : -2 ≤ x ≤ 5}",
              lower: { kind: "finite", value: -2 },
              upper: { kind: "finite", value: 5 },
              lowerInclusion: "closed",
              upperInclusion: "closed",
              ariaLabel: "closed -2 to 5",
            },
          },
          "[-2, 5]",
        ],
      })
    ).toThrow(/notation|intervalRepresentation/);
  });

  test("rejects a malformed intervalRepresentation (non-numeric finite bound)", () => {
    expect(() =>
      validateChallengeEntry({
        ...VALID_BASE,
        options: [
          {
            value: "[-2, 5]",
            label: "A",
            intervalRepresentation: {
              id: "ir-malformed-2",
              notation: "[-2, 5]",
              setBuilderLabel: "{x : -2 ≤ x ≤ 5}",
              lower: { kind: "finite", value: "not-a-number" as unknown as number },
              upper: { kind: "finite", value: 5 },
              lowerInclusion: "closed",
              upperInclusion: "closed",
              ariaLabel: "closed -2 to 5",
            },
          },
          "[-2, 5]",
        ],
      })
    ).toThrow(/value|intervalRepresentation/);
  });

  test("rejects a malformed intervalRepresentation (lower > upper)", () => {
    // Validators with conflicting bounds must be rejected at load time.
    expect(() =>
      validateChallengeEntry({
        ...VALID_BASE,
        options: [
          {
            value: "[5, -2]",
            label: "A",
            intervalRepresentation: {
              id: "ir-malformed-3",
              notation: "[5, -2]",
              setBuilderLabel: "{x : 5 ≤ x ≤ -2}",
              lower: { kind: "finite", value: 5 },
              upper: { kind: "finite", value: -2 },
              lowerInclusion: "closed",
              upperInclusion: "closed",
              ariaLabel: "invalid: lower > upper",
            },
          },
          "[-2, 5]",
        ],
      })
    ).toThrow(/bounds|intervalRepresentation|less than/);
  });

  test("passes a fully-valid intervalRepresentation through the typed ExerciseOption (no cast)", () => {
    // The fix constructs the ExerciseOption literal from the
    // parseIntervalRepresentation return value. We assert the
    // returned option is the typed object (not a string) and that
    // every validator-required field survives the round-trip.
    const parsed = validateChallengeEntry({
      ...VALID_BASE,
      options: [
        {
          value: "[-2, 5]",
          label: "A",
          intervalRepresentation: {
            id: "ir-valid-1",
            notation: "[-2, 5]",
            setBuilderLabel: "{x : -2 ≤ x ≤ 5}",
            lower: { kind: "finite", value: -2 },
            upper: { kind: "finite", value: 5 },
            lowerInclusion: "closed",
            upperInclusion: "closed",
            ariaLabel: "Intervalo cerrado de -2 a 5",
          },
        },
        "[-2, 5]",
      ],
    });
    expect(parsed.options).toBeDefined();
    const first = parsed.options![0];
    expect(typeof first).toBe("object");
    if (typeof first === "string") throw new Error("expected object option, got string");
    expect(first.intervalRepresentation).toBeDefined();
    expect(first.intervalRepresentation?.id).toBe("ir-valid-1");
    expect(first.intervalRepresentation?.notation).toBe("[-2, 5]");
    expect(first.intervalRepresentation?.lower).toEqual({ kind: "finite", value: -2 });
    expect(first.intervalRepresentation?.upper).toEqual({ kind: "finite", value: 5 });
  });
});

// ---------------------------------------------------------------------------
// Block 5: parseCanonicalTraceArray missing/malformed must fail where required
// ---------------------------------------------------------------------------

describe("GGA Block 5 — required canonicalTrace must fail when missing or malformed", () => {
  test("Worked example with non-array canonicalTrace fails at parse time", () => {
    const raw = {
      id: "example-complejos-1",
      skillId: "mat.u1.complejos",
      problem: "Find the module of (3 - 4i).",
      steps: [
        { order: 1, explanation: "step 1" },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "5",
      pedagogicalNote: "Note",
      canonicalTrace: "not-an-array", // wrong shape — required surface
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow(/canonicalTrace/);
  });

  test("Worked example with empty canonicalTrace array fails at parse time", () => {
    const raw = {
      id: "example-complejos-1",
      skillId: "mat.u1.complejos",
      problem: "Find the module of (3 - 4i).",
      steps: [
        { order: 1, explanation: "step 1" },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "5",
      pedagogicalNote: "Note",
      canonicalTrace: [], // empty array — invalid for required surface
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow(/canonicalTrace/);
  });

  test("Worked example with missing canonicalTrace fails at parse time", () => {
    const raw = {
      id: "example-complejos-1",
      skillId: "mat.u1.complejos",
      problem: "Find the module of (3 - 4i).",
      steps: [
        { order: 1, explanation: "step 1" },
        { order: 2, explanation: "step 2" },
      ],
      finalAnswer: "5",
      pedagogicalNote: "Note",
      // canonicalTrace MISSING — required by WorkedExample contract
    };
    expect(() => parseWorkedExample(raw, 0)).toThrow(/canonicalTrace/);
  });
});

// ---------------------------------------------------------------------------
// Block 1: isProgressMap validate activeStudentId and nested parseProgress
// ---------------------------------------------------------------------------

describe("GGA Block 1 — isProgressMap nested validation", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete store[k];
      }),
      clear: vi.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    });
  });

  function setStored(key: string, value: unknown): void {
    const ls = (globalThis as { localStorage: { getItem: (k: string) => string | null } }).localStorage;
    (ls.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === key ? JSON.stringify(value) : null,
    );
  }

  function setProfile(activeId: string): void {
    const ls = (globalThis as { localStorage: { getItem: (k: string) => string | null } }).localStorage;
    const existing = (ls.getItem as unknown as ReturnType<typeof vi.fn>).getMockImplementation();
    (ls.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation((k: string) => {
      if (k === "pre-utn.profiles.v1") {
        return JSON.stringify({
          profiles: [{ studentId: activeId, displayName: "Test", createdAt: "2025-01-01" }],
          activeStudentId: activeId,
        });
      }
      return existing ? (existing as (k: string) => string | null)(k) : null;
    });
  }

  test("isLegacyShape accepts the frozen fixture (the new-shape envelope is NOT legacy)", () => {
    expect(isLegacyShape(FROZEN_U3_PRACTICE_PROGRESS_BASELINE)).toBe(false);
  });

  test("parseProgress accepts the frozen fixture's well-formed student slot", () => {
    const slot = FROZEN_U3_PRACTICE_PROGRESS_BASELINE.students[
      FROZEN_U3_PRACTICE_PROGRESS_BASELINE.activeStudentId
    ];
    const parsed = parseProgress(slot);
    expect(parsed).not.toBeNull();
    expect(parsed!.attempts).toHaveLength(1);
  });

  test("parseProgress rejects a malformed student slot (no unknown cast)", () => {
    const malformed = {
      attempts: "not-an-array",
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    expect(parseProgress(malformed)).toBeNull();
  });

  test("isProgressMap rejects activeStudentId that is not string|null (loadProgressRaw falls back to empty)", async () => {
    // The legacy isProgressMap only checks `students`. The fix MUST also
    // reject envelopes whose `activeStudentId` is not a string or null,
    // because loadProgressRaw treats such envelopes as untrusted and
    // falls back to EMPTY_PROGRESS.
    const { loadProgressRaw } = await import("@/lib/practice-progress");
    setProfile("stu-1");
    setStored("pre-utn.practice.v1", {
      students: {
        "stu-1": {
          attempts: [],
          accuracyBySkill: {},
          trendBySkill: {},
          lastPracticedBySkill: {},
          diagnosticResult: null,
          studyPlan: null,
        },
      },
      activeStudentId: 42, // wrong type — must reject the envelope
    });

    const result = loadProgressRaw();
    // The fix: a non-string|null activeStudentId MUST NOT be accepted as a
    // valid map; loadProgressRaw returns EMPTY_PROGRESS in that case.
    expect(result.attempts).toEqual([]);
    expect(result.accuracyBySkill).toEqual({});
  });

  test("isProgressMap rejects a student slot whose shape fails parseProgress (loadProgressRaw drops it)", async () => {
    // Per-student validation: a malformed slot must NOT be returned as
    // a valid PracticeProgress. The fix MUST recurse into each slot
    // through parseProgress so a malformed one is filtered out.
    const { loadProgressRaw } = await import("@/lib/practice-progress");
    setProfile("bad-student");
    setStored("pre-utn.practice.v1", {
      students: {
        "bad-student": {
          attempts: "not-an-array", // malformed slot
          accuracyBySkill: {},
          trendBySkill: {},
          lastPracticedBySkill: {},
          diagnosticResult: null,
          studyPlan: null,
        },
      },
      activeStudentId: "bad-student",
    });

    // The fallback returns EMPTY_PROGRESS, never the malformed slot.
    const result = loadProgressRaw();
    expect(result.attempts).toEqual([]);
    expect(result.accuracyBySkill).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Block 7: runLegacyMigration validate every legacy PracticeAttempt field
// ---------------------------------------------------------------------------

describe("GGA Block 7 — legacy migration validates every PracticeAttempt field", () => {
  test("legacy attempt missing required PracticeAttempt field is rejected by parseProgress", () => {
    // Pre-WU5 legacy shape: flat object with `attempts` array.
    // After migration the migrated slot is parsed by parseProgress; a
    // malformed attempt MUST NOT survive that parse. This test pins the
    // validator the migration downstream depends on so the migration's
    // resulting slot can be safely consumed.
    const legacyRaw = {
      attempts: [
        // attempt missing the `correct` field — must NOT pass parseProgress
        {
          exerciseId: "ex.u1.01",
          skillId: "mat.u1.propiedades_operaciones_reales",
          answeredAt: "2024-12-01T00:00:00.000Z",
          timeMs: 0,
          attemptIndex: 1,
        },
      ],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    // parseProgress rejects the legacy-shape attempt at validation time
    expect(parseProgress(legacyRaw)).toBeNull();
  });

  test("loadProgressRaw migrates legacy data, applies defaults, and validates every attempt", async () => {
    // The fix: runLegacyMigration normalizes missing timeMs/attemptIndex,
    // then validates each entry through isValidAttempt. The legacy data
    // here has TWO attempts: one well-formed (after defaults) and one
    // missing the required `correct` field — only the well-formed one
    // must survive migration. The previous `as PracticeAttempt[]` cast
    // would smuggle BOTH attempts through; the fix drops the malformed
    // entry so the migrated slot is strictly well-formed.
    const { loadProgressRaw } = await import("@/lib/practice-progress");

    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete store[k];
      }),
      clear: vi.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    });

    // Set up an active profile so loadProgressRaw can resolve the slot.
    store["pre-utn.profiles.v1"] = JSON.stringify({
      profiles: [
        { studentId: "legacy-stu", displayName: "Legacy", createdAt: "t0" },
      ],
      activeStudentId: "legacy-stu",
    });
    store["pre-utn.practice.v1"] = JSON.stringify({
      attempts: [
        // Well-formed (after defaults applied: timeMs/attemptIndex).
        {
          exerciseId: "ex.u1.01",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2024-12-01T00:00:00.000Z",
        },
        // Missing `correct` — must be dropped by isValidAttempt.
        {
          exerciseId: "ex.u1.02",
          skillId: "mat.u1.propiedades_operaciones_reales",
          answeredAt: "2024-12-01T01:00:00.000Z",
        },
      ],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });

    const result = loadProgressRaw();
    // The migration applies defaults (timeMs: 0, attemptIndex: 1) to
    // both attempts, then filters out the malformed one (no `correct`).
    // The surviving slot has exactly ONE attempt.
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].exerciseId).toBe("ex.u1.01");
    expect(result.attempts[0].correct).toBe(true);
  });
});