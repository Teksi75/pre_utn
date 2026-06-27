/**
 * Tests for src/app/layout.tsx — auth wiring integration.
 *
 * Verifies the root layout wires SessionProvider + AuthBootstrap:
 * - Imports SessionProvider from @/components/auth
 * - Imports AuthBootstrap from @/components/auth
 * - Wraps children with <SessionProvider>
 * - Mounts <AuthBootstrap /> alongside <PersistenceInitializer />
 * - Preserves existing Spanish metadata and html lang="es"
 *
 * Spec: T-AUTH-S1.9 — "Wire SessionProvider + AuthBootstrap in
 * src/app/layout.tsx. Acceptance: no hydration mismatch; stable
 * server placeholder for Nav badge."
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function layoutSource(): string {
  return readFileSync(join(repoRoot, "src/app/layout.tsx"), "utf8");
}

describe("layout — auth shell wiring", () => {
  it("imports SessionProvider from @/components/auth", () => {
    const src = layoutSource();
    expect(src).toMatch(/import\s*\{[^}]*SessionProvider[^}]*\}\s*from\s*["']@\/components\/auth["']/);
  });

  it("imports AuthBootstrap from @/components/auth", () => {
    const src = layoutSource();
    expect(src).toMatch(/import\s*\{[^}]*AuthBootstrap[^}]*\}\s*from\s*["']@\/components\/auth["']/);
  });

  it("wraps children with <SessionProvider>", () => {
    const src = layoutSource();
    expect(src).toContain("<SessionProvider");
    // SessionProvider must wrap the page content
    expect(src).toMatch(/<SessionProvider[^>]*>[\s\S]*\{children\}[\s\S]*<\/SessionProvider>/);
  });

  it("mounts <AuthBootstrap /> alongside <PersistenceInitializer />", () => {
    const src = layoutSource();
    expect(src).toContain("<AuthBootstrap");
    expect(src).toContain("<PersistenceInitializer");
  });

  it("AuthBootstrap is inside SessionProvider (provider > children)", () => {
    const src = layoutSource();
    const providerStart = src.indexOf("<SessionProvider");
    const bootstrapPos = src.indexOf("<AuthBootstrap");
    const providerEnd = src.indexOf("</SessionProvider>");
    expect(providerStart).toBeGreaterThan(-1);
    expect(bootstrapPos).toBeGreaterThan(providerStart);
    expect(bootstrapPos).toBeLessThan(providerEnd);
  });

  it("preserves existing html lang='es'", () => {
    const src = layoutSource();
    expect(src).toMatch(/<html lang="es">/);
  });

  it("preserves existing metadata.openGraph.locale 'es_AR'", () => {
    const src = layoutSource();
    expect(src).toMatch(/locale:\s*"es_AR"/);
  });

  it("preserves existing metadata.other Content-Language 'es'", () => {
    const src = layoutSource();
    expect(src).toMatch(/"Content-Language":\s*"es"/);
  });
});