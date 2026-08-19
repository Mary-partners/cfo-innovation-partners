"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex h-full w-64 flex-col gap-1 border-r border-navy-900/10 bg-white p-4">
      <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2 text-navy-900">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
          <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" />
          <path
            d="M10 22 C10 14, 18 10, 18 10 C18 10, 26 14, 26 22"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="18" cy="22" r="2" fill="currentColor" />
        </svg>
        <span className="text-base font-semibold">CFOIP OS</span>
      </Link>

      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-navy-900 text-warm-white"
                    : "text-slate-text hover:bg-navy-900/5",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} aria-hidden />
                  {item.label}
                </span>
                {!item.implemented ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      isActive ? "bg-warm-white/20 text-warm-white" : "bg-gold-500/20 text-navy-900",
                    )}
                  >
                    Soon
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
