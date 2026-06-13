import type { StudentProfile } from "../domain/student-profile/index";
import {
  createProfileAndActivate,
  recoverActiveProfile,
  setActiveStudentId,
  type ProfileSaveResult,
} from "../lib/student-profile-storage";

type ActiveStudentListener = () => void;

const listeners = new Set<ActiveStudentListener>();

let activeStudentSnapshot: StudentProfile | null = recoverActiveProfile();

function emitActiveStudentChange(): void {
  activeStudentSnapshot = recoverActiveProfile();
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeActiveStudent(listener: ActiveStudentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveStudentSnapshot(): StudentProfile | null {
  return activeStudentSnapshot;
}

export function getActiveStudentServerSnapshot(): StudentProfile | null {
  return null;
}

export function refreshActiveStudent(): void {
  emitActiveStudentChange();
}

export function createAndActivateActiveStudent(
  displayName: string,
): ProfileSaveResult {
  const result = createProfileAndActivate({ displayName });
  if (result.ok) {
    emitActiveStudentChange();
  }
  return result;
}

export function switchActiveStudent(studentId: string): ProfileSaveResult {
  const result = setActiveStudentId(studentId);
  if (result.ok) {
    emitActiveStudentChange();
  }
  return result;
}
