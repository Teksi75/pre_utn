/**
 * Nav — global navigation bar. Mounted once in src/app/layout.tsx.
 *
 * Reads session and active-student state via hooks, renders the brand
 * mark, optional active-student chip, the sync status badge (extracted
 * to `SyncStatusBadge` for testability), and the four nav links.
 *
 * @module components/Nav
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveStudent } from "../hooks/useActiveStudent";
import { useSession } from "@/components/auth";
import { usePostAuthSyncStatus } from "../hooks/usePostAuthSyncStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/learn", label: "Aprender" },
  { href: "/practice", label: "Práctica" },
  { href: "/diagnostic", label: "Diagnóstico" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { student } = useActiveStudent();
  const { session, userEmail, isAuthEnabled, signOut } = useSession();
  // Sync pill reads from the live post-auth sync status — never from
  // session alone. A session existing does not imply "Sincronizado":
  // the orchestrator must confirm the FK row + import branch before
  // the synchronized pill renders. See `SyncStatusBadge` for the
  // status→pill mapping.
  const syncStatus = usePostAuthSyncStatus();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Principal"
      className="border-b border-[var(--color-brand-200)] bg-[var(--color-surface)]/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-2 text-lg font-bold text-[var(--color-brand-900)] tracking-tight"
        >
          INGENIUM
          <span className="hidden sm:inline text-xs font-normal text-[var(--color-brand-500)] tracking-normal">
            Preuniversitario para Ingenierías
          </span>
        </Link>
        {/*
          The link row can overflow on narrow mobile (4 nav items + the
          optional active-student chip on desktop). We wrap it in a
          horizontally scrollable container so the *page* never scrolls
          sideways; only the nav row does, with no visible scrollbar and
          momentum scrolling on touch devices.
        */}
        <div
          className="flex items-center gap-3 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {/* Active student chip — discreet, right side. No emoji:
              AGENTS.md "Anti-patrones visuales asociados" forbids
              birrete/capirotada-style indicators because they push
              the product toward a "profe/tutor" framing. The chip
              is a neutral status pill. */}
          {student !== null && (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-100)] text-xs font-medium text-[var(--color-brand-700)] border border-[var(--color-brand-200)]">
              <span>Alumno activo:</span>
              <span className="font-semibold text-[var(--color-brand-900)] not-italic">
                {student.displayName}
              </span>
            </span>
          )}

          {/* Sync status badge — see SyncStatusBadge for the full
              status→pill mapping. The synchronized pill ONLY renders
              when the orchestrator confirms the FK row + import
              branch. Pending and local-fallback must never advertise
              the user as synchronized. */}
          <SyncStatusBadge
            syncStatus={syncStatus}
            session={session}
            userEmail={userEmail}
            isAuthEnabled={isAuthEnabled}
            signOut={signOut}
          />

          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors ${
                isActive(href)
                  ? "text-[var(--color-brand-900)] bg-[var(--color-brand-100)]"
                  : "text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
              }`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}