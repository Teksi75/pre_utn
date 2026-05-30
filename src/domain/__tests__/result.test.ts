import { describe, test, expect } from "vitest";
import { ok, err, isOk, isErr } from "../models/result";

describe("Result type", () => {
  describe("ok()", () => {
    test("wraps a value into a success result", () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    test("wraps a string value", () => {
      const result = ok("hello");
      expect(result).toEqual({ ok: true, value: "hello" });
    });

    test("wraps an object value", () => {
      const result = ok({ name: "test", count: 3 });
      expect(result).toEqual({ ok: true, value: { name: "test", count: 3 } });
    });
  });

  describe("err()", () => {
    test("wraps an error into a failure result", () => {
      const result = err("something went wrong");
      expect(result).toEqual({ ok: false, error: "something went wrong" });
    });

    test("wraps a structured error", () => {
      const error = { field: "id", message: "invalid format" };
      const result = err(error);
      expect(result).toEqual({ ok: false, error });
    });
  });

  describe("type narrowing", () => {
    test("isOk returns true for ok results", () => {
      expect(isOk(ok(1))).toBe(true);
    });

    test("isOk returns false for err results", () => {
      expect(isOk(err("fail"))).toBe(false);
    });

    test("isErr returns true for err results", () => {
      expect(isErr(err("fail"))).toBe(true);
    });

    test("isErr returns false for ok results", () => {
      expect(isErr(ok(1))).toBe(false);
    });
  });

  describe("discriminated union narrowing", () => {
    test("pattern matching works on ok result", () => {
      const result = ok(10);
      if (result.ok) {
        // TypeScript narrows to { ok: true; value: number }
        expect(result.value).toBe(10);
      } else {
        throw new Error("Should have narrowed to ok");
      }
    });

    test("pattern matching works on err result", () => {
      const result = err("bad");
      if (!result.ok) {
        // TypeScript narrows to { ok: false; error: string }
        expect(result.error).toBe("bad");
      } else {
        throw new Error("Should have narrowed to err");
      }
    });
  });
});
