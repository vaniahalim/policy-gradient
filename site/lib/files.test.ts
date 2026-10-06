import { test } from "node:test";
import assert from "node:assert/strict";
import { toFileRows, filterRows, facets } from "./files";
import type { Instrument, Item } from "./schema";

const instrument = (slug: string, over: Partial<Instrument> = {}): Instrument => ({
  slug, name: `Name ${slug}`, kind: "statute", jurisdiction: "us", subregion: "Texas", status: "in_force", summary: `Summary ${slug}`,
  key_obligations: ["a"],
  timeline: [
    { date: "2025-01-01", stage: "passed", note: "n", source_url: "https://example.org/1" },
    { date: "2026-03-05", stage: "in_force", note: "n", source_url: "https://example.org/2" },
  ],
  last_verified: "2026-10-05T09:00:00Z", ...over,
});

const item = (id: string, over: Partial<Item> = {}): Item => ({
  id, title: `Title ${id}`, jurisdiction: "us", subregion: "California", type: "news", stage: "passed", topics: [], summary: `S ${id}`,
  why_it_matters: "w", sources: [{ url: "https://example.org/s", publisher: "P", tier: "primary", accessed_at: "2026-10-05T09:00:00Z" }],
  event_date: "2026-09-09", confidence: "high", review: { verdict: "accept", reviewer_notes: "ok", checks: ["x"] }, run_id: "r", ...over,
});

const rows = () =>
  toFileRows(
    [
      instrument("tx", { subregion: "Texas" }),
      instrument("eu", { jurisdiction: "europe", subregion: "EU", kind: "statute", status: "in_force" }),
      instrument("gpai", { jurisdiction: "europe", subregion: "EU", kind: "voluntary_code", status: "passed" }),
    ],
    [item("ca-news")],
  );

test("one row per instrument and item, linking to its own page", () => {
  const r = rows();
  assert.equal(r.length, 4);
  assert.equal(r.find((x) => x.id === "tx")!.href, "/instruments/tx");
  assert.equal(r.find((x) => x.id === "ca-news")!.href, "/items/ca-news");
});

test("an instrument's date is its latest timeline entry; an item's is its event date", () => {
  const r = rows();
  assert.equal(r.find((x) => x.id === "tx")!.date, "2026-03-05");
  assert.equal(r.find((x) => x.id === "ca-news")!.date, "2026-09-09");
});

test("newest first, ties broken by title", () => {
  const r = rows();
  assert.equal(r[0].id, "ca-news");
  assert.deepEqual(r.slice(1).map((x) => x.id), ["eu", "gpai", "tx"]);
});

test("news items show as the News type", () => {
  const r = rows().find((x) => x.id === "ca-news")!;
  assert.equal(r.type, "news");
  assert.equal(r.typeLabel, "News");
  assert.equal(rows().find((x) => x.id === "eu")!.typeLabel, "Statute");
});

test("filters combine, and 'all' leaves a field alone", () => {
  const r = rows();
  assert.equal(filterRows(r, { region: "all", type: "all", stage: "all" }).length, 4);
  assert.deepEqual(filterRows(r, { region: "europe", type: "all", stage: "all" }).map((x) => x.id).sort(), ["eu", "gpai"]);
  assert.deepEqual(filterRows(r, { region: "europe", type: "voluntary_code", stage: "all" }).map((x) => x.id), ["gpai"]);
  assert.deepEqual(filterRows(r, { region: "all", type: "all", stage: "passed" }).map((x) => x.id).sort(), ["ca-news", "gpai"]);
  assert.deepEqual(filterRows(r, { region: "asia", type: "all", stage: "all" }), []);
});

test("facets list only values that exist, in a fixed order", () => {
  const f = facets(rows());
  assert.deepEqual(f.regions, ["europe", "us"]);
  assert.deepEqual(f.types, ["statute", "voluntary_code", "news"]);
  assert.deepEqual(f.stages, ["passed", "in_force"]);
});
