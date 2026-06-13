"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import type { StudentProfile } from "../domain/student-profile/index";
import {
  createAndActivateActiveStudent,
  getActiveStudentServerSnapshot,
  getActiveStudentSnapshot,
  refreshActiveStudent,
  subscribeActiveStudent,
  switchActiveStudent,
} from "./active-student-store";

export interface UseActiveStudentResult {
  student: StudentProfile | null;
  createAndActivate: (displayName: string) => void;
  switchTo: (studentId: string) => void;
  refresh: () => void;
  isLoading: boolean;
}

/**
 * Client hook for active student state.
 *
 * - Loads and shares the active profile through a single external store.
 * - createAndActivate: creates a new profile and activates it.
 * - switchTo: activates an existing profile.
 * - refresh: re-reads the active profile and notifies every consumer.
 *
 * All persistence goes through the storage adapters — no direct localStorage calls.
 */
export function useActiveStudent(): UseActiveStudentResult {
  const student = useSyncExternalStore(
    subscribeActiveStudent,
    getActiveStudentSnapshot,
    getActiveStudentServerSnapshot,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load active profile on mount
  useEffect(() => {
    refreshActiveStudent();
    setIsLoading(false);
  }, []);

  const createAndActivate = useCallback((displayName: string) => {
    createAndActivateActiveStudent(displayName);
  }, []);

  const switchTo = useCallback((studentId: string) => {
    switchActiveStudent(studentId);
  }, []);

  const refresh = useCallback(() => {
    refreshActiveStudent();
  }, []);

  return { student, createAndActivate, switchTo, refresh, isLoading };
}
