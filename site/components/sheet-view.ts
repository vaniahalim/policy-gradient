import { layoutSheets, type LayoutSheet } from "@/lib/globe";
import type { Instrument, Item } from "@/lib/schema";
import { formatDate } from "@/lib/labels";

export type TimelineEntry = Instrument["timeline"][number];

type Placement = Omit<LayoutSheet, "kind">;

/** A sheet on the globe together with the content it stands for. */
export type SheetView =
  | (Placement & { kind: "instrument"; instrument: Instrument })
  | (Placement & { kind: "item"; item: Item })
  | (Placement & { kind: "event"; instrument: Instrument; entry: TimelineEntry });

export function buildSheetViews(instruments: Instrument[], items: Item[]): SheetView[] {
  const bySlug = new Map(instruments.map((i) => [i.slug, i]));
  const byId = new Map(items.map((i) => [i.id, i]));
  return layoutSheets({ instruments, items }, { events: true }).map((s): SheetView => {
    if (s.kind === "instrument") return { ...s, kind: "instrument", instrument: bySlug.get(s.id)! };
    if (s.kind === "item") return { ...s, kind: "item", item: byId.get(s.id)! };
    const instrument = bySlug.get(s.parentId!)!;
    return { ...s, kind: "event", instrument, entry: instrument.timeline[s.eventIndex!] };
  });
}

/** Sheet size in design pixels at scale 1 (width, height). */
export const SHEET_SIZE = { instrument: [112, 152], item: [112, 152], event: [78, 100] } as const;
export const BLURB_LINES = { instrument: 5, item: 5, event: 4 } as const;

export const viewTitle = (v: SheetView): string =>
  v.kind === "instrument" ? v.instrument.name : v.kind === "item" ? v.item.title : `${formatDate(v.entry.date)}, ${v.instrument.name}`;

export const viewSubregion = (v: SheetView): string =>
  v.kind === "item" ? v.item.subregion : v.instrument.subregion;

export const viewStage = (v: SheetView) =>
  v.kind === "instrument" ? v.instrument.status : v.kind === "item" ? v.item.stage : v.entry.stage;
