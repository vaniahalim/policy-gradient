import type { STAGES } from "./schema";

type Stage = (typeof STAGES)[number];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2025-07-10" or "2026-10-05T12:00:00Z" -> "10 Jul 2025". Built from the string, not from Intl or Date, so the
 * server render and the browser always agree and a calendar date never shifts with the reader's timezone.
 */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) throw new Error(`Not a date: ${value}`);
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

const STAGE_LABELS: Record<Stage, string> = {
  proposed: "Proposed",
  consultation: "Consultation",
  passed: "Passed",
  in_force: "In force",
  amended: "Amended",
  repealed: "Repealed",
  withdrawn: "Withdrawn",
};

export const stageLabel = (stage: Stage): string => STAGE_LABELS[stage];

export type Tone = "oxblood" | "pen" | "brass" | "grey";

const STAGE_TONES: Record<Stage, Tone> = {
  in_force: "oxblood",
  proposed: "pen",
  consultation: "pen",
  passed: "brass",
  amended: "brass",
  repealed: "grey",
  withdrawn: "grey",
};

/** Stamp colour. The label always carries the meaning too, so colour is never the only signal. */
export const stageTone = (stage: Stage): Tone => STAGE_TONES[stage];
