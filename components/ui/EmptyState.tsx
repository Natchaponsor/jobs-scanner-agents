import type { ReactNode } from "react";

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
      <p className="text-base font-medium text-fg">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-fg-muted">{subtitle}</p>}
      {action}
    </div>
  );
}
