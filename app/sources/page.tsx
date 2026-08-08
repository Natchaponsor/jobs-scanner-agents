"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { Card, CardTitle, CardSubtitle, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { WORKING_ADAPTER_TYPES } from "@/lib/types";
import type { ScanSource, SourceGroup } from "@/lib/types";

const GROUP_ORDER: SourceGroup[] = ["Mag 7", "Financial Services", "AI", "Media and Entertainment", "E-Commerce", "Etc"];

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
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
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

function GroupSection({ group, sources }: { group: SourceGroup; sources: ScanSource[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const { setGroupEnabled } = useJobsStore();
  const working = sources.filter(isWorking);
  const onCount = working.filter((s) => s.enabled).length;
  const allOn = working.length > 0 && onCount === working.length;

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {collapsed ? <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" /> : <ChevronUp className="h-4 w-4 shrink-0 text-fg-subtle" />}
          <div className="min-w-0">
            <CardTitle>{group}</CardTitle>
            <CardSubtitle>
              {working.length > 0 ? `${onCount}/${working.length} on` : "No working adapters yet"}
            </CardSubtitle>
          </div>
        </button>
        <Toggle
          on={allOn}
          disabled={working.length === 0}
          onClick={() => setGroupEnabled(group, !allOn)}
          label={`${allOn ? "Disable" : "Enable"} all ${group} sources`}
        />
      </CardHeader>
      {!collapsed && sources.map((s) => <SourceRow key={s.id} source={s} />)}
    </Card>
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-fg">Scan sources</h1>
        <p className="text-sm text-fg-muted">
          Choose what the scanner looks at. Sources marked &ldquo;not yet supported&rdquo; are custom career
          sites that need a per-company scraper — toggling stays off until one is wired up. Company sites are
          grouped by industry below, each with its own on/off-all toggle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Social media</CardTitle>
            <CardSubtitle>Disabled by default — see README for why LinkedIn/Handshake/Glassdoor aren&apos;t automated.</CardSubtitle>
          </div>
        </CardHeader>
        {social.map((s) => (
          <SourceRow key={s.id} source={s} />
        ))}
      </Card>

      {GROUP_ORDER.map((group) => {
        const groupSources = defaultCompany.filter((s) => s.group === group);
        if (groupSources.length === 0) return null;
        return <GroupSection key={group} group={group} sources={groupSources} />;
      })}

      {customCompany.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom sources</CardTitle>
          </CardHeader>
          {customCompany.map((s) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a custom company</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !url.trim()) return;
            addCustomSource(name.trim(), url.trim());
            setName("");
            setUrl("");
          }}
          className="flex flex-wrap items-end gap-3"
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
