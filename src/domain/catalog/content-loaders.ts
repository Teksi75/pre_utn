/**
 * Content loaders — loads theory, examples, and feedback from static JSON.
 * No external dependencies. Pure TypeScript.
 *
 * All JSON import boundaries use runtime parsing helpers to validate
 * structure and apply defaults, replacing unchecked `as unknown as`
 * casts. Malformed JSON produces clear errors at load time rather than
 * silent type mismatches deep in consumer code.
 *
 * Parsing is deferred to each load: raw JSON is stored at import time
 * and only parsed when a loader function is called. No throws on
 * import — domain is free of module-initialization side effects.
 */

import type { TheoryNode, ConceptBlock, IntervalVisualExample } from "../models/theory";
import type { WorkedExample, SolutionStep } from "../models/worked-example";
import type { FeedbackMapping } from "../feedback/index";
import type {
  Exercise,
  ExerciseCanonicalTrace,
  ExerciseId,
  ExerciseOption,
  ExerciseType,
  Difficulty,
} from "../models/exercise";
import type { SkillId } from "../models/skill";
import { parseSkillUnit } from "../shared/skill-id";
import type { IntervalModel, IntervalEndpoint } from "../intervals/index";
import type { IntervalRepresentation, IntervalBound, EndpointInclusion } from "../intervals/representation";
import { parseOptionalVisualExamples } from "../visuals/parse";

// Static JSON imports — arrive as TypeScript-inferred shapes.
// All are stored as `unknown` in RAW_REGISTRY to prevent module-init
// parsing; runtime helpers validate the shapes on first load.
import theoryUnit1 from "../../../content/matematica/theory/unit-1.json";
import theoryUnit2 from "../../../content/matematica/theory/unit-2.json";
import theoryUnit3 from "../../../content/matematica/theory/unit-3.json";
import examplesUnit1 from "../../../content/matematica/examples/unit-1.json";
import examplesUnit2 from "../../../content/matematica/examples/unit-2.json";
import examplesUnit3 from "../../../content/matematica/examples/unit-3.json";
import feedbackUnit1 from "../../../content/matematica/feedback/unit-1.json";
import feedbackUnit2 from "../../../content/matematica/feedback/unit-2.json";
import feedbackUnit3 from "../../../content/matematica/feedback/unit-3.json";
import feedbackUnit1ConjuntosNumericos from "../../../content/matematica/feedback/unit-1-conjuntos-numericos.json";
import exercisesJson from "../../../content/matematica/exercises.json";
import unit1Exercises from "../../../content/matematica/exercises/unit-1.json";
import unit2Exercises from "../../../content/matematica/exercises/unit-2.json";
import unit3Exercises from "../../../content/matematica/exercises/unit-3.json";
import conjuntosNumericosExercises from "../../../content/matematica/exercises/conjuntos-numericos.json";

// ---------------------------------------------------------------------------
// Runtime parsing helpers — validate JSON shapes at the import boundary
// ---------------------------------------------------------------------------

/** Throw a structured parse error for a malformed JSON object. */
function failParse(field: string, id: string, detail: string): never {
  throw new Error(`Parse error at ${field} (id=${id}): ${detail}`);
}

/**
 * Validate a value is a non-null, non-array object and return it as
 * Record<string, unknown>. Replaces every unsafe `x as Record<string, unknown>`
 * on unvalidated array elements.
 */
export function parseRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      `Parse error at ${context}: expected a non-null, non-array object, got ${typeof value}${Array.isArray(value) ? " (array)" : ""}`
    );
  }
  return value as Record<string, unknown>;
}

/** Validate a field is a non-null, non-array object. */
function parseObjectField(raw: Record<string, unknown>, field: string, context: string): Record<string, unknown> {
  return parseRecord(raw[field], `${context}.${field}`);
}

/**
 * Validate an optional field is an array of non-null objects, returning the
 * array with each element verified as a plain object. Returns undefined if the
 * field is absent or empty. THROWS when the field is present but is not an
 * array — a malformed JSON entry must fail fast at the loader so the loader
 * doesn't silently treat "present-but-wrong-shape" the same as "absent".
 * Used for `intervalRepresentations` and similar deep-typed arrays.
 */
function parseOptionalObjectArray(
  raw: Record<string, unknown>,
  field: string,
  context: string
): readonly Record<string, unknown>[] | undefined {
  const v = raw[field];
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v)) {
    failParse(
      field,
      context,
      `expected array, got ${typeof v}${Array.isArray(v) ? " (array)" : ""}`
    );
  }
  if (v.length === 0) return undefined;
  return v.map((item, i) => parseRecord(item, `${context}.${field}[${i}]`));
}

function parseExerciseId(raw: Record<string, unknown>, field: string, id: string): ExerciseId {
  const value = parseStringField(raw, field, id);
  if (!/^ex\.u[1-6]\..+\.[a-z0-9-]+$/.test(value)) {
    failParse(field, id, `invalid ExerciseId format: "${value}"`);
  }
  return value as ExerciseId;
}

function parseExerciseType(raw: Record<string, unknown>, field: string, id: string): ExerciseType {
  const value = parseStringField(raw, field, id);
  if (
    value !== "multiple-choice" &&
    value !== "true-false" &&
    value !== "numerical" &&
    value !== "fill-blank" &&
    value !== "matching" &&
    value !== "ordering" &&
    value !== "graphical"
  ) {
    failParse(field, id, `unsupported exercise type: "${value}"`);
  }
  return value;
}

function parseDifficulty(raw: Record<string, unknown>, field: string, id: string): Difficulty {
  const value = raw[field];
  if (value !== 1 && value !== 2 && value !== 3 && value !== 4 && value !== 5) {
    failParse(field, id, `expected difficulty 1-5, got ${String(value)}`);
  }
  return value;
}

/** Assert a field is a non-empty string. */
function parseStringField(raw: Record<string, unknown>, field: string, id: string): string {
  const v = raw[field];
  if (typeof v !== "string" || v.trim().length === 0) {
    failParse(field, id, `expected non-empty string, got ${typeof v}`);
  }
  return v;
}

/** Runtime-validate a SkillId (mat.u{1-6}.{slug}). */
function parseSkillId(raw: Record<string, unknown>, field: string, id: string): SkillId {
  const v = parseStringField(raw, field, id);
  if (!/^mat\.u[1-6]\.\S+$/.test(v)) {
    failParse(field, id, `invalid SkillId format: "${v}"`);
  }
  return v as SkillId;
}

/** Parse an optional readonly string array, defaulting to empty. */
function parseOptionalStringArray(raw: Record<string, unknown>, field: string): readonly string[] {
  const v = raw[field];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) return [];
  return v.filter((e): e is string => typeof e === "string");
}

/**
 * Runtime-validate an Exercise / Theory / WorkedExample surface `sourceUse`.
 * Returns ONLY the 3-value exercise literal set; challenge-only literals
 * (`canonical-source`, `calibrated-from-exam`, `solution-pattern`) fail fast.
 * Runtime half of the S0a per-surface guard; compile-time half lives in
 * `ExerciseCanonicalTrace`.
 */
function parseExerciseSourceUse(
  raw: Record<string, unknown>,
  field: string,
  id: string
): "adapted" | "reinforcement" | "reference" {
  const v = raw[field];
  if (v === "adapted" || v === "reinforcement" || v === "reference") return v;
  failParse(
    field,
    id,
    `expected adapted|reinforcement|reference (challenge-only literals are not allowed on the Exercise/Theory/WorkedExample surface), got ${typeof v} ${String(v)}`
  );
}

function parseIntervalEndpoint(raw: Record<string, unknown>, context: string): IntervalEndpoint {
  const kind = raw.kind;
  if (kind === "negativeInfinity" || kind === "positiveInfinity") return { kind };
  if (kind === "finite") {
    const value = raw.value;
    if (typeof value !== "number") failParse("value", context, "finite endpoint requires numeric value");
    return { kind: "finite", value, closed: raw.closed === true };
  }
  failParse("kind", context, `invalid interval endpoint kind: ${String(kind)}`);
}

function parseIntervalModel(raw: Record<string, unknown>, context: string): IntervalModel {
  return {
    left: parseIntervalEndpoint(parseObjectField(raw, "left", context), `${context}.left`),
    right: parseIntervalEndpoint(parseObjectField(raw, "right", context), `${context}.right`),
  };
}

function parseIntervalRepresentationBound(raw: Record<string, unknown>, context: string): IntervalBound {
  const kind = raw.kind;
  if (kind === "finite") {
    const value = raw.value;
    if (typeof value !== "number") failParse("value", context, "finite bound requires numeric value");
    return { kind, value, label: typeof raw.label === "string" ? raw.label : undefined };
  }
  if (kind === "infinity") {
    const direction = raw.direction;
    if (direction !== "negative" && direction !== "positive") {
      failParse("direction", context, `invalid infinity direction: ${String(direction)}`);
    }
    return { kind, direction };
  }
  failParse("kind", context, `invalid interval representation bound kind: ${String(kind)}`);
}

function parseEndpointInclusion(raw: Record<string, unknown>, field: string, context: string): EndpointInclusion {
  const value = raw[field];
  if (value === "open" || value === "closed") return value;
  failParse(field, context, `expected open|closed, got ${String(value)}`);
}

/**
 * Public-runtime validator for an `IntervalRepresentation`. Exported so
 * the challenge catalog loader (`src/lib/challenges/loader.ts`) can reuse
 * the SAME validator the base Exercise surface uses to parse option
 * `intervalRepresentation` values — this guarantees a malformed shape
 * fails fast at module-init time instead of silently slipping through
 * the loader via an `as ExerciseOption` cast.
 *
 * Contract: a malformed `raw` throws via the `failParse` helper with a
 * precise diagnostic (the `context` arg flows into every diagnostic).
 * A well-formed `raw` returns a structurally-typed `IntervalRepresentation`
 * that the caller can attach directly to the `intervalRepresentation`
 * field of an `ExerciseOption` literal — no cast needed at the loader
 * boundary, which closes the gap the GGA reviewer flagged.
 */
export function parseIntervalRepresentation(
  raw: Record<string, unknown>,
  context: string
): IntervalRepresentation {
  return {
    id: parseStringField(raw, "id", context),
    notation: parseStringField(raw, "notation", context),
    setBuilderLabel: parseStringField(raw, "setBuilderLabel", context),
    lower: parseIntervalRepresentationBound(parseObjectField(raw, "lower", context), `${context}.lower`),
    upper: parseIntervalRepresentationBound(parseObjectField(raw, "upper", context), `${context}.upper`),
    lowerInclusion: parseEndpointInclusion(raw, "lowerInclusion", context),
    upperInclusion: parseEndpointInclusion(raw, "upperInclusion", context),
    ariaLabel: parseStringField(raw, "ariaLabel", context),
  };
}

function parseOptionalIntervalRepresentations(raw: Record<string, unknown>, field: string, context: string): readonly IntervalRepresentation[] | undefined {
  const values = parseOptionalObjectArray(raw, field, context);
  if (!values) return undefined;
  return values.map((value, index) => parseIntervalRepresentation(value, `${context}.${field}[${index}]`));
}

function parseExerciseOption(raw: unknown, context: string): ExerciseOption {
  if (typeof raw === "string") return raw;
  const record = parseRecord(raw, context);
  const value = parseStringField(record, "value", context);
  const label = parseStringField(record, "label", context);
  const intervalRepresentation = record.intervalRepresentation === undefined
    ? undefined
    : parseIntervalRepresentation(parseObjectField(record, "intervalRepresentation", context), `${context}.intervalRepresentation`);
  return intervalRepresentation ? { value, label, intervalRepresentation } : { value, label };
}

/**
 * Runtime-parse a CanonicalTrace entry restricted to the EXERCISE / THEORY /
 * WORKED-EXAMPLE surface.
 *
 * Returns the per-surface `ExerciseCanonicalTrace`. The narrowed literal set
 * (`adapted | reinforcement | reference`) is enforced inside
 * `parseExerciseSourceUse`; challenge-only literals fail fast here. The
 * returned value is structurally assignable to the wider
 * `CanonicalTrace` interface (used by `TheoryNode.canonicalTrace` and
 * `WorkedExample.canonicalTrace`) because `ExerciseSourceUse ⊆ SourceUse`.
 *
 * Empty-or-whitespace `path` / `pedagogicalIntent` is rejected by
 * `parseStringField` (the trim check is shared with the loader). `section`
 * is OPTIONAL on the Exercise surface (see `ExerciseCanonicalTrace`), so an
 * absent value is fine; a PRESENT-but-empty-or-whitespace value is
 * indistinguishable from "renderer skips this" and almost certainly
 * indicates a malformed entry, so we reject it here to fail fast at the
 * import boundary.
 */
function parseCanonicalTrace(
  raw: Record<string, unknown>,
  id: string
): ExerciseCanonicalTrace {
  const section = raw.section;
  let sectionValue: string | undefined;
  if (section === undefined || section === null) {
    sectionValue = undefined;
  } else if (typeof section !== "string") {
    failParse("section", id, `expected string when present, got ${typeof section}`);
  } else if (section.trim().length === 0) {
    failParse("section", id, "expected non-empty string when present");
  } else {
    sectionValue = section;
  }
  return {
    path: parseStringField(raw, "path", id),
    section: sectionValue,
    sourceUse: parseExerciseSourceUse(raw, "sourceUse", id),
    pedagogicalIntent: parseStringField(raw, "pedagogicalIntent", id),
  };
}

/**
 * Runtime-parse a readonly CanonicalTrace array.
 *
 * Default behavior (used by Exercise, where `canonicalTrace` is OPTIONAL):
 * missing/non-array falls back to `[]` so the field is silently absent
 * from the returned exercise. A malformed entry DOES throw inside
 * `parseCanonicalTrace` so a present-but-broken shape fails fast.
 *
 * When `required` is true (Theory / WorkedExample surface, where the
 * typed model requires a non-empty trace): missing/empty/non-array all
 * throw at the loader. The previous implementation returned `[]` for
 * missing/non-array, hiding a missing-trace defect until the validator
 * downstream rejected it — the fix surfaces the failure at the JSON
 * import boundary so the malformed entry fails fast at module init.
 */
function parseCanonicalTraceArray(
  raw: Record<string, unknown>,
  id: string,
  required: boolean = false
): readonly ExerciseCanonicalTrace[] {
  const v = raw.canonicalTrace;
  if (!Array.isArray(v)) {
    if (required) {
      failParse(
        "canonicalTrace",
        id,
        `expected non-empty array of trace entries, got ${typeof v}${Array.isArray(v) ? " (array)" : ""}`,
      );
    }
    return [];
  }
  if (v.length === 0 && required) {
    failParse("canonicalTrace", id, "expected non-empty array of trace entries, got empty array");
  }
  return v.map((t, i) =>
    parseCanonicalTrace(parseRecord(t, `${id}.canonicalTrace[${i}]`), id)
  );
}

/**
 * Runtime-parse the optional `canonicalTrace` field for an Exercise.
 *
 * Returns `null` when the field is absent or empty (the field is fully
 * optional on Exercise). Returns the parsed entry array otherwise.
 *
 * The argument accepts EITHER an array of trace entries OR a single
 * trace entry; both shapes appear in the wild (S0 callers sometimes
 * pass one raw entry, JSON-shipped exercises always pass the full
 * `canonicalTrace` array). This is the canonical S0 entry point for
 * typed `canonicalTrace` parsing on the Exercise surface — the same
 * parser the rest of the catalog uses for Theory/WorkedExample
 * entries (same canonical-trace shape), exposed at a stable location
 * so S11's audit can reuse it.
 *
 * The return type is `readonly ExerciseCanonicalTrace[]` (per-surface,
 * 3-value `sourceUse` set). Challenge-only literals
 * (`canonical-source`, `calibrated-from-exam`, `solution-pattern`)
 * fail fast inside `parseExerciseSourceUse`.
 *
 * @param raw - The raw canonicalTrace value (array, single entry, or absent)
 * @param id  - The exercise id used in parse-error messages
 */
export function parseOptionalCanonicalTrace(
  raw: unknown,
  id: string
): readonly ExerciseCanonicalTrace[] | null {
  // Absent / null semantics per model: the canonicalTrace field is
  // OPTIONAL on the Exercise surface, and the typed model treats
  // `undefined | null` as "no trace attached". A PRESENT-but-malformed
  // non-object (number / string / boolean) was previously folded into
  // `return null` too, silently swallowing a broken JSON entry. The
  // fix: throw when `raw` is present but is not an array and not a
  // plain object, so a malformed entry fails fast at the JSON import
  // boundary instead of being coerced into "no trace".
  if (raw === undefined || raw === null) return null;
  let entries: unknown[];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    entries = raw;
  } else if (typeof raw === "object" && Object.keys(raw as Record<string, unknown>).length > 0) {
    entries = [raw];
  } else if (typeof raw !== "object" || raw === null) {
    // Present-but-non-object primitive (number, string, boolean).
    // The previous implementation routed these through `return null`,
    // silently coercing them to the absent semantic — a malformed
    // JSON entry was indistinguishable from a missing field. Throw
    // so the loader surfaces the failure.
    failParse(
      "canonicalTrace",
      id,
      `present but not a trace entry object (got ${raw === null ? "null" : typeof raw})`,
    );
  } else {
    // Empty object: preserved as the existing "absent" semantic so
    // a JSON entry that explicitly set `canonicalTrace: {}` is not
    // flagged as malformed.
    return null;
  }
  return entries.map((t, i) =>
    parseCanonicalTrace(parseRecord(t, `${id}.canonicalTrace[${i}]`), id)
  );
}

/**
 * Scoped U3 alignment audit (INERT scaffold).
 *
 * S0 ships the signature and shape so S11 can activate enforcement
 * (`enabled: true`) once all nine difficulty-5 alignment challenges
 * are in place. Until then, the function returns `{ violations: [] }`
 * to keep the rest of the test suite green while we still don't have
 * the new content.
 *
 * Input shape is intentionally tolerant: callers can pass a minimal
 * `{ expectedSkillIds, challengesBySkill }` and the audit will report
 * any skillId missing a single difficulty-5 challenge of type
 * `multiple-choice` once `enabled` is true.
 */
export interface U3AlignmentAuditInput {
  /** SkillIds that must each have exactly one new diff-5 challenge. */
  readonly expectedSkillIds: readonly string[];
  /** Map of skillId → array of `{ difficulty, type }` for that skill. */
  readonly challengesBySkill: Readonly<Record<string, readonly { readonly difficulty: number; readonly type: string }[]>>;
  /** Inert gate. Default `false` (S0); S11 flips to `true`. */
  readonly enabled?: boolean;
}

/** A single audit violation — one per offending skillId. */
export interface U3AlignmentAuditViolation {
  readonly skillId: string;
  readonly reason:
    | "missing-challenge"
    | "wrong-difficulty"
    | "wrong-type"
    | "duplicate-challenge";
}

export interface U3AlignmentAuditResult {
  readonly violations: readonly U3AlignmentAuditViolation[];
}

/**
 * Run the scoped U3 alignment audit. INERT in S0 — caller passes
 * `enabled: true` to actually surface violations (default false).
 * S11 wires `enabled: true`; S0-S10 must NOT flip the default to keep
 * the test suite green while content is being added.
 *
 * When enabled, emits a DISTINCT reason per failure mode so callers
 * can tell apart:
 *   - `missing-challenge`   — the skill has zero challenges
 *   - `wrong-difficulty`    — challenges exist but none is diff=5
 *   - `wrong-type`          — diff=5 challenges exist but none is MC
 *   - `duplicate-challenge` — more than one diff=5 MC was authored
 *
 * The previous implementation collapsed all three failure modes into
 * `missing-challenge`, hiding whether the missing piece was a
 * difficulty bump, a type fix, or no challenge at all. Distinct
 * reasons let S11 surface a precise checklist to whoever owns the
 * content authoring.
 */
export function runU3AlignmentAudit(input: U3AlignmentAuditInput): U3AlignmentAuditResult {
  const enabled = input.enabled === true;
  if (!enabled) {
    return { violations: [] };
  }
  const violations: U3AlignmentAuditViolation[] = [];
  for (const skillId of input.expectedSkillIds) {
    const list = input.challengesBySkill[skillId] ?? [];
    if (list.length === 0) {
      violations.push({ skillId, reason: "missing-challenge" });
      continue;
    }
    const diff5 = list.filter((c) => c.difficulty === 5);
    if (diff5.length === 0) {
      violations.push({ skillId, reason: "wrong-difficulty" });
      continue;
    }
    const diff5Mc = diff5.filter((c) => c.type === "multiple-choice");
    if (diff5Mc.length === 0) {
      violations.push({ skillId, reason: "wrong-type" });
      continue;
    }
    if (diff5Mc.length > 1) {
      violations.push({ skillId, reason: "duplicate-challenge" });
      continue;
    }
    // Single diff-5 MC present — the audit is satisfied for this skill.
  }
  return { violations };
}

/** Runtime-parse a ConceptBlock from a raw object. */
export function parseConceptBlock(raw: Record<string, unknown>, parentId: string, index: number): ConceptBlock {
  const id = typeof raw.id === "string" ? raw.id : `${parentId}-concept-${index}`;
  const bodyParagraphs = parseOptionalBodyParagraphs(raw, id);
  // body is optional when bodyParagraphs is present (migrated concepts);
  // still required when bodyParagraphs is absent (legacy concepts).
  const body = parseOptionalStringField(raw, "body");
  if (body === undefined && bodyParagraphs === undefined) {
    failParse("body", id, "expected non-empty string (or bodyParagraphs)");
  }
  const result: ConceptBlock = {
    id,
    title: parseStringField(raw, "title", id),
    body: body ?? "",
    intervalRepresentations: parseOptionalIntervalRepresentations(raw, "intervalRepresentations", id),
    visualExamples: parseOptionalVisualExamples(raw.visualExamples, id),
  };
  return bodyParagraphs ? { ...result, bodyParagraphs } : result;
}

/**
 * Runtime-parse an optional non-empty string field. Returns the string
 * when present and non-empty (after trim), `undefined` when absent,
 * null, empty, or whitespace-only. Throws if the value is present but
 * not a string.
 */
function parseOptionalStringField(
  raw: Record<string, unknown>,
  field: string
): string | undefined {
  const v = raw[field];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") {
    failParse(field, "(unknown)", `expected string, got ${typeof v}`);
  }
  if (v.trim().length === 0) return undefined;
  return v;
}

/**
 * Runtime-parse the optional `bodyParagraphs` field of a ConceptBlock.
 * Validates that every element is a non-empty string. Returns `undefined`
 * when the field is absent (missing or null) or an empty array (treated as
 * absent to prevent drift). Fails fast (throws) when the field is present
 * but not an array, or when any element is not a non-empty string, with
 * the offending index in the error message.
 *
 * Exported for unit testing.
 */
export function parseOptionalBodyParagraphs(
  raw: Record<string, unknown>,
  contextId: string
): readonly string[] | undefined {
  const v = raw.bodyParagraphs;
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v)) {
    failParse("bodyParagraphs", contextId, "expected array (or undefined)");
  }
  if (v.length === 0) return undefined;
  return v.map((p, i) => {
    if (typeof p !== "string" || p.trim().length === 0) {
      failParse(`bodyParagraphs[${i}]`, contextId, "expected non-empty string");
    }
    return p;
  });
}

/** Runtime-parse an IntervalVisualExample from a raw object. */
function parseIntervalVisualExample(
  raw: Record<string, unknown>,
  parentId: string,
  index: number
): IntervalVisualExample {
  const id = typeof raw.id === "string" ? raw.id : `${parentId}-vis-${index}`;
  return {
    id,
    title: parseStringField(raw, "title", id),
    description: parseStringField(raw, "description", id),
    interval: parseIntervalModel(parseObjectField(raw, "interval", id), `${id}.interval`),
  };
}

/** Runtime-parse an optional readonly IntervalVisualExample array. */
function parseOptionalIntervalVisuals(
  raw: Record<string, unknown>,
  parentId: string
): readonly IntervalVisualExample[] | undefined {
  const v = raw.intervalVisuals;
  if (!Array.isArray(v) || v.length === 0) return undefined;
  return v.map((iv, i) =>
    parseIntervalVisualExample(
      parseRecord(iv, `${parentId}.intervalVisuals[${i}]`),
      parentId,
      i
    )
  );
}

/** Runtime-parse a WorkedExample from a raw object. */
export function parseWorkedExample(raw: Record<string, unknown>, index: number): WorkedExample {
  const id = typeof raw.id === "string" ? raw.id : `worked-ex-${index}`;
  const stepsRaw = raw.steps;
  const steps: SolutionStep[] = [];
  if (Array.isArray(stepsRaw)) {
    for (let i = 0; i < stepsRaw.length; i++) {
      const s = parseRecord(stepsRaw[i], `${id}.steps[${i}]`);
      steps.push({
        order: typeof s.order === "number" ? s.order : i + 1,
        explanation: parseStringField(s, "explanation", `${id}-step${i}`),
        intervalRepresentations: parseOptionalIntervalRepresentations(s, "intervalRepresentations", `${id}-step${i}`),
        visualExamples: parseOptionalVisualExamples(s.visualExamples, `${id}-step${i}`),
      });
    }
  }
  return {
    id,
    skillId: parseSkillId(raw, "skillId", id),
    problem: parseStringField(raw, "problem", id),
    steps,
    finalAnswer: parseStringField(raw, "finalAnswer", id),
    pedagogicalNote: parseStringField(raw, "pedagogicalNote", id),
    canonicalTrace: parseCanonicalTraceArray(raw, id, true),
  };
}

/** Runtime-parse a WorkedExample array. */
function parseWorkedExampleArray(raw: unknown, sourceName: string): readonly WorkedExample[] {
  if (!Array.isArray(raw)) {
    throw new Error(`Parse error: ${sourceName} is not an array`);
  }
  return raw.map((e, i) => parseWorkedExample(parseRecord(e, `${sourceName}[${i}]`), i));
}

/** Runtime-parse a FeedbackMapping from a raw object. */
function parseFeedbackMapping(raw: Record<string, unknown>, index: number): FeedbackMapping {
  const id = typeof raw.errorTag === "string" ? raw.errorTag : `feedback-${index}`;
  const type = raw.type;
  if (type !== "corrective" && type !== "conceptual" && type !== "procedural") {
    failParse("type", id, `expected corrective|conceptual|procedural, got ${typeof type} ${type}`);
  }
  return {
    errorTag: parseStringField(raw, "errorTag", id),
    type,
    message: parseStringField(raw, "message", id),
    recoveryTarget: typeof raw.recoveryTarget === "string" ? raw.recoveryTarget : undefined,
  };
}

/** Runtime-parse a FeedbackMapping array. */
function parseFeedbackMappingArray(raw: unknown, sourceName: string): readonly FeedbackMapping[] {
  if (!Array.isArray(raw)) {
    throw new Error(`Parse error: ${sourceName} is not an array`);
  }
  return raw.map((e, i) => parseFeedbackMapping(parseRecord(e, `${sourceName}[${i}]`), i));
}

/** Runtime-parse a TheoryNode from a raw object. */
export function parseTheoryNode(raw: Record<string, unknown>, index: number): TheoryNode {
  const id = typeof raw.id === "string" ? raw.id : `theory-node-${index}`;
  const intervalVisuals = parseOptionalIntervalVisuals(raw, id);
  const visualExamples = parseOptionalVisualExamples(raw.visualExamples, id);

  // Normalize: prefer `concepts`, fall back to `conceptBlocks`, else empty.
  const conceptsRaw: unknown[] = Array.isArray(raw.concepts)
    ? raw.concepts
    : Array.isArray(raw.conceptBlocks)
      ? raw.conceptBlocks
      : [];
  const concepts: ConceptBlock[] = conceptsRaw.map((c: unknown, i: number) =>
    parseConceptBlock(parseRecord(c, `${id}.concepts[${i}]`), id, i)
  );

  return {
    id,
    skillId: parseSkillId(raw, "skillId", id),
    concepts,
    notation: parseOptionalStringArray(raw, "notation"),
    commonMistakes: parseOptionalStringArray(raw, "commonMistakes"),
    practicePrompts: parseOptionalStringArray(raw, "practicePrompts"),
    canonicalTrace: parseCanonicalTraceArray(raw, id, true),
    ...(intervalVisuals !== undefined ? { intervalVisuals } : {}),
    ...(visualExamples !== undefined ? { visualExamples } : {}),
  };
}

/** Runtime-parse a TheoryNode array. */
function parseTheoryNodeArray(raw: unknown, sourceName: string): readonly TheoryNode[] {
  if (!Array.isArray(raw)) {
    throw new Error(`Parse error: ${sourceName} is not an array`);
  }
  return raw.map((n, i) => parseTheoryNode(parseRecord(n, `${sourceName}[${i}]`), i));
}

// ---------------------------------------------------------------------------
// Lazy-loading registry — raw JSON stored at import, parsed on first load
// ---------------------------------------------------------------------------

/** Linkage metadata for exercises referencing theory and examples. */
export interface ExerciseLinkage {
  readonly exerciseId: string;
  readonly relatedTheoryIds: readonly string[];
  readonly relatedExampleIds: readonly string[];
}

/** Raw JSON store — no parsing at module init. */
interface RawRegistry {
  readonly theory: Record<string, unknown>;
  readonly examples: Record<string, unknown>;
  readonly feedback: Record<string, unknown>;
}

const RAW_REGISTRY: RawRegistry = {
  theory: {
    "unit-1": theoryUnit1 as unknown,
    "unit-2": theoryUnit2 as unknown,
    "unit-3": theoryUnit3 as unknown,
  },
  examples: {
    "unit-1": examplesUnit1 as unknown,
    "unit-2": examplesUnit2 as unknown,
    "unit-3": examplesUnit3 as unknown,
  },
  feedback: {
    "unit-1": feedbackUnit1 as unknown,
    "unit-1-conjuntos-numericos": feedbackUnit1ConjuntosNumericos as unknown,
    "unit-2": feedbackUnit2 as unknown,
    "unit-3": feedbackUnit3 as unknown,
  },
};

/**
 * Load theory nodes for a given unit.
 * Parsing is deferred to calls — no throws on import.
 *
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of TheoryNode objects
 * @throws Error if unit key is unknown or JSON is malformed
 */
export function loadTheoryContent(unitKey: string): readonly TheoryNode[] {
  const raw = RAW_REGISTRY.theory[unitKey];
  if (!raw) {
    throw new Error(`Unknown theory unit key: ${unitKey}`);
  }
  return parseTheoryNodeArray(raw, `theory/${unitKey}.json`);
}

/**
 * Load worked examples for a given unit.
 * Parsing is deferred to calls — no throws on import.
 *
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of WorkedExample objects
 * @throws Error if unit key is unknown or JSON is malformed
 */
export function loadExampleContent(unitKey: string): readonly WorkedExample[] {
  const raw = RAW_REGISTRY.examples[unitKey];
  if (!raw) {
    throw new Error(`Unknown examples unit key: ${unitKey}`);
  }
  return parseWorkedExampleArray(raw, `examples/${unitKey}.json`);
}

/**
 * Load feedback mappings for a given unit.
 * Parsing is deferred to calls — no throws on import.
 *
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of FeedbackMapping objects
 * @throws Error if unit key is unknown or JSON is malformed
 */
export function loadFeedbackContent(unitKey: string): readonly FeedbackMapping[] {
  const raw = RAW_REGISTRY.feedback[unitKey];
  if (!raw) {
    throw new Error(`Unknown feedback unit key: ${unitKey}`);
  }
  return parseFeedbackMappingArray(raw, `feedback/${unitKey}.json`);
}

/**
 * Extract exercise linkage metadata from the raw JSON exercises.
 * Filters to only exercises that have relatedTheoryIds or relatedExampleIds.
 *
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of ExerciseLinkage objects
 */
export function pilotExercisesWithLinks(unitKey: string): readonly ExerciseLinkage[] {
  const unitNum = Number(unitKey.replace("unit-", ""));

  // Compose from unit file + main exercises.json
  const sources: unknown[] = [];
  const unitSource = UNIT_EXERCISE_FILES[unitNum];
  if (Array.isArray(unitSource)) sources.push(unitSource);
  if (Array.isArray(exercisesJson)) sources.push(exercisesJson);

  const allEntries: Record<string, unknown>[] = [];
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (let i = 0; i < source.length; i++) {
      allEntries.push(parseRecord(source[i], `exercises[${i}]`));
    }
  }

  return allEntries
    .filter((ex) => {
      const id = typeof ex.id === "string" ? ex.id : "";
      const match = /^ex\.u(\d+)\./.exec(id);
      return match && Number(match[1]) === unitNum;
    })
    .filter(
      (ex) =>
        Array.isArray(ex.relatedTheoryIds) || Array.isArray(ex.relatedExampleIds)
    )
    .map((ex) => ({
      exerciseId: typeof ex.id === "string" ? ex.id : "",
      relatedTheoryIds: Array.isArray(ex.relatedTheoryIds)
        ? ex.relatedTheoryIds.filter((s): s is string => typeof s === "string")
        : [],
      relatedExampleIds: Array.isArray(ex.relatedExampleIds)
        ? ex.relatedExampleIds.filter((s): s is string => typeof s === "string")
        : [],
    }));
}

/**
 * Apply backward-compat defaults to a raw exercise object.
 *
 * Each declared Exercise field is individually validated or defaulted
 * before constructing the object. Extra fields present in raw (e.g.
 * `relatedTheoryIds`, `relatedExampleIds`) are passed through unchanged
 * so downstream consumers that access them via narrow casts continue to
 * work — the final `as Exercise` assertion is narrow and justified after
 * all declared fields have been validated.
 *
 * @param raw - Raw exercise object from JSON (may lack optional fields)
 * @returns Exercise with defaults applied for missing optional fields
 */
export function applyExerciseDefaults(raw: Record<string, unknown>): Exercise {
  const rawId = typeof raw.id === "string" ? raw.id : "exercise";
  const id = parseExerciseId(raw, "id", rawId);
  const skillId = parseSkillId(raw, "skillId", rawId);
  const type = parseExerciseType(raw, "type", rawId);
  const difficulty = parseDifficulty(raw, "difficulty", rawId);
  const prompt = parseStringField(raw, "prompt", rawId);
  const expectedAnswer = parseStringField(raw, "expectedAnswer", rawId);
  const pedagogicalNote = parseStringField(raw, "pedagogicalNote", rawId);

  // Optional metadata — apply defaults when absent or malformed.
  const commonErrorTags = Array.isArray(raw.commonErrorTags)
    ? raw.commonErrorTags.filter((s): s is string => typeof s === "string")
    : [];
  const category = typeof raw.category === "string" ? raw.category : "clasificacion";
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((s): s is string => typeof s === "string")
    : [];
  const options = Array.isArray(raw.options)
    ? raw.options.map((option, index) => parseExerciseOption(option, `${id}.options[${index}]`))
    : undefined;
  // S0: optional canonicalTrace — parsed via the dedicated S0 helper.
  // Returns null when absent or empty, so the field is only attached
  // when the entry actually carries a trace.
  const canonicalTrace = parseOptionalCanonicalTrace(raw.canonicalTrace, id);
  // S0: optional U3 progression metadata. Family must be the recognized
  // literal; order must be a finite NONNEGATIVE number. Otherwise we drop
  // the metadata so the legacy comparator applies. The nonnegativity
  // contract comes from the spec: progressionOrder positions entries
  // inside the family, so negative values would silently invert the
  // ordering — a malformed entry should drop both fields rather than
  // ship a confusing negative position.
  const progressionFamily =
    raw.progressionFamily === "log-expansion" || raw.progressionFamily === "log-combining"
      ? raw.progressionFamily
      : undefined;
  const rawOrder = raw.progressionOrder;
  const progressionOrder =
    typeof rawOrder === "number" && Number.isFinite(rawOrder) && rawOrder >= 0
      ? rawOrder
      : undefined;

  // Preserve extra fields from raw that aren't part of the Exercise
  // interface (e.g. relatedTheoryIds, relatedExampleIds) so that
  // downstream consumers accessing them via narrow casts keep working.
  const KNOWN_FIELDS = new Set([
    "id", "skillId", "type", "difficulty", "prompt", "expectedAnswer",
    "commonErrorTags", "pedagogicalNote", "category", "tags", "options", "unit",
    "canonicalTrace", "progressionFamily", "progressionOrder",
  ]);
  const extra: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    if (!KNOWN_FIELDS.has(key)) {
      extra[key] = raw[key];
    }
  }

  const base = {
    ...extra,
    id, skillId, type, difficulty, prompt, expectedAnswer,
    commonErrorTags, pedagogicalNote, category, tags,
    unit: parseSkillUnit(skillId),
  };
  const withTrace = canonicalTrace ? { ...base, canonicalTrace } : base;
  const withProgressionFamily = progressionFamily
    ? { ...withTrace, progressionFamily }
    : withTrace;
  const withProgression = progressionOrder !== undefined
    ? { ...withProgressionFamily, progressionOrder }
    : withProgressionFamily;
  return (options ? { ...withProgression, options } : withProgression) as Exercise;
}

/** Per-skill exercise file registry (raw JSON, validated lazily). */
const SKILL_EXERCISE_FILES: Readonly<Record<string, unknown>> = {
  "mat.u1.conjuntos_numericos": conjuntosNumericosExercises as unknown,
};

/** Unit exercise file registry — maps unit number to raw JSON array. */
export const UNIT_EXERCISE_FILES: Readonly<Record<number, unknown>> = {
  1: unit1Exercises as unknown,
  2: unit2Exercises as unknown,
  3: unit3Exercises as unknown,
};

/**
 * Load all exercises for a given skill, composing from unit files,
 * the main catalog, and per-skill files. Deterministic ordering: unit file
 * first, then main catalog, then per-skill file.
 *
 * @param skillId - The skill ID to load exercises for
 * @returns Array of Exercise objects with defaults applied
 */
export function loadExercisesForSkill(skillId: string): readonly Exercise[] {
  const unitNum = parseSkillUnit(skillId);
  const seenIds = new Set<string>();
  const allRaw: Record<string, unknown>[] = [];

  // 1. Unit file (if exists for this unit)
  const unitSource = UNIT_EXERCISE_FILES[unitNum];
  if (Array.isArray(unitSource)) {
    for (let i = 0; i < unitSource.length; i++) {
      const entry = parseRecord(unitSource[i], `unit-${unitNum}.exercises[${i}]`);
      if (typeof entry.skillId === "string" && entry.skillId === skillId) {
        const id = typeof entry.id === "string" ? entry.id : "";
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allRaw.push(entry);
        }
      }
    }
  }

  // 2. Main exercises.json (now contains u3-u6 only)
  if (Array.isArray(exercisesJson)) {
    for (let i = 0; i < exercisesJson.length; i++) {
      const entry = parseRecord(exercisesJson[i], `exercises[${i}]`);
      if (typeof entry.skillId === "string" && entry.skillId === skillId) {
        const id = typeof entry.id === "string" ? entry.id : "";
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allRaw.push(entry);
        }
      }
    }
  }

  // 3. Per-skill file (e.g. conjuntos-numericos.json)
  const skillSource = SKILL_EXERCISE_FILES[skillId];
  if (Array.isArray(skillSource)) {
    for (let i = 0; i < skillSource.length; i++) {
      const entry = parseRecord(skillSource[i], `${skillId}.exercises[${i}]`);
      const id = typeof entry.id === "string" ? entry.id : "";
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allRaw.push(entry);
      }
    }
  }

  return allRaw.map(applyExerciseDefaults);
}

/**
 * Result of loading a practice bank: the exercises plus the diagnostics
 * produced by the bank validator.
 */
export interface SkillBank {
  readonly exercises: readonly Exercise[];
  readonly diagnostics: readonly string[];
}

/**
 * Derive the unit feedback key (e.g. "unit-1") from a skill ID.
 * Throws if the skill ID does not match the `mat.u{N}.*` convention.
 */
function skillIdToUnitKey(skillId: string): string {
  const match = /^mat\.u(\d+)\./.exec(skillId);
  if (!match) {
    throw new Error(`Cannot derive unit key from skillId: ${skillId}`);
  }
  return `unit-${match[1]}`;
}

/**
 * Derive the per-skill feedback key (e.g. "unit-1-conjuntos-numericos")
 * from a skill ID, if a dedicated per-skill feedback collection exists
 * in the RAW_REGISTRY.
 *
 * Convention: `unit-{N}-{slug}` where `slug` is the skill suffix
 * (`mat.u{N}.<suffix>`) with underscores replaced by hyphens.
 *
 * @returns The per-skill feedback key if it exists in the registry,
 *          `undefined` otherwise.
 */
function resolveSkillFeedbackKey(skillId: string): string | undefined {
  const match = /^mat\.u(\d+)\.(.+)$/.exec(skillId);
  if (!match) return undefined;
  const slug = match[2].replace(/_/g, "-");
  const key = `unit-${match[1]}-${slug}`;
  return Object.prototype.hasOwnProperty.call(RAW_REGISTRY.feedback, key) ? key : undefined;
}

/**
 * Load a skill's practice bank together with validation diagnostics.
 *
 * Wires the bank validator into the catalog load path: callers receive both
 * the exercises and any diagnostics produced by `validatePracticeBank`,
 * without having to call them separately. Backward compatible with
 * `loadExercisesForSkill`, which still returns exercises only.
 *
 * Feedback resolution: tries the per-skill feedback key first (e.g.
 * `unit-1-conjuntos-numericos`), falling back to the unit-level key
 * (`unit-1`). This ensures skills with dedicated feedback collections
 * are validated against the precise set of mappings authored for them.
 *
 * @param skillId - The skill ID to load the bank for
 * @returns Object with `exercises` array and `diagnostics` array (empty if bank is valid)
 */
export function loadSkillBank(skillId: string): SkillBank {
  const exercises = loadExercisesForSkill(skillId);

  // Try to load feedback for cross-checking error tag coverage.
  // Only swallow the specific "Unknown feedback unit key" error —
  // unexpected errors (programming bugs, loader failures) must propagate.
  let feedback: readonly FeedbackMapping[] = [];
  try {
    const feedbackKey = resolveSkillFeedbackKey(skillId) ?? skillIdToUnitKey(skillId);
    feedback = loadFeedbackContent(feedbackKey);
  } catch (e: unknown) {
    const isUnknownUnit =
      e instanceof Error && e.message.startsWith("Unknown feedback unit key:");
    if (!isUnknownUnit) {
      throw e;
    }
    // No feedback registered for this unit — proceed without.
  }

  const diagnostics = validatePracticeBank(skillId, exercises, feedback);
  return { exercises, diagnostics };
}

/** Per-category minimum exercise counts for practice bank validation. */
const CATEGORY_MINIMUMS: Readonly<Record<string, number>> = {
  pertenencia: 8,
  clasificacion: 12,
  "racionales-vs-irracionales": 8,
  decimales: 6,
  mapa: 4,
  "errores-comunes": 6,
};

/**
 * Validate a practice bank for category coverage and minimum counts.
 *
 * Checks that every exercise has a category field, that each required
 * category meets its minimum exercise count, and that all referenced
 * error tags have corresponding feedback entries.
 *
 * @param skillId - The skill being validated
 * @param exercises - The exercises in the bank for this skill
 * @param feedback - Optional feedback mappings to cross-check against exercise error tags
 * @returns Array of diagnostic strings (empty if bank is valid)
 */
export function validatePracticeBank(
  skillId: string,
  exercises: readonly Exercise[],
  feedback?: readonly FeedbackMapping[]
): readonly string[] {
  const diagnostics: string[] = [];

  // Check for exercises missing the category field
  const missingCategory = exercises.filter((ex) => !ex.category);
  if (missingCategory.length > 0) {
    diagnostics.push(
      `${missingCategory.length} exercise(s) missing category field: ${missingCategory.map((e) => e.id).join(", ")}`
    );
  }

  // Count exercises per category
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.category) {
      counts.set(ex.category, (counts.get(ex.category) ?? 0) + 1);
    }
  }

  // Check each required category against its minimum
  for (const [category, minimum] of Object.entries(CATEGORY_MINIMUMS)) {
    const count = counts.get(category) ?? 0;
    if (count < minimum) {
      diagnostics.push(
        `Category "${category}" has ${count} exercise(s) but requires at least ${minimum}`
      );
    }
  }

  // Cross-check feedback coverage for exercises with error tags
  if (feedback) {
    const feedbackTags = new Set(feedback.map((f) => f.errorTag));
    const exercisesWithMissingFeedback = exercises.filter(
      (ex) =>
        Array.isArray(ex.commonErrorTags) &&
        ex.commonErrorTags.length > 0 &&
        ex.commonErrorTags.some((tag) => !feedbackTags.has(tag))
    );
    if (exercisesWithMissingFeedback.length > 0) {
      for (const ex of exercisesWithMissingFeedback) {
        const tags = Array.isArray(ex.commonErrorTags) ? ex.commonErrorTags : [];
        const missing = tags.filter((tag) => !feedbackTags.has(tag));
        diagnostics.push(
          `Exercise "${ex.id}" references error tag(s) without feedback: ${missing.join(", ")}`
        );
      }
    }
  }

  return diagnostics;
}

// ---------------------------------------------------------------------------
// Per-unit validation thresholds
// ---------------------------------------------------------------------------

/** Per-unit minimum exercise count configuration. */
export interface UnitValidationThresholds {
  readonly minimumExercises: number;
  readonly categoryMinimums?: Readonly<Record<string, number>>;
}

/**
 * Per-unit minimum exercise thresholds.
 * Keys are unit keys like "unit-1", "unit-2", etc.
 * Units without explicit entries use the default minimum of 5.
 * Thresholds must reflect actual catalog content — not aspirational targets.
 */
export const UNIT_THRESHOLDS: Readonly<Record<string, number>> = {
  "unit-1": 40,
  "unit-2": 20,
  "unit-3": 24,
};

const DEFAULT_UNIT_MINIMUM = 5;

/**
 * Get the minimum exercise threshold for a given unit.
 * Returns the configured threshold or the default minimum (5).
 *
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Minimum exercise count for that unit
 */
export function getUnitThreshold(unitKey: string): number {
  return UNIT_THRESHOLDS[unitKey] ?? DEFAULT_UNIT_MINIMUM;
}

// ---------------------------------------------------------------------------
// Difficulty progression validation (per-skill monotonic non-decreasing)
// ---------------------------------------------------------------------------

/** A single violation: a skill whose exercises are not monotonic by ID. */
export interface DifficultyViolation {
  readonly skillId: string;
  readonly exerciseIds: readonly string[];
}

/** Result of difficulty progression validation. */
export interface DifficultyProgressionResult {
  readonly valid: boolean;
  readonly violations: readonly DifficultyViolation[];
}

/**
 * Extract the trailing numeric suffix from an exercise ID for natural ordering.
 * Returns the integer value of the last `.digits` segment, or NaN if absent.
 *
 * Example: "ex.u1.a.10" → 10, "ex.u1.a.2" → 2, "ex.u1.cn-per-02" → 2
 */
function extractExerciseIdSuffix(id: string): number {
  const match = /\.(\d+)$/.exec(id);
  return match ? parseInt(match[1], 10) : NaN;
}

/**
 * Compare two exercise IDs using natural numeric ordering for the trailing
 * suffix. Falls back to lexicographic comparison when both IDs lack a numeric
 * suffix or when suffixes are equal.
 *
 * Examples (correct order):
 *   "ex.u1.a.2" < "ex.u1.a.10"   (numeric: 2 < 10)
 *   "ex.u1.a.1" < "ex.u1.a.2"    (numeric: 1 < 2)
 *   "ex.u1.cn-per-02" < "ex.u1.cn-per-10"
 */
function compareExerciseIds(a: string, b: string): number {
  const suffixA = extractExerciseIdSuffix(a);
  const suffixB = extractExerciseIdSuffix(b);

  // Both have numeric suffixes — compare numerically
  if (!isNaN(suffixA) && !isNaN(suffixB)) {
    if (suffixA !== suffixB) return suffixA - suffixB;
    // Same suffix — fall through to lexicographic for stable ordering
  }

  // At least one lacks a numeric suffix — fall back to lexicographic
  return a.localeCompare(b);
}

/**
 * Validate that each skill's exercises show a monotonically non-decreasing
 * difficulty sequence when ordered by exercise ID.
 *
 * Pure function — no I/O, no side effects.
 *
 * @param exercises - All exercises to validate
 * @returns Result with valid flag and any violations found
 */
export function validateDifficultyProgression(
  exercises: readonly Exercise[]
): DifficultyProgressionResult {
  const bySkill = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const list = bySkill.get(ex.skillId) ?? [];
    list.push(ex);
    bySkill.set(ex.skillId, list);
  }

  const violations: DifficultyViolation[] = [];

  for (const [skillId, skillExercises] of bySkill) {
    const sorted = [...skillExercises].sort((a, b) => compareExerciseIds(a.id, b.id));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].difficulty < sorted[i - 1].difficulty) {
        violations.push({
          skillId,
          exerciseIds: sorted.map((e) => e.id),
        });
        break; // one violation per skill is enough
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

// ---------------------------------------------------------------------------
// Traceability audit — flag exercises with theory/example links but no trace
// ---------------------------------------------------------------------------

/** Warning for an exercise with incomplete traceability metadata. */
export interface AuditWarning {
  readonly exerciseId: string;
  readonly missingFields: readonly string[];
}

/**
 * Audit exercises for metadata traceability.
 *
 * Flags exercises that reference `relatedTheoryIds` or `relatedExampleIds`
 * but lack `canonicalTrace` metadata. Exercises without any theory/example
 * links pass without warning.
 *
 * Pure function — no I/O, no side effects.
 *
 * @param exercises - All exercises to audit
 * @returns Array of warnings for exercises with incomplete traceability
 */
export function auditTraceability(
  exercises: readonly Exercise[]
): readonly AuditWarning[] {
  const warnings: AuditWarning[] = [];

  for (const ex of exercises) {
    const raw = ex as unknown as Record<string, unknown>;
    const hasTheoryLinks =
      Array.isArray(raw.relatedTheoryIds) && raw.relatedTheoryIds.length > 0;
    const hasExampleLinks =
      Array.isArray(raw.relatedExampleIds) && raw.relatedExampleIds.length > 0;

    if (!hasTheoryLinks && !hasExampleLinks) continue;

    const hasCanonicalTrace =
      Array.isArray(raw.canonicalTrace) && raw.canonicalTrace.length > 0;

    if (!hasCanonicalTrace) {
      warnings.push({
        exerciseId: ex.id,
        missingFields: ["canonicalTrace"],
      });
    }
  }

  return warnings;
}
