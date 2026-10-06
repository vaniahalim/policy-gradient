import { test } from "node:test";
import assert from "node:assert/strict";
import { ItemSchema, InstrumentSchema } from "./schema";

const validItem = {
  id: "eu-2026-08-gpai-guidelines",
  title: "Commission publishes GPAI guidelines",
  jurisdiction: "europe",
  subregion: "EU",
  type: "guidance",
  stage: "in_force",
  topics: ["gpai"],
  summary: "The Commission published guidelines on obligations for general-purpose AI providers.",
  why_it_matters: "Clarifies what providers must do before the enforcement date.",
  sources: [
    {
      url: "https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers",
      publisher: "European Commission",
      tier: "primary",
      accessed_at: "2026-10-05T09:00:00Z",
    },
  ],
  event_date: "2026-07-18",
  confidence: "high",
  review: { verdict: "accept", reviewer_notes: "Matches source.", checks: ["claim", "date", "source"] },
  run_id: "2026-10-05-a",
};

test("accepts a valid item", () => {
  assert.equal(ItemSchema.safeParse(validItem).success, true);
});

test("rejects an item with no sources", () => {
  assert.equal(ItemSchema.safeParse({ ...validItem, sources: [] }).success, false);
});

test("rejects an unknown jurisdiction", () => {
  assert.equal(ItemSchema.safeParse({ ...validItem, jurisdiction: "mars" }).success, false);
});

test("rejects a non-http source url", () => {
  const bad = { ...validItem, sources: [{ ...validItem.sources[0], url: "javascript:alert(1)" }] };
  assert.equal(ItemSchema.safeParse(bad).success, false);
});

test("rejects a malformed date", () => {
  assert.equal(ItemSchema.safeParse({ ...validItem, event_date: "18/07/2026" }).success, false);
});

test("rejects publishing an item whose review verdict is not accept", () => {
  const rejected = { ...validItem, review: { ...validItem.review, verdict: "reject" } };
  assert.equal(ItemSchema.safeParse(rejected).success, false);
});

test("accepts a valid instrument and requires a timeline", () => {
  const instrument = {
    slug: "eu-ai-act",
    name: "EU Artificial Intelligence Act",
    jurisdiction: "europe",
    subregion: "EU",
    kind: "regulation",
    status: "in_force",
    summary: "Risk-based regulation of AI systems in the EU.",
    key_obligations: ["Prohibited practices", "GPAI transparency"],
    timeline: [{ date: "2024-08-01", stage: "in_force", note: "Entered into force.", source_url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" }],
    last_verified: "2026-10-05T09:00:00Z",
  };
  assert.equal(InstrumentSchema.safeParse(instrument).success, true);
  assert.equal(InstrumentSchema.safeParse({ ...instrument, timeline: [] }).success, false);
});

test("rejects a non-UTC or date-only accessed_at", () => {
  const dateOnly = { ...validItem, sources: [{ ...validItem.sources[0], accessed_at: "2026-10-05" }] };
  const offset = { ...validItem, sources: [{ ...validItem.sources[0], accessed_at: "2026-10-05T09:00:00+07:00" }] };
  assert.equal(ItemSchema.safeParse(dateOnly).success, false);
  assert.equal(ItemSchema.safeParse(offset).success, false);
});

test("accepts a Switzerland item under the europe jurisdiction", () => {
  assert.equal(ItemSchema.safeParse({ ...validItem, id: "ch-ai-consultation", jurisdiction: "europe", subregion: "Switzerland" }).success, true);
});

test("rejects the retired eu jurisdiction value", () => {
  assert.equal(ItemSchema.safeParse({ ...validItem, jurisdiction: "eu" }).success, false);
});

test("requires an instrument kind", () => {
  const instrument = {
    slug: "x", name: "X", jurisdiction: "us", subregion: "Federal", status: "in_force", summary: "S.",
    key_obligations: ["a"], timeline: [{ date: "2025-01-01", stage: "in_force", note: "n", source_url: "https://example.org/t" }],
    last_verified: "2026-10-05T09:00:00Z",
  };
  assert.equal(InstrumentSchema.safeParse(instrument).success, false);
  assert.equal(InstrumentSchema.safeParse({ ...instrument, kind: "executive_order" }).success, true);
});

test("rejects an unknown instrument kind", () => {
  const instrument = {
    slug: "x", name: "X", kind: "law-ish", jurisdiction: "us", subregion: "Federal", status: "in_force", summary: "S.",
    key_obligations: ["a"], timeline: [{ date: "2025-01-01", stage: "in_force", note: "n", source_url: "https://example.org/t" }],
    last_verified: "2026-10-05T09:00:00Z",
  };
  assert.equal(InstrumentSchema.safeParse(instrument).success, false);
});
