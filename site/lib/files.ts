import { INSTRUMENT_KINDS, INSTRUMENT_KIND_LABELS, STAGES, type Instrument, type Item, type Jurisdiction } from "./schema";
import { REGION_ORDER } from "./globe";

type Stage = (typeof STAGES)[number];
export type TypeKey = Instrument["kind"] | "news";

/** One line in the Files archive: an instrument or a news item, flattened for listing and filtering. */
export type FileRow = {
  id: string;
  href: string;
  title: string;
  region: Jurisdiction;
  subregion: string;
  type: TypeKey;
  typeLabel: string;
  stage: Stage;
  /** instruments: their latest timeline entry; items: the event date */
  date: string;
  summary: string;
};

export type Filters = { region: Jurisdiction | "all"; type: TypeKey | "all"; stage: Stage | "all" };

const TYPE_ORDER: TypeKey[] = [...INSTRUMENT_KINDS, "news"];

export function toFileRows(instruments: Instrument[], items: Item[]): FileRow[] {
  const fromInstruments = instruments.map((i): FileRow => ({
    id: i.slug,
    href: `/instruments/${i.slug}`,
    title: i.name,
    region: i.jurisdiction,
    subregion: i.subregion,
    type: i.kind,
    typeLabel: INSTRUMENT_KIND_LABELS[i.kind],
    stage: i.status,
    date: i.timeline.map((t) => t.date).sort().at(-1)!,
    summary: i.summary,
  }));
  const fromItems = items.map((i): FileRow => ({
    id: i.id,
    href: `/items/${i.id}`,
    title: i.title,
    region: i.jurisdiction,
    subregion: i.subregion,
    type: "news",
    typeLabel: "News",
    stage: i.stage,
    date: i.event_date,
    summary: i.summary,
  }));
  return [...fromInstruments, ...fromItems].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function filterRows(rows: FileRow[], f: Filters): FileRow[] {
  return rows.filter(
    (r) => (f.region === "all" || r.region === f.region) && (f.type === "all" || r.type === f.type) && (f.stage === "all" || r.stage === f.stage),
  );
}

/** The filter choices that actually exist in the data, in a fixed order (so empty options never show). */
export function facets(rows: FileRow[]): { regions: Jurisdiction[]; types: TypeKey[]; stages: Stage[] } {
  return {
    regions: REGION_ORDER.filter((r) => rows.some((x) => x.region === r)),
    types: TYPE_ORDER.filter((t) => rows.some((x) => x.type === t)),
    stages: STAGES.filter((s) => rows.some((x) => x.stage === s)),
  };
}
