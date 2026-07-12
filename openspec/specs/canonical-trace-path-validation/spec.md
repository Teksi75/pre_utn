# Canonical Trace Path Validation

## Requirement: Trace Path Validation

`validateTracePath(repositoryRoot: string, tracePath: string)` MUST return a boolean and MUST NOT throw for any in-contract input. It MUST return `true` ONLY when ALL hold:

1. `repositoryRoot` is a non-empty string.
2. `tracePath` is a non-empty relative string.
3. `path.resolve(repositoryRoot, tracePath)` stays inside `repositoryRoot`.
4. The resolved path exists on disk.

It MUST return `false` for absolute paths, parent-escaping `..`, empty/whitespace inputs, missing-on-disk paths, and filesystem errors.

Non-string arguments are out-of-contract; the public type signature is `(string, string) => boolean`. One robustness test with `@ts-expect-error` documents defensive behavior but is not normative.

### Scenario: in-root existing path returns true

- GIVEN a non-empty root and a relative path resolving inside root that exists on disk
- WHEN `validateTracePath` is called
- THEN it returns `true`

### Scenario: absolute trace path returns false

- GIVEN a non-empty root and an absolute trace path
- WHEN called
- THEN it returns `false` without throwing

### Scenario: parent-escape returns false

- GIVEN a non-empty root and a `..` path resolving outside root
- WHEN called
- THEN it returns `false` without throwing

### Scenario: empty or whitespace input returns false

- GIVEN empty or whitespace-only `repositoryRoot` or `tracePath`
- WHEN called
- THEN it returns `false` without throwing

### Scenario: missing on disk returns false

- GIVEN valid root and relative path that does not exist on disk
- WHEN called
- THEN it returns `false` without throwing

### Scenario: filesystem error returns false without throw

- GIVEN `existsSync` is mocked to throw synchronously
- WHEN called with valid root and relative path
- THEN it returns `false` without throwing
- AND mocks are restored in afterEach
