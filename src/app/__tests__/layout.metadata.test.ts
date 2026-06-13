import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("Root layout Spanish metadata", () => {
  test("html lang attribute is preserved as es", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toMatch(/<html lang="es">/);
  });

  test("metadata.openGraph.locale is set to es_AR", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toMatch(/openGraph:\s*\{\s*locale:\s*"es_AR"/);
  });

  test("metadata.other contains Content-Language: es", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toMatch(/"Content-Language":\s*"es"/);
  });
});
