"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { Card, CardTitle, CardSubtitle, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ScanSource } from "@/lib/types";

function SourceRow({ source }: { source: ScanSource }) {
  const { toggleSource, removeSource } = useJobsStore();
  const isWorking = ["greenhouse", "workday", "eightfold", "custom-amazon"].includes(source.adapterType);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-fg">{source.name}</span>
          {isWorking ? (
            <Badge tone="new">adapter ready</Badge>
          ) : (
            <Badge tone="warn">not yet supported</Badge>
          )}
        </div>
        <p className="text-xs text-fg-subtle">{source.identifier}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={source.enabled}
          onClick={() => toggleSource(source.id)}
          disabled={!isWorking}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            source.enabled ? "bg-accent" : "bg-panel"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              source.enabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
        {!source.isDefault && (
          <button
            type="button"
            onClick={() => removeSource(source.id)}
            className="text-fg-subtle hover:text-loss"
            aria-label="Remove source"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
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

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Company career sites</CardTitle>
            <CardSubtitle>Greenhouse, Workday, and Amazon&apos;s own API are ready to scan today.</CardSubtitle>
          </div>
        </CardHeader>
        {company.map((s) => (
          <SourceRow key={s.id} source={s} />
        ))}
      </Card>

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
