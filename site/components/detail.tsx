import "./detail.css";
import { formatDate, stageLabel } from "@/lib/labels";
import type { Instrument, Item } from "@/lib/schema";

/** The body of an instrument's details. Used by the globe panel and by the instrument page. */
export function InstrumentDetail({ instrument, highlight = null }: { instrument: Instrument; highlight?: number | null }) {
  return (
    <div className="detail">
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
    </div>
  );
}

/** The body of a news item's details. */
export function ItemDetail({ item }: { item: Item }) {
  return (
    <div className="detail">
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
    </div>
  );
}
