"use client";

import type { Ref } from "react";
import { formatDate, stageLabel, stageTone } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS, type Instrument, type Item } from "@/lib/schema";
import { viewStage, type SheetView } from "./sheet-view";

type Props = {
  view: SheetView | null;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
};

function InstrumentBody({ instrument, highlight }: { instrument: Instrument; highlight: number | null }) {
  return (
    <>
      <p className="meta">
        {instrument.subregion}. Last verified {formatDate(instrument.last_verified)}.
      </p>
      <p className="sum">{instrument.summary}</p>
      <h3>What it requires</h3>
      <ul>
        {instrument.key_obligations.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <h3>Timeline</h3>
      <ol className="tl">
        {instrument.timeline.map((t, i) => (
          <li key={`${t.date}-${i}`} className={highlight === i ? "hit" : undefined}>
            <time dateTime={t.date}>
              {formatDate(t.date)}. {stageLabel(t.stage)}
            </time>
            {t.note}{" "}
            <a href={t.source_url} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}

function ItemBody({ item }: { item: Item }) {
  return (
    <>
      <p className="meta">
        {item.subregion}. {formatDate(item.event_date)}. {item.confidence} confidence.
      </p>
      <p className="sum">{item.summary}</p>
      <h3>Why it matters</h3>
      <p className="sum">{item.why_it_matters}</p>
      <h3>Sources</h3>
      <ul>
        {item.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.publisher}
            </a>{" "}
            ({s.tier})
          </li>
        ))}
      </ul>
    </>
  );
}

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
            <ItemBody item={view.item} />
          ) : (
            <InstrumentBody instrument={view.instrument} highlight={view.kind === "event" ? view.eventIndex! : null} />
          )}
        </>
      )}
    </aside>
  );
}
