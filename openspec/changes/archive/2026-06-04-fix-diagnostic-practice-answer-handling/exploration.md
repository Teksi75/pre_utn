## Exploration: Fix Diagnostic & Practice Answer Handling

### Current State

The diagnostic and practice systems currently handle answers through three evaluators:
- **Numeric evaluator**: Tolerance-based comparison for pure numbers (uses `Number()`)
- **Exact evaluator**: Trimmed, case-insensitive string comparison
- **Boolean evaluator**: Spanish/English alias resolution for true/false

**Critical issues identified:**

1. **Exercise type mismatch**: Question `ex.u6.ceros_positividad_negatividad.1` ("¿Cuáles son los ceros de f(x) = x² - 4?") is marked as type `"numerical"` but has expected answer `"x = -2, x = 2"`. The numeric evaluator will fail to parse this as a number, causing it to always return `correct: false` unless the student types the exact string.

2. **Brittle free-text matching**: Exercises with type `"symbolic"` or `"numerical"` (mislabeled) use exact string comparison. Valid student answers like:
   - "-2 y 2" 
   - "x=-2 y x=2"
   - "x = 2, x = -2" (reversed order)
   - "2, -2"
   
   All fail because they don't match the exact string "x = -2, x = 2".

3. **Multiple-choice options are NOT shuffled**: The claim that "the correct answer is always the first option" is **FALSE**. Analysis of the exercise catalog shows correct answers appear in various positions (1st, 2nd, 3rd, 4th). However, options are displayed in the fixed order defined in `content/matematica/exercises.json` with no runtime shuffling.

### Affected Areas

- `content/matematica/exercises.json` — Exercise definitions with incorrect types and rigid expected answers
- `src/domain/evaluator/index.ts` — Evaluator dispatcher routes exercises to comparison modules
- `src/domain/evaluator/exact.ts` — String comparison logic (case-insensitive but order-sensitive)
- `src/domain/evaluator/numeric.ts` — Numeric parser that fails on non-numeric strings
- `src/components/exercises/ExerciseAnswerInput.tsx` — Renders answer input based on exercise type
- `src/app/diagnostic/page.tsx` — Uses `evaluateAnswer()` for diagnostic grading
- `src/components/practice/AnswerForm.tsx` — Uses `ExerciseAnswerInput` for practice

### Approaches

#### Approach 1: Fix exercise types + add symbolic evaluator (Recommended)

**Description**: 
- Reclassify `ex.u6.ceros_positividad_negatividad.1` from `"numerical"` to `"symbolic"`
- Convert high-ambiguity exercises to `"multiple-choice"` with plausible distractors
- Keep free-text for exercises where symbolic input is pedagogically valuable
- Optionally add a more robust symbolic evaluator (set comparison, order-independent)

**Pros**:
- Fixes the immediate bug (question 11 always marked wrong)
- Reduces grading friction for ambiguous answers
- Multiple-choice is pedagogically sound for recognition tasks
- Minimal code changes (mostly data fixes)

**Cons**:
- Doesn't solve the broader problem of brittle string matching
- Requires manual creation of good distractors for multiple-choice
- Some exercises genuinely need free-text (e.g., "simplify this expression")

**Effort**: Low-Medium

#### Approach 2: Robust symbolic evaluator for free-text

**Description**:
- Build a symbolic evaluator that understands mathematical equivalence
- Parse student answers as mathematical expressions/sets
- Compare semantically rather than syntactically
- Handle order-independent answers (sets of zeros, solution sets)

**Pros**:
- Most flexible for students
- Handles varied representations gracefully
- Pedagogically valuable for expression simplification

**Cons**:
- High complexity (need math parser, symbolic comparison)
- Risk of false positives (accepting wrong answers)
- Significant development time
- May be overkill for MVP

**Effort**: High

#### Approach 3: Hybrid — multiple-choice where appropriate + improved exact matching

**Description**:
- Convert exercises with high answer ambiguity to multiple-choice
- Improve exact evaluator to handle common variations (whitespace, comma vs "y", order)
- Keep free-text only for low-ambiguity cases
- Add runtime option shuffling for multiple-choice

**Pros**:
- Balances pedagogical sound with implementation simplicity
- Reduces ambiguity without building a full symbolic engine
- Option shuffling prevents position bias

**Cons**:
- Still requires manual exercise curation
- Improved exact matching is a band-aid, not a real solution
- Multiple-choice doesn't work for all exercise types

**Effort**: Medium

### Recommendation

**Approach 1 (Fix exercise types + convert to multiple-choice)** is recommended for the following reasons:

1. **Immediate bug fix**: Reclassifying question 11 as `"symbolic"` instead of `"numerical"` fixes the critical issue where valid answers are always marked wrong.

2. **Pedagogical alignment**: For questions like "zeros of f(x) = x² - 4", multiple-choice is pedagogically appropriate because:
   - It tests recognition of the correct zeros among distractors
   - It avoids formatting ambiguity (order, notation)
   - It's faster for students to answer
   - It provides clear diagnostic signal

3. **Low implementation risk**: Mostly data changes in `exercises.json`, minimal code changes.

4. **MVP-appropriate**: Builds a solid foundation without over-engineering. A robust symbolic evaluator can be added later if needed.

**Specific actions**:
- Change `ex.u6.ceros_positividad_negatividad.1` type from `"numerical"` to `"multiple-choice"`
- Add options: `["x = -2, x = 2", "x = 2", "x = -2", "x = 4, x = -4"]` (or similar distractors)
- Review other exercises with similar issues (e.g., `ex.u3.ecuaciones_cuadraticas.1`, `ex.u2.gauss.1`)
- Add runtime option shuffling for multiple-choice exercises to prevent position bias
- Document exercise type selection criteria in content guidelines

### Risks

1. **Data migration**: Changing exercise types may affect existing diagnostic results or practice progress if users have already attempted these exercises. Mitigation: version the catalog or clear affected progress.

2. **Distractor quality**: Poor multiple-choice distractors reduce pedagogical value. Mitigation: use common error patterns from `commonErrorTags` to generate plausible wrong answers.

3. **Option shuffling breaks reproducibility**: If options are shuffled at runtime, the same exercise may appear differently to different students. Mitigation: this is actually a feature, not a bug — it prevents position bias.

4. **Incomplete coverage**: Fixing only question 11 leaves other brittle exercises. Mitigation: audit all `"numerical"` and `"symbolic"` exercises for similar issues.

### Ready for Proposal

**Yes** — The exploration has identified the root causes and a clear path forward. The orchestrator should inform the user:

> "Encontramos el problema: la pregunta 11 está marcada como tipo 'numerical' pero la respuesta esperada es 'x = -2, x = 2', que no es un número. El evaluador numérico falla siempre. Además, confirmamos que las opciones de múltiple-choice NO están siempre en el primer lugar (aparecen en posiciones variadas), pero tampoco se mezclan en runtime.
>
> La solución recomendada es: (1) reclasificar ejercicios con respuestas no-numéricas, (2) convertir a multiple-choice los ejercicios con alta ambigüedad de formato, y (3) agregar mezclado de opciones en runtime.
>
> ¿Avanzamos con una propuesta de cambio (SDD proposal) para implementar estas correcciones?"
