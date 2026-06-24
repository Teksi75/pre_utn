/**
 * Migration RLS shape test — asserts the SQL migration includes
 * own-row policies for both tables.
 *
 * Spec: "RLS condition: (select auth.uid()) = user_id"
 * Design: "policies: select own rows, insert own rows, update own rows"
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const MIGRATION_FILE = join(ROOT, "supabase", "migrations", "20260622_supabase_adapter_v0.sql");

function readMigration(): string {
  return readFileSync(MIGRATION_FILE, "utf-8");
}

describe("migration RLS shape", () => {
  it("creates student_profiles table", () => {
    const sql = readMigration();
    expect(sql).toContain("create table public.student_profiles");
  });

  it("creates student_progress_snapshots table", () => {
    const sql = readMigration();
    expect(sql).toContain("create table public.student_progress_snapshots");
  });

  it("enables RLS on student_profiles", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "alter table public.student_profiles enable row level security"
    );
  });

  it("enables RLS on student_progress_snapshots", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "alter table public.student_progress_snapshots enable row level security"
    );
  });

  it("creates select own-row policy for profiles", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"profiles_select_own"\s+on\s+public\.student_profiles\s+for\s+select\s+using\s+\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/
    );
  });

  it("creates insert own-row policy for profiles", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"profiles_insert_own"\s+on\s+public\.student_profiles\s+for\s+insert\s+with\s+check\s+\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/
    );
  });

  it("creates update own-row policy for profiles", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"profiles_update_own"\s+on\s+public\.student_profiles\s+for\s+update/
    );
  });

  it("creates select own-row policy for progress", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"progress_select_own"\s+on\s+public\.student_progress_snapshots\s+for\s+select\s+using\s+\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/
    );
  });

  it("creates insert own-row policy for progress", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"progress_insert_own"\s+on\s+public\.student_progress_snapshots\s+for\s+insert\s+with\s+check\s+\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/
    );
  });

  it("creates update own-row policy for progress", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /create policy\s+"progress_update_own"\s+on\s+public\.student_progress_snapshots\s+for\s+update/
    );
  });

  it("has unique constraint on (user_id, student_id) for profiles", () => {
    const sql = readMigration();
    expect(sql).toContain("unique (user_id, student_id)");
  });

  it("has foreign key from progress to profiles", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "foreign key (user_id, student_id)\n    references public.student_profiles(user_id, student_id)"
    );
  });

  it("uses auth.uid() in all policies (not hardcoded user)", () => {
    const sql = readMigration();
    // Every policy must use auth.uid(), never a hardcoded UUID
    const policyBlocks = sql.match(/create policy[\s\S]*?;/g) ?? [];
    for (const policy of policyBlocks) {
      expect(policy).toContain("auth.uid()");
    }
  });

  it("does not contain any service role references", () => {
    const sql = readMigration();
    expect(sql).not.toMatch(/service_role/i);
    expect(sql).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
