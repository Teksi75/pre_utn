/**
 * Challenge catalog loader — loads challenge exercises from static JSON.
 *
 * Lives in src/lib/ (not src/domain/) because it uses a mutable module-level
 * parse cache and throws on malformed entries — runtime side effects that
 * violate domain purity rules in AGENTS.md.
 *
 * The domain facade (src/domain/catalog/challenges/index.ts) re-exports
 * the public API from this module.
 */

import type { ChallengeCanonicalTrace, ChallengeExercise, ChallengeSourceUse } from "@/domain/catalog/challenges/types";
import type { SkillId } from "@/domain/models/skill";
import type { ExerciseOption } from "@/domain/models/exercise";
import type { IntervalRepresentation } from "@/domain/intervals/representation";
import { validateIntervalRepresentation } from "@/domain/intervals/representation";
import { KNOWN_SKILL_IDS } from "@/domain/models/skill-catalog";
import { parseRecord, parseIntervalRepresentation } from "@/domain/catalog/content-loaders";

/**
 * Detect AGENTS.md-prohibited structured-math patterns in a free-text
 * answer value. The exact patterns are listed in the project AGENTS.md
 * "Diseño de ejercicios" section:
 *
 *   - raíces (e.g. "√2", "\\sqrt{2}")
 *   - fracciones con raíces
 *   - intervalos (e.g. "[-1, 1]", "(-∞, 0)")
 *   - conjuntos solución con unión o intersección (e.g. "(-∞, 1) ∪ (1, ∞)")
 *   - números complejos en forma `a+bi` (e.g. "2+3i")
 *   - dos soluciones del tipo `x = -2` o `x = 2` (compound forms like
 *     "x = -2 o x = 2", "x = ±3")
 *   - expresiones logarítmicas completas (e.g. "log_2(8)", "ln(2)")
 *
 * Returns the matched pattern name when a structured-math shape is found,
 * or null when the value is a simple token (number, single word, etc.).
 *
 * This is intentionally conservative — it errs on the side of rejecting
 * ambiguous free-text forms so a malformed fill-blank challenge fails
 * fast at load time instead of silently shipping with an unsafe input.
 */
function detectProhibitedStructuredMath(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  // Square roots: literal `√` or LaTeX `\sqrt`.
  if (/[√]/.test(v) || /\\sqrt\b/.test(v)) return "raíz (√ o \\sqrt)";
  // Intervals: brackets/parentheses with content AND an infinity symbol,
  // OR bracketed forms with a comma (covers `[-1, 1]`, `(-∞, 0)`).
  if (/[\[\(].+,.+[\]\)]/.test(v) && /∞|->/.test(v)) {
    return "intervalo con infinito";
  }
  // Plain bracketed interval: comma-separated bounded endpoints.
  if (/^[\[\(][^[\]]+,[^[\]]+[\]\)]$/.test(v)) {
    return "intervalo (notación con corchetes/paréntesis)";
  }
  // Union / intersection set operations.
  if (/[∪∩]/.test(v)) return "operación de conjuntos (∪ o ∩)";
  // Complex number `a+bi` form (with optional sign). We accept the form
  // when the value contains a literal trailing `i` (after a numeric term
  // with optional sign) AND is NOT preceded by a word boundary that would
  // make it a different token (e.g. "indice", "magnitud"). The forbidden
  // form is short like "2+3i", "-1-2i", "3i", etc.
  if (/(?<![a-zA-ZáéíóúñÁÉÍÓÚÑ])-?\s*\d+\s*[+\-]\s*\d+\s*i(?![a-zA-Z])/.test(v)) {
    return "número complejo (forma a+bi)";
  }
  // Pure "Ni" complex form (e.g. "3i", "-2i").
  if (/^-?\s*\d+\s*i(?![a-zA-Z])/.test(v)) {
    return "número complejo (forma Ni)";
  }
  // Two-solution compounds: "x = -2 o x = 2", "x = -2, x = 2",
  // "x = ±3", "x = ±3 o x = ∓3", or `x = N o x = M` after normalization.
  if (/[±∓]/.test(v)) return "solución con ± o ∓ (dos soluciones)";
  if (/\b\w\s*=\s*[^=]+\s*(?:o|,|;)\s*\w\s*=/.test(v)) {
    return "dos soluciones (forma `x = -k o x = k`)";
  }
  if (/^x\s*=\s*[^=]+\s*(?:o|,|;)\s*x\s*=/.test(v)) {
    return "dos soluciones (forma `x = -k o x = k`)";
  }
  // Logarithmic expressions: "log_2(8)", "log(2)", "ln(x)", "\\log_2 x",
  // "log²(8)", etc. We match `log`/`ln` as either a standalone token OR a
  // prefix to a math expression shape (digit/parenthesis/underscore/power).
  // Spanish words like "lógica" / "logística" are excluded by requiring
  // `log`/`ln` to be at the start of the string OR preceded by whitespace /
  // parenthesis AND followed by a math-expression continuation.
  if (
    /(?:^|[^a-zA-ZáéíóúñÁÉÍÓÚÑ])(?:log|ln)(?:_?\d|[(\^]|\s|$)/.test(v) ||
    /\\(?:log|ln)\b/.test(v)
  ) {
    return "expresión logarítmica (log, ln, \\log)";
  }
  return null;
}

/**
 * Validate that a non-multiple-choice challenge `expectedAnswer` does not
 * force the student to type one of the AGENTS.md-prohibited structured
 * mathematical free-text patterns. Returns a descriptive Error when a
 * prohibited shape is detected, or null when the answer shape is safe.
 *
 * Per AGENTS.md "Diseño de ejercicios", structured math free-text is
 * fragile to grade and ambiguous to type, so the loader MUST fail fast at
 * module initialization rather than silently shipping an unsafe input
 * control. The accepted challenge types are exactly the structured set
 * (multiple-choice already has its own validation), and fill-blank is
 * specifically called out as the dangerous form because a student would
 * be required to type the answer verbatim.
 */
function validateNonMcAnswerShape(
  type: string,
  expectedAnswer: unknown,
): Error | null {
  // Shared requirement for every non-MC type: expectedAnswer must be a
  // non-empty string. This rejects null, numbers, objects, and "" up front
  // so the per-type rules below can assume a string is in hand.
  if (typeof expectedAnswer !== "string" || expectedAnswer.length === 0) {
    return new Error(
      `${type} challenge expectedAnswer must be a non-empty string; got: ${JSON.stringify(expectedAnswer)}`,
    );
  }

  // Per-type shape contract. The previously permissive version only
  // checked fill-blank's prohibited-pattern guard; the other non-MC
  // types shipped unchecked. We now require the documented shape for
  // each type so a malformed entry fails fast at module init.
  switch (type) {
    case "numerical": {
      // Scalar only: a single finite number, NOT a set, NOT a range,
      // NOT a multi-value token list. Scientific notation like "1e3"
      // counts as scalar. The challenge answer is graded by exact
      // numeric match — anything but a scalar cannot be compared
      // unambiguously.
      const trimmed = expectedAnswer.trim();
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric) || /[;,{}\[\]\(\)=±∓|]/.test(trimmed)) {
        return new Error(
          `numerical challenge expectedAnswer must be a single finite scalar; got: ${JSON.stringify(expectedAnswer)} (sets, ranges, equations, or multi-value lists are forbidden)`,
        );
      }
      return null;
    }
    case "true-false": {
      // Boolean-equivalent string, exact match. Both Spanish
      // ("Verdadero"/"Falso") and English ("true"/"false") literals are
      // accepted so a localized UI can switch without breaking the
      // contract.
      const allowed = ["Verdadero", "Falso", "true", "false"];
      if (!allowed.includes(expectedAnswer)) {
        return new Error(
          `true-false challenge expectedAnswer must be one of ${allowed.join(" | ")}; got: ${JSON.stringify(expectedAnswer)}`,
        );
      }
      return null;
    }
    case "fill-blank": {
      const prohibited = detectProhibitedStructuredMath(expectedAnswer);
      if (prohibited !== null) {
        return new Error(
          `fill-blank challenge expectedAnswer must be a simple non-structured value; got a prohibited AGENTS.md shape "${prohibited}" in "${expectedAnswer}" (free-text structured math like roots, intervals, sets, complex numbers, two-solution forms, or logarithmic expressions is FORBIDDEN)`,
        );
      }
      return null;
    }
    default:
      // Should never reach here — the type whitelist above catches
      // everything outside the documented set, including the
      // `matching` / `ordering` / `graphical` types that the challenge
      // loader does NOT yet support. Reaching this branch means a future
      // type was added to the whitelist without updating this switch.
      return new Error(
        `non-multiple-choice type "${type}" is not a supported challenge type for expectedAnswer validation`,
      );
  }
}

// ---------------------------------------------------------------------------
// Static JSON imports — loaded once at module initialization
// ---------------------------------------------------------------------------

import unit1ChallengesRaw from "../../../content/matematica/challenges/unit-1.json";
import unit2ChallengesRaw from "../../../content/matematica/challenges/unit-2.json";
import unit3ChallengesRaw from "../../../content/matematica/challenges/unit-3.json";

// ---------------------------------------------------------------------------
// Raw registry
// ---------------------------------------------------------------------------

type RawChallengeEntry = Record<string, unknown>;

const UNIT_REGISTRY: ReadonlyArray<readonly RawChallengeEntry[]> = [
  unit1ChallengesRaw as readonly RawChallengeEntry[],
  unit2ChallengesRaw as readonly RawChallengeEntry[],
  unit3ChallengesRaw as readonly RawChallengeEntry[],
];

// ---------------------------------------------------------------------------
// Cache — lazily populated on first access per unit
// ---------------------------------------------------------------------------

type ParseCache = Map<number, readonly ChallengeExercise[]>;

const cache: ParseCache = new Map();

function parseCacheForUnit(unit: number): readonly ChallengeExercise[] {
  const cached = cache.get(unit);
  if (cached !== undefined) return cached;

  const unitIndex = unit - 1;
  if (unitIndex < 0 || unitIndex >= UNIT_REGISTRY.length) {
    return [];
  }

  const rawEntries = UNIT_REGISTRY[unitIndex];
  const parsed: ChallengeExercise[] = [];

  for (const raw of rawEntries) {
    try {
      const entry = validateChallengeEntry(raw);
      parsed.push(entry as ChallengeExercise);
    } catch (err) {
      // Fail fast at load time — malformed challenge JSON is a development error
      throw new Error(
        `Failed to parse challenge entry (id=${raw["id"] ?? "unknown"}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  cache.set(unit, parsed);
  return parsed;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SOURCE_USES: ReadonlySet<ChallengeSourceUse> = new Set([
  "canonical-source",
  "adapted",
  "calibrated-from-exam",
  "solution-pattern",
]);

/**
 * Supported challenge types on the generic surface.
 *
 * Per the AGENTS.md design rule, free-form input (`text`, `free-response`,
 * `symbolic`, etc.) is FORBIDDEN for structured-math challenges. The
 * loader enforces this explicitly so a malformed JSON shape fails fast
 * at module initialization rather than silently shipping with an
 * unsafe input control. Difficulty 4 or 5 compatibility is preserved
 * (other scenarios in the delta spec cover it).
 *
 * `matching` / `ordering` / `graphical` are intentionally EXCLUDED here.
 * Those types are listed in the shared `ExerciseType` union because they
 * have structured controls / evaluators in the base Exercise surface,
 * but the challenge catalog does NOT yet ship structured controls or
 * evaluators for them. Until those land, the loader rejects the types
 * outright so a challenge JSON entry never falls into the
 * manual-review bucket by accident — it MUST be added back to this set
 * IN THE SAME COMMIT that ships the corresponding evaluators (the
 * minimal-safe approach).
 */
const VALID_CHALLENGE_TYPES: ReadonlySet<string> = new Set([
  "multiple-choice",
  "true-false",
  "numerical",
  "fill-blank",
]);

const CHALLENGE_ID_PATTERN = /^ex\.u([1-6])\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

/**
 * Validate a single challenge entry at runtime.
 * Throws a descriptive Error if the entry is invalid.
 *
 * Validation rules (from SDD design):
 * - canonicalTrace: required, ≥1 entry
 * - Each trace entry must have all 4 fields: path, section, sourceUse, pedagogicalIntent
 * - sourceUse must be one of: canonical-source | adapted | calibrated-from-exam | solution-pattern
 * - challengeSection must be exactly true
 * - category must be exactly "desafio"
 * - tags must include both "desafio" and "integrador"
 * - difficulty must be 4 or 5
 * - ID must match pattern: ex.u{unit}.{slug}.desafio-{index}
 */
export function validateChallengeEntry(raw: unknown): ChallengeExercise {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("challenge entry must be a non-null, non-array object");
  }

  const entry = raw as Record<string, unknown>;

  // --- ID format ---
  const id = entry["id"];
  if (typeof id !== "string" || !CHALLENGE_ID_PATTERN.test(id)) {
    throw new Error(`id must match pattern ex.u{unit}.{slug}.{slug}; got: ${JSON.stringify(id)}`);
  }

  // --- skillId ---
  // Required string matching "mat.u{1-6}...." AND present in the known
  // skill catalog (KNOWN_SKILL_IDS). Format-only validation would let
  // a typo (`mat.u3.translacion_lenguaje_verbal`) ship a challenge that
  // unit/skill queries cannot reach; the catalog check pins the entry
  // to the documented catalog and surfaces a malformed challenge at
  // module init rather than silently breaking the dynamic.
  const skillId = entry["skillId"];
  if (typeof skillId !== "string" || !/^mat\.u[1-6]\./.test(skillId)) {
    throw new Error(
      `skillId must be a string matching "mat.u{1-6}...."; got: ${JSON.stringify(skillId)}`,
    );
  }
  if (!KNOWN_SKILL_IDS.has(skillId as SkillId)) {
    throw new Error(
      `skillId ${JSON.stringify(skillId)} is not in the known skill catalog; challenge entries must reference a declared SkillId so downstream unit/skill queries can find them`,
    );
  }

  // --- prompt (required, non-empty) ---
  const prompt = entry["prompt"];
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error(`prompt must be a non-empty string; got: ${JSON.stringify(prompt)}`);
  }

  // --- commonErrorTags (required, array of strings) ---
  const commonErrorTags = entry["commonErrorTags"];
  if (!Array.isArray(commonErrorTags)) {
    throw new Error(
      `commonErrorTags must be an array; got: ${JSON.stringify(commonErrorTags)}`,
    );
  }
  for (let i = 0; i < commonErrorTags.length; i++) {
    if (typeof commonErrorTags[i] !== "string") {
      throw new Error(
        `commonErrorTags[${i}] must be a string; got: ${JSON.stringify(commonErrorTags[i])}`,
      );
    }
  }

  // --- pedagogicalNote (required, string) ---
  const pedagogicalNote = entry["pedagogicalNote"];
  if (typeof pedagogicalNote !== "string") {
    throw new Error(
      `pedagogicalNote must be a string; got: ${JSON.stringify(pedagogicalNote)}`,
    );
  }

  // --- unit (required by ChallengeExercise type) ---
  // The ChallengeExercise contract requires `unit: number`. Existing
  // challenge JSON does NOT carry an explicit unit — it's derivable
  // from skillId. We accept either:
  //   1. An explicit `unit` field (validated against the unit derived
  //      from skillId; MUST match), or
  //   2. An absent `unit` (injected from skillId before return).
  // Either way, the returned record carries a fully-typed `unit`
  // derived from the skillId, never a default that contradicts the
  // skillId. This avoids the unjustified cast `as unknown as
  // ChallengeExercise` hiding a missing-unit defect.
  const derivedUnit = unitFromSkillId(skillId);
  if (derivedUnit === null) {
    throw new Error(
      `unit could not be derived from skillId ${JSON.stringify(skillId)}; expected "mat.u{1-6}...."`,
    );
  }
  const rawUnit = entry["unit"];
  if (rawUnit !== undefined) {
    if (typeof rawUnit !== "number" || !Number.isInteger(rawUnit) || rawUnit < 1 || rawUnit > 6) {
      throw new Error(`unit must be an integer in [1, 6]; got: ${JSON.stringify(rawUnit)}`);
    }
    if (rawUnit !== derivedUnit) {
      throw new Error(
        `unit (${rawUnit}) must match the unit derived from skillId (${derivedUnit}); got: skillId=${JSON.stringify(skillId)}`,
      );
    }
  }
  // Pin unit from skillId so the returned record satisfies the typed
  // contract without an unjustified cast.
  entry["unit"] = derivedUnit;

  // --- challengeSection ===
  if (entry["challengeSection"] !== true) {
    throw new Error(`challengeSection must be true; got: ${JSON.stringify(entry["challengeSection"])}`);
  }

  // --- category ===
  if (entry["category"] !== "desafio") {
    throw new Error(`category must be "desafio"; got: ${JSON.stringify(entry["category"])}`);
  }

  // --- difficulty ---
  const difficulty = entry["difficulty"];
  if (typeof difficulty !== "number" || (difficulty !== 4 && difficulty !== 5)) {
    throw new Error(`difficulty must be 4 or 5; got: ${JSON.stringify(difficulty)}`);
  }

  // --- type (generic hardening; S0) ---
  // AGENTS.md prohibits free-form input types for structured math.
  // The accepted challenge types are exactly the structured set above;
  // anything else (especially `text` and `free-response`) is rejected
  // up front so the module fails fast instead of silently shipping an
  // unsafe input control. Difficulty 4|5 compatibility is preserved
  // because the type check is independent of the difficulty check.
  const type = entry["type"];
  if (typeof type !== "string" || !VALID_CHALLENGE_TYPES.has(type)) {
    throw new Error(
      `type must be one of ${[...VALID_CHALLENGE_TYPES].join(" | ")}; got: ${JSON.stringify(type)} (free-form input types like "text" are forbidden by AGENTS.md)`
    );
  }

  // --- expectedAnswer ∈ options (defense-in-depth for multiple-choice) ---
  // The evaluator uses exact matching against options, so a visible correct
  // option whose text differs from expectedAnswer would be graded wrong even
  // when the student picks it. Enforce the invariant at load time.
  //
  // Captured as a typed local so the return-value constructor below can
  // attach an `options` field WITHOUT a structural cast — the previous
  // `as unknown as ChallengeExercise` hid drifted/untyped option strings.
  //
  // The full `ExerciseOption` shape (string | { value, label,
  // intervalRepresentation? }) is preserved verbatim. The previous
  // loader flattened object options down to their `.value` string,
  // discarding `label` and `intervalRepresentation`. Graphical /
  // interval challenges need the full shape to render correctly; the
  // loader MUST carry label and intervalRepresentation through to
  // downstream consumers.
  //
  // `intervalRepresentation` is validated through the SAME runtime
  // validator the base Exercise surface uses (`parseIntervalRepresentation`
  // in content-loaders). The previous loader only did a structural
  // spot-check (`typeof === 'object' && !null && !Array.isArray`) and
  // then cast the raw object into the typed `ExerciseOption` literal —
  // a malformed IntervalRepresentation (e.g. `lower.value: "not-a-number"`)
  // would silently sail past the loader and corrupt downstream rendering.
  // The fix: route `intervalRaw` through `parseIntervalRepresentation`
  // so a malformed shape fails fast with the validator's own precise
  // diagnostic, and the loader builds the typed `ExerciseOption` literal
  // from the validator's structurally-typed return value — NO cast.
  let validatedOptions: readonly ExerciseOption[] | undefined;
  if (entry["type"] === "multiple-choice") {
    const rawOptions = entry["options"];
    if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
      throw new Error(
        `multiple-choice challenge requires at least 2 options; got: ${JSON.stringify(rawOptions)}`,
      );
    }
    const options: ExerciseOption[] = [];
    const optionValues: string[] = [];
    for (let i = 0; i < rawOptions.length; i++) {
      const o = rawOptions[i];
      const ctx = `${id}.options[${i}]`;
      if (typeof o === "string") {
        options.push(o);
        optionValues.push(o);
        continue;
      }
      if (typeof o !== "object" || o === null) {
        throw new Error(
          `${ctx} must be a string or { value: string, label?: string, intervalRepresentation?: {...} }; got: ${JSON.stringify(o)}`,
        );
      }
      const record = o as Record<string, unknown>;
      const value = record["value"];
      if (typeof value !== "string" || value.length === 0) {
        throw new Error(
          `${ctx}.value must be a non-empty string; got: ${JSON.stringify(value)}`,
        );
      }
      const labelRaw = record["label"];
      const intervalRaw = record["intervalRepresentation"];
      if (labelRaw === undefined && intervalRaw === undefined) {
        // Bare `{ value }` object — collapse to a plain string to keep
        // the consumer surface uniform and to avoid carrying forward
        // an empty `{ value }` shell.
        options.push(value);
        optionValues.push(value);
        continue;
      }
      // Full object option: preserve label + intervalRepresentation.
      // Both fields are optional; the actual ExerciseOption literal is
      // only built ONCE both optional fields have their final values
      // (or absence) resolved so we never need a cast.
      if (labelRaw !== undefined && (typeof labelRaw !== "string" || labelRaw.trim().length === 0)) {
        throw new Error(
          `${ctx}.label must be a non-empty string when present; got: ${JSON.stringify(labelRaw)}`,
        );
      }
      // Build the typed `ExerciseOption` literal. The ExerciseOption
      // union distinguishes:
      //   - bare string                                     → option value
      //   - { value, label, intervalRepresentation? }       → object option
      // The `label` field is REQUIRED on the object variant. If the
      // challenge entry omits a `label`, we default it to `value` so
      // the loader never produces a malformed option at the typed
      // surface (the previous loader used `as ExerciseOption` to
      // silently smuggle a `{ value, intervalRepresentation }` shape
      // with no `label` into the contract — the GGA blocker fix
      // removes that hole).
      let parsedInterval: IntervalRepresentation | undefined;
      if (intervalRaw !== undefined) {
        if (typeof intervalRaw !== "object" || intervalRaw === null || Array.isArray(intervalRaw)) {
          throw new Error(
            `${ctx}.intervalRepresentation must be an object when present; got: ${JSON.stringify(intervalRaw)}`,
          );
        }
        // Route through the SAME runtime validator the base Exercise
        // surface uses (`parseIntervalRepresentation` in
        // content-loaders). The validator throws via `failParse` for
        // every malformed shape (missing notation, non-numeric finite
        // bound, missing ariaLabel, etc.), surfacing the precise
        // diagnostic at the JSON import boundary instead of letting a
        // bad shape silently slip through the cast.
        //
        // `parseRecord` (the content-loader helper) re-validates that
        // `intervalRaw` is a non-null, non-array object and returns it
        // typed as `Record<string, unknown>` — eliminating the only
        // cast that remains in this branch.
        const parsed = parseIntervalRepresentation(
          parseRecord(intervalRaw, `${ctx}.intervalRepresentation`),
          `${ctx}.intervalRepresentation`,
        );
        // Plus the typed-interval validator from the intervals module
        // (`validateIntervalRepresentation`), which catches the
        // semantic constraints the parser can't see — e.g. `lower >
        // upper` finite bounds, infinity direction mismatches, etc.
        // Both validators together close the GGA blocker: no raw shape
        // can land in the typed `ChallengeExercise.options` field via
        // an `as ExerciseOption` cast.
        const validation = validateIntervalRepresentation(parsed);
        if (!validation.ok) {
          throw new Error(
            `${ctx}.intervalRepresentation ${validation.error.field}: ${validation.error.message}`,
          );
        }
        parsedInterval = validation.value;
      }
      // Build the typed ExerciseOption literal WITHOUT any cast.
      const finalLabel = labelRaw ?? value;
      if (parsedInterval !== undefined) {
        options.push({ value, label: finalLabel, intervalRepresentation: parsedInterval });
      } else {
        options.push({ value, label: finalLabel });
      }
      optionValues.push(value);
    }
    // Validate expectedAnswer shape BEFORE membership; otherwise null/number/empty answers slip through silently.
    const expectedAnswer = entry["expectedAnswer"];
    if (typeof expectedAnswer !== "string" || expectedAnswer === "") {
      throw new Error(
        `expectedAnswer must be a non-empty string for multiple-choice challenges; got: ${JSON.stringify(expectedAnswer)}`,
      );
    }
    if (!optionValues.includes(expectedAnswer)) {
      throw new Error(
        `expectedAnswer must be exactly one of the options for multiple-choice challenges; got: ${JSON.stringify(expectedAnswer)}`,
      );
    }
    validatedOptions = options;
  } else {
    // Non-multiple-choice types (fill-blank is the dangerous one): the
    // expectedAnswer MUST NOT carry a free-text structured-math expression
    // that AGENTS.md explicitly prohibits. Validate before any other checks
    // so a malformed entry fails with the most specific diagnostic.
    const nonMcError = validateNonMcAnswerShape(
      entry["type"] as string,
      entry["expectedAnswer"],
    );
    if (nonMcError) throw nonMcError;
  }

  // --- tags ---
  // Challenge exercises must carry the EXACT tag tuple
  // `["desafio", "integrador"]` — same order, no extras. The previous
  // check only required both strings to be present somewhere in the
  // array, which silently accepted duplicates and reversed order.
  // `ChallengeExercise.tags` is typed `readonly ["desafio", "integrador"]`,
  // so enforcing the tuple at runtime is the contract.
  const EXPECTED_TAGS = ["desafio", "integrador"] as const;
  const tags = entry["tags"];
  if (!Array.isArray(tags)) {
    throw new Error(`tags must be an array; got: ${JSON.stringify(tags)}`);
  }
  if (tags.length !== EXPECTED_TAGS.length) {
    throw new Error(
      `tags must exactly equal ${JSON.stringify([...EXPECTED_TAGS])}; got: ${JSON.stringify(tags)}`
    );
  }
  for (let i = 0; i < EXPECTED_TAGS.length; i++) {
    if (tags[i] !== EXPECTED_TAGS[i]) {
      throw new Error(
        `tags must exactly equal ${JSON.stringify([...EXPECTED_TAGS])}; got: ${JSON.stringify(tags)}`
      );
    }
  }

  // --- canonicalTrace ---
  const canonicalTrace = entry["canonicalTrace"];
  if (!Array.isArray(canonicalTrace) || canonicalTrace.length === 0) {
    throw new Error(`canonicalTrace must be a non-empty array; got: ${JSON.stringify(canonicalTrace)}`);
  }

  // Validate every entry up front so we can hand a strictly-typed
  // `ChallengeCanonicalTrace[]` to the constructor below without
  // resorting to `as unknown as ChallengeExercise`.
  const typedCanonicalTrace: ChallengeCanonicalTrace[] = [];
  for (let i = 0; i < canonicalTrace.length; i++) {
    const trace = canonicalTrace[i];
    if (typeof trace !== "object" || trace === null) {
      throw new Error(`canonicalTrace[${i}] must be an object; got: ${JSON.stringify(trace)}`);
    }
    const t = trace as Record<string, unknown>;

    const path = t["path"];
    if (typeof path !== "string" || path.trim().length === 0) {
      throw new Error(
        `canonicalTrace[${i}].path must be a non-empty string; got: ${JSON.stringify(path)}`
      );
    }
    const section = t["section"];
    if (typeof section !== "string" || section.trim().length === 0) {
      throw new Error(
        `canonicalTrace[${i}].section must be a non-empty string; got: ${JSON.stringify(section)}`
      );
    }

    const sourceUse = t["sourceUse"];
    if (
      typeof sourceUse !== "string" ||
      !(VALID_SOURCE_USES.has(sourceUse as ChallengeSourceUse))
    ) {
      throw new Error(
        `canonicalTrace[${i}].sourceUse must be one of ${[...VALID_SOURCE_USES].join(" | ")}; got: ${JSON.stringify(sourceUse)}`
      );
    }

    const pedagogicalIntent = t["pedagogicalIntent"];
    if (typeof pedagogicalIntent !== "string" || pedagogicalIntent.trim().length === 0) {
      throw new Error(
        `canonicalTrace[${i}].pedagogicalIntent must be a non-empty string; got: ${JSON.stringify(pedagogicalIntent)}`
      );
    }

    typedCanonicalTrace.push({
      path,
      section,
      sourceUse: sourceUse as ChallengeSourceUse,
      pedagogicalIntent,
    });
  }

  // All validations passed — return a strictly-typed `ChallengeExercise`.
  // Building the object from already-validated local fields avoids the
  // previous `as unknown as ChallengeExercise` cast, which hid
  // undeclared-field drift on the raw JSON. The shape is pinned field
  // by field; runtime callers can no longer smuggle extra columns into
  // the typed contract.
  const tagsTuple: readonly ["desafio", "integrador"] = ["desafio", "integrador"];
  const typedCommonErrorTags: readonly string[] = commonErrorTags;
  const base: ChallengeExercise = {
    id: id as ChallengeExercise["id"],
    skillId: skillId as SkillId,
    type: type as ChallengeExercise["type"],
    difficulty: difficulty as 4 | 5,
    prompt,
    expectedAnswer: entry["expectedAnswer"] as string,
    commonErrorTags: typedCommonErrorTags,
    pedagogicalNote,
    unit: derivedUnit,
    challengeSection: true,
    category: "desafio",
    tags: tagsTuple,
    canonicalTrace: typedCanonicalTrace,
  };
  if (validatedOptions === undefined) {
    return base;
  }
  return { ...base, options: validatedOptions };
}

// ---------------------------------------------------------------------------
// Challenge loading
// ---------------------------------------------------------------------------

/**
 * Extract unit number from a SkillId (e.g. "mat.u1.complejos" -> 1).
 */
function unitFromSkillId(skillId: string): number | null {
  const match = /^mat\.u([1-6])\./.exec(skillId);
  if (!match) return null;
  return Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Load all valid challenge exercises for a given unit.
 * Returns an empty array if the unit has no challenges.
 *
 * @param unit - Unit number (1–6)
 */
export function loadChallengesForUnit(unit: number): readonly ChallengeExercise[] {
  if (unit < 1 || unit > 6) return [];
  return parseCacheForUnit(unit);
}

/**
 * Load all valid challenge exercises for a given skillId.
 * Returns an empty array if the skill has no challenges or the skillId is unknown.
 *
 * @param skillId - e.g. "mat.u1.complejos"
 */
export function loadChallengesForSkill(skillId: string): readonly ChallengeExercise[] {
  const unit = unitFromSkillId(skillId);
  if (unit === null) return [];

  const unitChallenges = parseCacheForUnit(unit);
  return unitChallenges.filter((c) => c.skillId === skillId);
}
