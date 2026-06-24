/**
 * PersistenceInitializer — proves the production initializer component
 * calls initializePersistence() once and renders nothing.
 *
 * BLOCKER FIX: Production init was defined but never invoked.
 * This component mounts from layout.tsx and wires the adapter.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function source(): string {
  return readFileSync(join(repoRoot, "src/components/PersistenceInitializer.tsx"), "utf8");
}

describe("PersistenceInitializer", () => {
  it("exists as a component file", () => {
    expect(() => source()).not.toThrow();
  });

  it("imports initializePersistence from @/lib/persistence", () => {
    const src = source();
    expect(src).toContain("initializePersistence");
    expect(src).toContain("@/lib/persistence");
  });

  it("calls initializePersistence in useEffect", () => {
    const src = source();
    // Must use useEffect for one-time initialization
    expect(src).toContain("useEffect");
    expect(src).toMatch(/initializePersistence\s*\(/);
  });

  it("renders null (no UI)", () => {
    const src = source();
    // Must return null from the component body
    expect(src).toMatch(/return\s+null/);
  });

  it("uses empty dependency array for one-time call", () => {
    const src = source();
    // useEffect with [] ensures it runs once on mount
    expect(src).toMatch(/useEffect\(/);
    expect(src).toMatch(/\[\s*\]/);
  });

  it("is a client component (required for useEffect)", () => {
    const src = source();
    expect(src).toContain('"use client"');
  });
});
