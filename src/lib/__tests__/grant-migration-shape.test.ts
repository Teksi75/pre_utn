/**
 * Migration shape test for the 20260629 grant migration.
 *
 * Confirms the authenticated role gets SELECT/INSERT/UPDATE on both student
 * sync tables, that anon is NOT granted anything, that RLS is NOT disabled,
 * and that no service_role/client-secret material is introduced.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const MIGRATION_FILE = join(
  ROOT,
  "supabase",
  "migrations",
  "20260629_grant_authenticated_student_sync_tables.sql"
);

function readMigration(): string {
  // Normalize CRLF → LF so \n-based assertions pass on Windows working tree.
  return readFileSync(MIGRATION_FILE, "utf-8").replace(/\r\n/g, "\n");
}

// Strip `--` line comments so negative assertions target real SQL, not the
// explanatory guards documented in the migration header.
function readMigrationBody(): string {
  return readMigration()
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

describe("grant migration shape (20260629)", () => {
  it("grants usage on schema public to authenticated", () => {
    const sql = readMigration();
    expect(sql).toMatch(/grant\s+usage\s+on\s+schema\s+public\s+to\s+authenticated\s*;/i);
  });

  it("contains exactly the three expected grant statements", () => {
    const body = readMigrationBody();
    const grants = body.match(/\bgrant\b/gi) ?? [];
    expect(grants).toHaveLength(3);
  });

  it("grants select, insert, update on student_profiles to authenticated", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+public\.student_profiles\s+to\s+authenticated\s*;/i
    );
  });

  it("grants select, insert, update on student_progress_snapshots to authenticated", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+public\.student_progress_snapshots\s+to\s+authenticated\s*;/i
    );
  });

  it("does not grant anything to anon", () => {
    const body = readMigrationBody();
    expect(body).not.toMatch(/to\s+anon\b/i);
    expect(body).not.toMatch(/grant\b[\s\S]*?\banon\b/i);
  });

  it("does not disable row level security", () => {
    const body = readMigrationBody();
    expect(body).not.toMatch(/disable\s+row\s+level\s+security/i);
  });

  it("does not drop or alter RLS policies", () => {
    const body = readMigrationBody();
    expect(body).not.toMatch(/drop\s+policy/i);
    expect(body).not.toMatch(/alter\s+policy/i);
  });

  it("does not grant delete privileges", () => {
    const body = readMigrationBody();
    expect(body).not.toMatch(/delete/i);
  });

  it("does not introduce service_role or client secrets", () => {
    const body = readMigrationBody();
    expect(body).not.toMatch(/service_role/i);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(body).not.toMatch(/anon\s+key/i);
  });
});
