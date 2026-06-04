"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/practice", label: "Práctica" },
  { href: "/diagnostic", label: "Diagnóstico" },
] as const;

export function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Principal"
      className="border-b border-[var(--color-brand-200)] bg-[var(--color-surface)]/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-lg font-bold text-[var(--color-brand-900)] tracking-tight"
        >
          Ingenium
          <span className="hidden sm:inline text-xs font-normal text-[var(--color-brand-500)] tracking-normal">
            Preuniversitario para Ingenierías
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors ${
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
