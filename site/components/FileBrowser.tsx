"use client";

import "./page.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { facets, filterRows, type FileRow, type Filters } from "@/lib/files";
import { formatDate, stageLabel } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS } from "@/lib/schema";
import { Stamp } from "./Stamp";

const REGION_LABELS = { europe: "Europe", us: "US", asia: "Asia" } as const;
const ALL: Filters = { region: "all", type: "all", stage: "all" };

type GroupProps<T extends string> = { label: string; value: T | "all"; options: { value: T; label: string }[]; onChange: (v: T | "all") => void };

function Group<T extends string>({ label, value, options, onChange }: GroupProps<T>) {
  const id = `fb-${label.toLowerCase()}`;
  return (
    <div className="fb-group" role="group" aria-labelledby={id}>
      <span className="fb-label" id={id}>
        {label}
      </span>
      {[{ value: "all" as const, label: "All" }, ...options].map((o) => (
        <button key={o.value} type="button" className="fb-pill" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The archive: every instrument and news item, filterable by region, type and status. */
export function FileBrowser({ rows }: { rows: FileRow[] }) {
  const [filters, setFilters] = useState<Filters>(ALL);
  const options = useMemo(() => facets(rows), [rows]);
  const shown = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const typeLabel = (t: string) => (t === "news" ? "News" : INSTRUMENT_KIND_LABELS[t as keyof typeof INSTRUMENT_KIND_LABELS]);

  return (
    <div>
      <div className="fb-filters">
        <Group label="Region" value={filters.region} options={options.regions.map((r) => ({ value: r, label: REGION_LABELS[r] }))} onChange={(region) => setFilters({ ...filters, region })} />
        <Group label="Type" value={filters.type} options={options.types.map((t) => ({ value: t, label: typeLabel(t) }))} onChange={(type) => setFilters({ ...filters, type })} />
        <Group label="Status" value={filters.stage} options={options.stages.map((s) => ({ value: s, label: stageLabel(s) }))} onChange={(stage) => setFilters({ ...filters, stage })} />
      </div>

      <p className="fb-count" aria-live="polite">
        Showing {shown.length} of {rows.length} files, newest first.
      </p>

      {shown.length === 0 ? (
        <div className="fb-empty">
          <p>No files match these filters.</p>
          <button type="button" className="fb-clear" onClick={() => setFilters(ALL)}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="fb-list">
          {shown.map((r) => (
            <li key={r.href} className="fb-row">
              <Link href={r.href}>
                <div>
                  <h2 className="fb-title">{r.title}</h2>
                  <p className="fb-meta">
                    {r.subregion}. {r.typeLabel}. {formatDate(r.date)}.
                  </p>
                  <p className="fb-sum">{r.summary}</p>
                </div>
                <div className="fb-side">
                  <Stamp stage={r.stage} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
