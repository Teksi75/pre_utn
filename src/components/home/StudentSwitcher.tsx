"use client";

import { useState, useCallback, useEffect } from "react";
import { useActiveStudent } from "../../hooks/useActiveStudent";
import { loadProfiles } from "../../lib/student-profile-storage";
import { validateDisplayName } from "../../domain/student-profile/index";
import { Card } from "../ui/Card";
import type { StudentProfile, ProfilesState } from "../../domain/student-profile/index";

export interface StudentSwitcherProps {
  onClose: () => void;
}

/**
 * Student switcher modal/drawer.
 *
 * - Lists all existing local profiles.
 * - Lets the user activate one (calls switchTo + onClose).
 * - Lets the user create a new one (calls createAndActivate + onClose).
 * - No delete, edit, password, or avatar actions.
 *
 * Pedagogical language: alumno, perfil, estudio.
 */
export function StudentSwitcher({ onClose }: StudentSwitcherProps) {
  const { student: activeStudent, switchTo, createAndActivate } = useActiveStudent();
  const [profilesState, setProfilesState] = useState<ProfilesState>({ profiles: [], activeStudentId: null });

  useEffect(() => {
    const result = loadProfiles();
    if (result instanceof Promise) {
      result.then(setProfilesState).catch(() => {});
    } else {
      setProfilesState(result);
    }
  }, []);

  const profiles = profilesState.profiles;

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(
    (studentId: string) => {
      switchTo(studentId);
      onClose();
    },
    [switchTo, onClose],
  );

  const handleCreate = useCallback(() => {
    const validationError = validateDisplayName(newName);
    if (validationError !== null) {
      setError(
        validationError === "empty"
          ? "El nombre no puede estar vacío."
          : validationError === "too-long"
            ? "El nombre no puede superar los 40 caracteres."
            : "El nombre tiene caracteres no válidos.",
      );
      return;
    }
    createAndActivate(newName.trim());
    onClose();
  }, [newName, createAndActivate, onClose]);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setNewName("");
    setError(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card
        variant="accent"
        className="w-full max-w-sm mx-4 p-6 space-y-4"
        aria-labelledby="student-switcher-title"
      >
        <div className="flex items-center justify-between">
          <h2
            id="student-switcher-title"
            className="text-lg font-bold text-[var(--color-brand-900)]"
          >
            Cambiar alumno
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded-[var(--radius-button)] text-[var(--color-brand-600)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!isCreating ? (
          <>
            {/* Existing profiles list */}
            <div className="space-y-2">
              <p className="text-sm text-[var(--color-brand-600)] font-medium">
                Perfiles en este dispositivo
              </p>
              {profiles.length === 0 ? (
                <p className="text-sm text-[var(--color-brand-500)] italic">
                  No hay perfiles guardados.
                </p>
              ) : (
                profiles.map((profile: StudentProfile) => (
                  <button
                    key={profile.studentId}
                    onClick={() => handleSelect(profile.studentId)}
                    disabled={profile.studentId === activeStudent?.studentId}
                    className="w-full text-left px-4 py-3 rounded-[var(--radius-button)] border border-[var(--color-brand-200)] bg-[var(--color-surface)] hover:bg-[var(--color-brand-50)] active:bg-[var(--color-brand-100)] transition-colors disabled:opacity-60 disabled:cursor-default flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-[var(--color-brand-800)] group-disabled:text-[var(--color-brand-500)]">
                      {profile.displayName}
                    </span>
                    {profile.studentId === activeStudent?.studentId && (
                      <span className="text-xs text-[var(--color-brand-500)] font-normal">
                        (activo)
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create new */}
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 px-4 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-brand-300)] text-[var(--color-brand-700)] text-sm font-medium hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-800)] transition-colors"
            >
              + Crear un nuevo perfil
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {/* Create form */}
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-brand-600)] font-medium">
                Nuevo perfil
              </p>
              <div>
                <label
                  htmlFor="new-profile-name"
                  className="block text-sm font-medium text-[var(--color-brand-800)] mb-1"
                >
                  Nombre o apodo
                </label>
                <input
                  id="new-profile-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) handleCreate();
                    if (e.key === "Escape") handleCancelCreate();
                  }}
                  placeholder="Ej: Lucía"
                  autoFocus
                  className="w-full px-3 py-2 rounded-[var(--radius-button)] border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-[var(--color-brand-900)] placeholder:text-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-colors"
                  maxLength={60}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-[var(--color-error)]">
                  {error}
                </p>
              )}
            </div>

            {/* Create / Cancel buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-2 px-4 rounded-[var(--radius-button)] bg-[var(--color-brand-600)] text-white font-semibold text-sm hover:bg-[var(--color-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crear perfil
              </button>
              <button
                onClick={handleCancelCreate}
                className="py-2 px-4 rounded-[var(--radius-button)] border border-[var(--color-brand-300)] text-[var(--color-brand-700)] text-sm font-medium hover:bg-[var(--color-brand-50)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
