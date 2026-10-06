"use client";

import type { Ref } from "react";
import Link from "next/link";
import { stageLabel, stageTone } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS } from "@/lib/schema";
import { InstrumentDetail, ItemDetail } from "./detail";
import { viewStage, type SheetView } from "./sheet-view";

type Props = {
  view: SheetView | null;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
};

export function DetailPanel({ view, onClose, closeRef }: Props) {
  const instrument = view && view.kind !== "item" ? view.instrument : null;
  const title = !view ? "" : view.kind === "item" ? view.item.title : view.instrument.name;

  return (
    <aside className={`panel${view ? " open" : ""}`} role="dialog" aria-modal="false" aria-labelledby="panel-title" aria-hidden={!view}>
      <button ref={closeRef} className="x" type="button" aria-label="Close details" onClick={onClose}>
        ×
      </button>
      {view && (
        <>
          <span className={`stamp ${stageTone(view.kind === "event" ? view.instrument.status : viewStage(view))}`}>
            {stageLabel(view.kind === "event" ? view.instrument.status : viewStage(view))}
          </span>
          {instrument && <span className="kindtag">{INSTRUMENT_KIND_LABELS[instrument.kind]}</span>}
          <h2 id="panel-title">{title}</h2>
          {view.kind === "item" ? (
            <ItemDetail item={view.item} />
          ) : (
            <InstrumentDetail instrument={view.instrument} highlight={view.kind === "event" ? view.eventIndex! : null} />
          )}
          <p className="pagelink">
            <Link href={view.kind === "item" ? `/items/${view.item.id}` : `/instruments/${view.instrument.slug}`}>Open the full page</Link>
          </p>
        </>
      )}
    </aside>
  );
}
