import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("RootLayout — E1 sticky footer wiring", () => {
  const layoutPath = "src/app/layout.tsx";

  test("body is a flex column with min-h-screen so the footer can sit at the bottom", () => {
    const layout = source(layoutPath);
    // body must carry min-h-screen (kept from before) AND the flex
    // plumbing (flex flex-col) for the sticky-footer pattern.
    expect(layout).toMatch(/<body[^>]*className="[^"]*min-h-screen/);
    expect(layout).toMatch(/<body[^>]*className="[^"]*flex/);
    expect(layout).toMatch(/<body[^>]*className="[^"]*flex-col/);
  });

  test("main has flex-1 so it expands to fill the available height", () => {
    const layout = source(layoutPath);
    // The <main id="main-content" role="main"> element must carry
    // the flex-1 utility so the <footer> is pushed to the bottom
    // when the page content is short.
    expect(layout).toMatch(/<main[^>]*flex-1/);
  });

  test("keeps the skip-link, role='banner' on the header, and role='main' on <main>", () => {
    // E1 must not regress the existing accessibility landmarks.
    const layout = source(layoutPath);
    expect(layout).toMatch(/<a[^>]*href="#main-content"[^>]*className="skip-link"/);
    expect(layout).toMatch(/<header[^>]*role="banner"/);
    expect(layout).toMatch(/<main[^>]*id="main-content"/);
    expect(layout).toMatch(/<main[^>]*role="main"/);
  });

  test("Nav is still rendered inside the <header role='banner'> landmark", () => {
    const layout = source(layoutPath);
    expect(layout).toContain("<Nav />");
    expect(layout).toMatch(/<header role="banner">[\s\S]*<Nav \/>/);
  });

  test("still imports the global stylesheet and the Nav component", () => {
    const layout = source(layoutPath);
    expect(layout).toContain('import "./globals.css"');
    expect(layout).toContain('import { Nav }');
  });

  test("renders exactly one <footer> with the disclaimer copy", () => {
    const layout = source(layoutPath);
    expect(layout).toMatch(/<footer\b/);
    expect(layout).toMatch(/<\/footer>/);
    expect(layout).toContain("Programa independiente de preparación preuniversitaria");
  });

  test("does not introduce any, console.log, or TODO in the layout file", () => {
    const layout = source(layoutPath);
    expect(layout).not.toMatch(/:\s*any\b/);
    expect(layout).not.toMatch(/<any\b/);
    expect(layout).not.toContain("console.log");
    expect(layout).not.toMatch(/\bTODO\b/);
  });
});
