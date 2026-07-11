/**
 * S0d — Generic loader type hardening (focused contract tests).
 *
 * The generic challenge loader MUST reject free-form input types and
 * MUST preserve difficulty 4/5 plus MC option strings containing
 * intervals / unions / radicals / logs (kept as opaque strings —
 * no eval). Free-form input is forbidden by AGENTS.md.
 */

import { describe, test, expect } from "vitest";
import { validateChallengeEntry } from "@/lib/challenges/loader";

function makeBase(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: "ex.u3.ecuaciones_lineales.desafio-01",
    skillId: "mat.u3.ecuaciones_lineales",
    type: "multiple-choice",
    difficulty: 5,
    prompt: "Sample challenge",
    options: ["[-2, 5]", "(-∞, -2]", "(-∞, 5]", "(2, +∞)"],
    // `expectedAnswer` MUST be one of `options` exactly.
    expectedAnswer: "[-2, 5]",
    commonErrorTags: [],
    pedagogicalNote: "Note",
    challengeSection: true,
    category: "desafio",
    tags: ["desafio", "integrador"],
    canonicalTrace: [
      {
        path: "content/matematica/challenges/unit-3.json",
        section: "sec",
        sourceUse: "canonical-source" as const,
        pedagogicalIntent: "Evalúa integración",
      },
    ],
    ...overrides,
  };
}

describe("S0d — supported structured challenge types parse", () => {
  test("multiple-choice at difficulty 5 parses end-to-end", () => {
    expect(() => validateChallengeEntry(makeBase())).not.toThrow();
  });
  test("multiple-choice at difficulty 4 parses (S10 compatibility)", () => {
    expect(() =>
      validateChallengeEntry(makeBase({ difficulty: 4 }))
    ).not.toThrow();
  });
  test.each([
    ["true-false"],
    ["numerical"],
  ] as const)("non-MC type `%s` is accepted by the loader", (type) => {
    // Non-MC types use a simple scalar expectedAnswer (no `options`
    // binding), so the AGENTS.md prohibited-pattern guard does not fire.
    // `matching` / `ordering` / `graphical` are intentionally absent
    // here — they're shared with the base Exercise surface but the
    // challenge loader does not yet ship structured controls or
    // evaluators for them (see "unsupported" describe block below).
    const { options: _dropOptions, ...rest } = makeBase({
      type,
      expectedAnswer: type === "true-false" ? "Verdadero" : "5",
    });
    void _dropOptions;
    expect(() => validateChallengeEntry(rest)).not.toThrow();
  });
  // fill-blank carries the strict AGENTS.md guard: a structured-math shape
  // like "[-2, 5]" is forbidden, but a simple scalar token IS accepted.
  test("non-MC type `fill-blank` is accepted with a simple scalar expectedAnswer", () => {
    const { options: _dropOptions, ...rest } = makeBase({
      type: "fill-blank",
      expectedAnswer: "5",
    });
    void _dropOptions;
    expect(() => validateChallengeEntry(rest)).not.toThrow();
  });
});

describe("S0d — unsupported / free-form challenge types are rejected", () => {
  test.each([
    "text",
    "free-response",
    "symbolic",
    "essay",
    "open-ended",
    "unknown",
    // `matching` / `ordering` / `graphical` are intentionally NOT yet
    // shipped in the challenge loader — the structured controls and
    // evaluators for these types live in the base Exercise surface, but
    // the challenge catalog does NOT yet replicate them. Until they do,
    // the loader rejects the type up front so a JSON entry never lands
    // in the manual-review bucket by accident. They MUST be re-added
    // to `VALID_CHALLENGE_TYPES` (and these tests adjusted) in the
    // same commit that ships the matching evaluators.
    "matching",
    "ordering",
    "graphical",
  ] as const)(
    "loader rejects unsupported challenge type `%s` (AGENTS.md prohibition)",
    (type) => {
      expect(() => validateChallengeEntry(makeBase({ type }))).toThrow();
    }
  );
  test("loader rejects a non-string type literal", () => {
    expect(() =>
      validateChallengeEntry(makeBase({ type: 42 as unknown as string }))
    ).toThrow();
  });
  test("loader rejects a missing type literal entirely", () => {
    const { type: _drop, ...rest } = makeBase();
    void _drop;
    expect(() => validateChallengeEntry(rest)).toThrow();
  });
});

describe("S0d — MC option strings with structured-math fragments are preserved", () => {
  test("interval notation is preserved verbatim", () => {
    const parsed = validateChallengeEntry(
      makeBase({
        expectedAnswer: "[-2, 5]",
        options: ["(-∞, -2]", "[-2, 5]", "(2, +∞)", "(a, b)"],
      })
    );
    expect(parsed.expectedAnswer).toBe("[-2, 5]");
    expect(parsed.options).toEqual(["(-∞, -2]", "[-2, 5]", "(2, +∞)", "(a, b)"]);
  });
  test("union / set-builder symbols are preserved verbatim", () => {
    const parsed = validateChallengeEntry(
      makeBase({
        expectedAnswer: "A ∪ B",
        options: ["A ∪ B", "A ∩ B", "A \\ B", "(A ∪ B) ∩ C"],
      })
    );
    expect(parsed.options).toEqual(["A ∪ B", "A ∩ B", "A \\ B", "(A ∪ B) ∩ C"]);
  });
  test("radical / logarithm / complex-number fragments preserved verbatim", () => {
    for (const options of [
      ["√2", "∛2", "(√a + √b)"],
      ["log_2(x)", "ln(x)", "log x"],
      ["1+i", "1-i", "(1+i)(1-i)"],
    ] as const) {
      const parsed = validateChallengeEntry(
        makeBase({ expectedAnswer: options[0], options: [...options] })
      );
      expect(parsed.options).toEqual(options);
    }
  });
});
