"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { WORKING_ADAPTER_TYPES } from "@/lib/types";
import type { BigCategory, ScanSource, SourceGroup } from "@/lib/types";

const BIG_CATEGORY_ORDER: BigCategory[] = ["Finance", "Tech", "Consulting"];

const GROUPS_BY_BIG_CATEGORY: Record<BigCategory, SourceGroup[]> = {
  Finance: ["Banks & Traditional Finance", "Payments & FinTech", "Quant, Hedge Funds & Crypto", "Private Equity"],
  Tech: [
    "Big Tech",
    "Software",
    "AI",
    "E-Commerce",
    "Media and Entertainment",
    "Social Media",
    "Travel and Ride Share",
    "Etc",
  ],
  Consulting: ["Management Consulting", "Tech Consulting", "Big 4 & Professional Services", "Boutique Consulting"],
};

function isWorking(source: ScanSource) {
  return WORKING_ADAPTER_TYPES.includes(source.adapterType);
}

function Toggle({ on, disabled, onClick, label }: { on: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-40",
        on ? "border-accent bg-accent" : "border-border bg-panel"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-in-out",
          on ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SourceRow({ source }: { source: ScanSource }) {
  const { toggleSource, removeSource } = useJobsStore();
  const working = isWorking(source);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-fg">{source.name}</span>
          {working ? <Badge tone="new">adapter ready</Badge> : <Badge tone="warn">not yet supported</Badge>}
        </div>
        <p className="truncate text-xs text-fg-subtle">{source.identifier}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Toggle
          on={source.enabled}
          disabled={!working}
          onClick={() => toggleSource(source.id)}
          label={`${source.enabled ? "Disable" : "Enable"} ${source.name}`}
        />
        {!source.isDefault && (
          <button
            type="button"
            onClick={() => removeSource(source.id)}
            className="shrink-0 text-fg-subtle hover:text-loss"
            aria-label="Remove source"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** A collapsible leaf group: header row (chevron, title, on-count, optional master toggle)
 *  plus its rows, indented underneath. No box/border-all-sides treatment — a bottom hairline
 *  is the only separator, so nesting reads through typography and indentation rather than
 *  stacked rectangles. Used for Social media, each Career sites subcategory, and Custom
 *  sources. */
function CollapsibleGroup({
  title,
  emptyLabel = "No working adapters yet",
  sources,
  onToggleAll,
}: {
  title: string;
  emptyLabel?: string;
  sources: ScanSource[];
  onToggleAll?: (enabled: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const working = sources.filter(isWorking);
  const onCount = working.filter((s) => s.enabled).length;
  const allOn = working.length > 0 && onCount === working.length;

  return (
    <div className="border-b border-border py-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {collapsed ? <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" /> : <ChevronUp className="h-4 w-4 shrink-0 text-fg-subtle" />}
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">{title}</span>
            <span className="block text-xs text-fg-muted">
              {working.length > 0 ? `${onCount}/${working.length} on` : emptyLabel}
            </span>
          </span>
        </button>
        <Toggle
          on={allOn}
          disabled={working.length === 0 || !onToggleAll}
          onClick={() => onToggleAll?.(!allOn)}
          label={`${allOn ? "Disable" : "Enable"} all ${title} sources`}
        />
      </div>
      {!collapsed && (
        <div className="mt-2 pl-6">
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function BigCategorySection({ category, sourcesByGroup }: { category: BigCategory; sourcesByGroup: Map<SourceGroup, ScanSource[]> }) {
  const [collapsed, setCollapsed] = useState(true);
  const { setGroupEnabled } = useJobsStore();
  const groups = GROUPS_BY_BIG_CATEGORY[category].filter((g) => (sourcesByGroup.get(g)?.length ?? 0) > 0);
  if (groups.length === 0) return null;

  const allSources = groups.flatMap((g) => sourcesByGroup.get(g) ?? []);
  const working = allSources.filter(isWorking);
  const onCount = working.filter((s) => s.enabled).length;

  return (
    <div className="border-t border-border pt-5 pb-5 first:border-t-0 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        {collapsed ? <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" /> : <ChevronUp className="h-4 w-4 shrink-0 text-fg-subtle" />}
        <span className="min-w-0">
          <span className="block font-serif text-base font-semibold text-fg">{category}</span>
          <span className="block text-sm text-fg-muted">
            {groups.length} subcategor{groups.length === 1 ? "y" : "ies"} · {onCount}/{working.length} sources on
          </span>
        </span>
      </button>
      {!collapsed && (
        <div className="mt-3 pl-4">
          {groups.map((group) => (
            <CollapsibleGroup
              key={group}
              title={group}
              sources={sourcesByGroup.get(group) ?? []}
              onToggleAll={(enabled) => setGroupEnabled(group, enabled)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-lg font-semibold tracking-tight text-fg">{title}</h2>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
    </div>
  );
}

export default function SourcesPage() {
  const { sources, addCustomSource, hasHydrated } = useJobsStore();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  if (!hasHydrated) return <div className="text-sm text-fg-muted">Loading…</div>;

  const social = sources.filter((s) => s.category === "social");
  const company = sources.filter((s) => s.category === "company");
  const defaultCompany = company.filter((s) => s.isDefault);
  const customCompany = company.filter((s) => !s.isDefault);
  const sourcesByGroup = new Map<SourceGroup, ScanSource[]>();
  for (const s of defaultCompany) {
    if (!s.group) continue;
    sourcesByGroup.set(s.group, [...(sourcesByGroup.get(s.group) ?? []), s]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-fg">Scan sources</h1>
        <p className="text-sm text-fg-muted">
          Choose what the scanner looks at. Sources marked &ldquo;not yet supported&rdquo; are custom career
          sites that need a per-company scraper — toggling stays off until one is wired up.
        </p>
      </div>

      <Card>
        <SectionHeading
          title="Social platforms"
          description="Job boards, not individual companies — see README for why these aren't automated."
        />
        <CollapsibleGroup
          title="Social media"
          emptyLabel="Disabled by default — see README for why LinkedIn/Handshake/Glassdoor aren't automated."
          sources={social}
        />
      </Card>

      <Card>
        <SectionHeading
          title="Career sites"
          description="Individual companies' own career pages, nested under big categories — each subcategory has its own on/off-all toggle."
        />
        {BIG_CATEGORY_ORDER.map((category) => (
          <BigCategorySection key={category} category={category} sourcesByGroup={sourcesByGroup} />
        ))}
      </Card>

      <Card>
        <SectionHeading title="Additional company" description="Add more company to your scanner here" />
        {customCompany.length > 0 && <CollapsibleGroup title="Custom sources" sources={customCompany} />}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !url.trim()) return;
            addCustomSource(name.trim(), url.trim());
            setName("");
            setUrl("");
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
              Company name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramp"
              className="h-10 w-48 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
              Career site URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 w-64 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
        <p className="mt-2 text-xs text-fg-subtle">
          Added as &ldquo;not yet supported&rdquo; until a matching adapter (Greenhouse/Workday/etc.) is confirmed
          and wired up for it.
        </p>
      </Card>
    </div>
  );
}
