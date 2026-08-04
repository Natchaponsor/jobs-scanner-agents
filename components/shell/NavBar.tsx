"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/sources", label: "Scan sources" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-accent-strong" />
          <span className="font-serif text-lg font-semibold tracking-tight text-fg">Jobs Scanner Agents</span>
        </div>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href ? "bg-accent-tint text-accent-strong" : "text-fg-muted hover:text-fg"
              )}
            >
              {link.href === "/sources" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  {link.label}
                </span>
              ) : (
                link.label
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
