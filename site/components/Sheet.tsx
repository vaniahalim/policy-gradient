"use client";

import { memo, type CSSProperties, type KeyboardEvent } from "react";
import { sheetLook } from "@/lib/globe";
import { formatDate, stageLabel, stageTone } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS } from "@/lib/schema";
import { BLURB_LINES, SHEET_SIZE, viewStage, viewSubregion, viewTitle, type SheetView } from "./sheet-view";

type Props = {
  view: SheetView;
  dim: boolean;
  selected: boolean;
  register: (id: string, el: HTMLElement | null) => void;
  onOpen: (view: SheetView, opener: HTMLElement) => void;
};

function SheetImpl({ view, dim, selected, register, onOpen }: Props) {
  const look = sheetLook(view.id);
  const [w, h] = SHEET_SIZE[view.kind];
  const stage = viewStage(view);
  const kindLabel = view.kind === "instrument" ? INSTRUMENT_KIND_LABELS[view.instrument.kind] : null;

  const title = view.kind === "event" ? formatDate(view.entry.date) : viewTitle(view);
  const blurb = view.kind === "instrument" ? view.instrument.summary : view.kind === "item" ? view.item.summary : view.entry.note;

  const style = {
    "--w": `calc(var(--u) * ${w}px)`,
    "--h": `calc(var(--u) * ${h}px)`,
    "--lon": view.lon.toFixed(2),
    "--lat": view.lat.toFixed(2),
    "--tz": look.tz.toFixed(1),
    "--tx": look.tx.toFixed(1),
    "--ty": look.ty.toFixed(1),
    "--lines": BLURB_LINES[view.kind],
  } as CSSProperties;

  const label = `${viewTitle(view)}. ${kindLabel ? `${kindLabel}. ` : ""}${stageLabel(stage)}. Opens details.`;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(view, e.currentTarget);
    }
  };

  return (
    <div
      ref={(el) => register(view.id, el)}
      className={`sheet sheet--${view.kind}${selected ? " sel" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-sheet={view.id}
      data-paper={look.paper}
      data-dim={dim ? "" : undefined}
      style={style}
      onClick={(e) => onOpen(view, e.currentTarget)}
      onKeyDown={onKeyDown}
    >
      <div className="face front">
        <div className="head">
          <span className="tab">File {view.file}</span>
          <span className={`stamp ${stageTone(stage)}`}>{stageLabel(stage)}</span>
        </div>
        <h3 className="title">{title}</h3>
        <p className="blurb">{blurb}</p>
        <div className="foot">
          <b>{view.kind === "event" ? view.instrument.subregion : viewSubregion(view)}</b>
          {kindLabel && <span className="kindline">{kindLabel}</span>}
        </div>
        <div className="shade" />
      </div>
      <div className="face back" />
    </div>
  );
}

export const Sheet = memo(SheetImpl);
