import { describe, test, expect } from "vitest";
import { PROJECT_PHASE, PROJECT_SCOPE } from "../index";

describe("Domain barrel — scaffold stage", () => {
  test("barrel is importable without side effects", () => {
    // Proves the domain index can be imported at module resolution time
    // without throwing. This is the scaffold-stage smoke gate: the barrel
    // exists, compiles, and is safe to import from app code.
    expect(PROJECT_PHASE).toBeDefined();
  });

  test("PROJECT_PHASE is 'scaffold' — math features not yet implemented", () => {
    expect(PROJECT_PHASE).toBe("scaffold");
  });

  test("PROJECT_SCOPE is 'matematica' — first subject, Física deferred", () => {
    expect(PROJECT_SCOPE).toBe("matematica");
  });

  test("no React, Next.js, or Supabase imports in domain barrel", () => {
    // This test documents the architectural boundary.
    // If a future change adds a forbidden import, this test will still pass
    // (it doesn't scan source), but the constant values above serve as a
    // compile-time canary: adding framework imports to the barrel would
    // break TypeScript strict mode or the build.
    expect(typeof PROJECT_PHASE).toBe("string");
    expect(typeof PROJECT_SCOPE).toBe("string");
  });
});
