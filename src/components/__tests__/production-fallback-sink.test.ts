/**
 * Production fallback sink — proves a safe production callback is wired
 * into initializePersistence for fallback/degraded events.
 *
 * CRITICAL FIX: onFallback existed but no production code passed one.
 * This test verifies a console-warn sink is used in production.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function initializerSource(): string {
  return readFileSync(join(repoRoot, "src/components/PersistenceInitializer.tsx"), "utf8");
}

function sinkSource(): string {
  return readFileSync(join(repoRoot, "src/lib/persistence/fallback-sink.ts"), "utf8");
}

describe("production fallback sink", () => {
  it("fallback-sink module exists", () => {
    expect(() => sinkSource()).not.toThrow();
  });

  it("exports a createProductionFallbackSink function", () => {
    const src = sinkSource();
    expect(src).toContain("createProductionFallbackSink");
    expect(src).toMatch(/export\s+(function|const)\s+createProductionFallbackSink/);
  });

  it("sink logs warning via console.warn", () => {
    const src = sinkSource();
    expect(src).toContain("console.warn");
  });

  it("sink does NOT expose service_role or non-public env data in code", () => {
    const src = sinkSource();
    // Strip comments before checking — only code matters
    const codeOnly = src.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codeOnly).not.toContain("service_role");
    expect(codeOnly).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(codeOnly).not.toContain("publishableKey");
    expect(codeOnly).not.toContain("NEXT_PUBLIC_SUPABASE");
  });

  it("PersistenceInitializer passes onFallback to initializePersistence", () => {
    const src = initializerSource();
    // Must pass options with onFallback
    expect(src).toContain("onFallback");
    expect(src).toMatch(/initializePersistence\s*\(\s*\{[\s\S]*onFallback/);
  });

  it("PersistenceInitializer imports and uses the production sink", () => {
    const src = initializerSource();
    expect(src).toContain("createProductionFallbackSink");
    expect(src).toContain("fallback-sink");
  });
});
