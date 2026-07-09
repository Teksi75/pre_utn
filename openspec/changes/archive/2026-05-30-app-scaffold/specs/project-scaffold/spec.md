# Project Scaffold Specification

## Purpose

Defines requirements for bootstrapping the Next.js application so TDD becomes executable. Covers project manifest, build tooling, test runner, directory boundaries, and verification scripts. This is the first implementation change — no prior specs exist.

## Requirements

### Requirement: Project Manifest and Scripts

The project MUST provide a `package.json` managed exclusively with `pnpm`. Scripts SHALL enable test, typecheck, build, and dev workflows.

#### Scenario: pnpm is the only package manager

- GIVEN a developer clones the repo
- WHEN they read `package.json`
- THEN `scripts` include `test`, `typecheck`, `build`, and `dev`
- AND no `npm` or `yarn` references exist in scripts or documentation

#### Scenario: test script runs Vitest

- GIVEN the project is scaffolded
- WHEN `pnpm run test` executes
- THEN Vitest runs all `__tests__` and `.test.` files under `src/` and `tests/`
- AND exit code is 0 when tests pass

#### Scenario: typecheck script validates TypeScript

- GIVEN the project is scaffolded
- WHEN `pnpm run typecheck` executes
- THEN the TypeScript compiler checks all `.ts` and `.tsx` files in strict mode
- AND exit code is non-zero on any type error

#### Scenario: build script compiles successfully

- GIVEN the project is scaffolded
- WHEN `pnpm run build` executes
- THEN Next.js produces a production build without errors
- AND exit code is 0

### Requirement: TypeScript Strict Mode

TypeScript configuration SHALL enforce strict type checking across the entire project.

#### Scenario: strict mode is enabled

- GIVEN `tsconfig.json` exists
- WHEN the config is read
- THEN `strict` is `true`
- AND `noImplicitAny` is enforced

#### Scenario: path alias works

- GIVEN `tsconfig.json` is configured
- WHEN a file imports from `@/domain/something`
- THEN the import resolves to `src/domain/something`

### Requirement: Next.js App Router

The application SHALL use Next.js with App Router, a `src/` directory, and minimal generated boilerplate.

#### Scenario: App Router is active

- GIVEN the project is scaffolded
- WHEN `src/app/layout.tsx` and `src/app/page.tsx` exist
- THEN the app renders a root layout and a landing page
- AND `pnpm run dev` starts the dev server without errors

#### Scenario: generated boilerplate is stripped

- GIVEN `create-next-app` produces default files
- WHEN the scaffold is finalized
- THEN unnecessary SVGs, default favicons, and non-standard ESLint configs are removed
- AND only minimal layout and page files remain

### Requirement: Vitest Test Runner

A Vitest configuration SHALL exist and be executable with a placeholder test that proves the runner works.

#### Scenario: Vitest config exists

- GIVEN the project is scaffolded
- WHEN `vitest.config.ts` is read
- THEN it configures Vitest to discover tests under `src/` and `tests/`
- AND it is compatible with the project's TypeScript config

#### Scenario: placeholder test passes

- GIVEN a test file exists in `src/domain/__tests__/`
- WHEN `pnpm run test` executes
- THEN the placeholder test passes with a trivial assertion (e.g., `expect(true).toBe(true)`)

### Requirement: Directory Structure

The project SHALL establish directory boundaries that enforce Clean Architecture conventions. The `src/domain/` directory MUST remain free of React, Next.js, and Supabase imports.

#### Scenario: required directories exist

- GIVEN the project is scaffolded
- WHEN the filesystem is inspected
- THEN directories `src/domain/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/app/`, `content/matematica/`, `content/fisica/`, `supabase/migrations/`, and `tests/` exist
- AND empty directories contain `.gitkeep`

#### Scenario: domain barrel is pure

- GIVEN files exist under `src/domain/`
- WHEN those files are scanned for imports
- THEN no import from `react`, `next`, or `@supabase` is present
- AND only pure TypeScript logic is allowed

### Requirement: Tailwind CSS

Tailwind CSS SHALL be available using the version produced by the Next.js scaffolder.

#### Scenario: Tailwind is configured

- GIVEN the project is scaffolded
- WHEN `tailwind.config.ts` (or equivalent) exists
- THEN Tailwind utilities are usable in `.tsx` files
- AND no manual version override is applied unless incompatibility is discovered
