import "./page.css";
import { stageLabel, stageTone } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS, type Instrument, type STAGES } from "@/lib/schema";

/** The status stamp: where something is in its life. The words carry the meaning, so colour is never the only signal. */
export function Stamp({ stage }: { stage: (typeof STAGES)[number] }) {
  return <span className={`pg-stamp ${stageTone(stage)}`}>{stageLabel(stage)}</span>;
}

export function KindTag({ kind }: { kind: Instrument["kind"] }) {
  return <span className="pg-kind">{INSTRUMENT_KIND_LABELS[kind]}</span>;
}
