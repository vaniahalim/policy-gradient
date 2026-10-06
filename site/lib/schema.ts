import { z } from "zod";

export const JURISDICTIONS = ["europe", "us", "asia"] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];
export const ITEM_TYPES = ["law", "regulation", "guidance", "enforcement", "court", "consultation", "news"] as const;
export const STAGES = ["proposed", "consultation", "passed", "in_force", "amended", "repealed", "withdrawn"] as const;
export const CONFIDENCE = ["high", "medium", "low"] as const;

// What an instrument is, as opposed to how far along it is (STAGES). A reader needs both:
// a proposed statute and an in-force voluntary code are very different things.
export const INSTRUMENT_KINDS = ["statute", "regulation", "executive_order", "guidance", "voluntary_code", "policy_framework"] as const;
export const INSTRUMENT_KIND_LABELS: Record<(typeof INSTRUMENT_KINDS)[number], string> = {
  statute: "Statute",
  regulation: "Regulation",
  executive_order: "Executive order",
  guidance: "Guidance",
  voluntary_code: "Voluntary code",
  policy_framework: "Policy framework",
};

const httpUrl = z.url({ protocol: /^https?$/ });
// Calendar date of a legal event (YYYY-MM-DD). Not a timestamp.
const calendarDate = z.iso.date();
// Machine-generated timestamps are ISO 8601 UTC with a Z suffix.
const utcTimestamp = z.iso.datetime();

export const SourceSchema = z.object({
  url: httpUrl,
  publisher: z.string().min(1),
  tier: z.enum(["primary", "secondary"]),
  accessed_at: utcTimestamp,
});

// Only items a reviewer accepted can live in content/items. Rejected or
// revise-pending candidates stay under content/runs/.
export const ReviewSchema = z.object({
  verdict: z.literal("accept"),
  reviewer_notes: z.string(),
  checks: z.array(z.string()).min(1),
});

export const ItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  jurisdiction: z.enum(JURISDICTIONS),
  subregion: z.string().min(1),
  instrument_slug: z.string().optional(),
  type: z.enum(ITEM_TYPES),
  stage: z.enum(STAGES),
  topics: z.array(z.string().min(1)),
  summary: z.string().min(1),
  why_it_matters: z.string().min(1),
  sources: z.array(SourceSchema).min(1),
  event_date: calendarDate,
  confidence: z.enum(CONFIDENCE),
  review: ReviewSchema,
  run_id: z.string().min(1),
});

export const TimelineEntrySchema = z.object({
  date: calendarDate,
  stage: z.enum(STAGES),
  note: z.string().min(1),
  source_url: httpUrl,
});

export const InstrumentSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  kind: z.enum(INSTRUMENT_KINDS),
  jurisdiction: z.enum(JURISDICTIONS),
  subregion: z.string().min(1),
  status: z.enum(STAGES),
  summary: z.string().min(1),
  key_obligations: z.array(z.string().min(1)),
  timeline: z.array(TimelineEntrySchema).min(1),
  last_verified: utcTimestamp,
});

export type Item = z.infer<typeof ItemSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
