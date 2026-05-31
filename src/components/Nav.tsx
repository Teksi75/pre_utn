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
      className="border-b border-brand-300 bg-white/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-brand-900 tracking-tight"
        >
          Pre UTN
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(href)
                  ? "text-brand-900 bg-brand-100"
                  : "text-brand-700 hover:text-brand-900 hover:bg-brand-100"
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
