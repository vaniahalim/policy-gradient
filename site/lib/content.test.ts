import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadContent, itemsForInstrument, instrumentsForJurisdiction } from "./content";

const item = (id: string, event_date: string, extra: object = {}) => ({
  id,
  title: `Title ${id}`,
  jurisdiction: "europe",
  subregion: "EU",
  type: "guidance",
  stage: "in_force",
  topics: ["gpai"],
  summary: "Summary.",
  why_it_matters: "Matters.",
  sources: [{ url: "https://example.org/a", publisher: "Example", tier: "primary", accessed_at: "2026-10-05T09:00:00Z" }],
  event_date,
  confidence: "high",
  review: { verdict: "accept", reviewer_notes: "ok", checks: ["claim_matches_source"] },
  run_id: "r1",
  ...extra,
});

const instrument = (slug: string, jurisdiction: string) => ({
  slug,
  name: `Name ${slug}`,
  jurisdiction,
  subregion: "X",
  status: "in_force",
  summary: "S.",
  key_obligations: ["a"],
  timeline: [{ date: "2024-01-01", stage: "in_force", note: "n", source_url: "https://example.org/t" }],
  last_verified: "2026-10-05T09:00:00Z",
});

function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "content-"));
  mkdirSync(join(dir, "items", "2026-09"), { recursive: true });
  mkdirSync(join(dir, "items", "2026-10"), { recursive: true });
  mkdirSync(join(dir, "instruments"), { recursive: true });
  mkdirSync(join(dir, "runs", "r1"), { recursive: true });
  writeFileSync(join(dir, "items", "2026-09", "old.json"), JSON.stringify(item("old", "2026-09-01")));
  writeFileSync(join(dir, "items", "2026-10", "new.json"), JSON.stringify(item("new", "2026-10-02", { instrument_slug: "eu-act" })));
  writeFileSync(join(dir, "instruments", "eu-act.json"), JSON.stringify(instrument("eu-act", "europe")));
  writeFileSync(join(dir, "instruments", "us-act.json"), JSON.stringify(instrument("us-act", "us")));
  // run files must never be loaded as content
  writeFileSync(join(dir, "runs", "r1", "europe.json"), JSON.stringify({ not: "an item" }));
  return dir;
}

test("loads items newest first and ignores runs/", () => {
  const { items } = loadContent(fixture());
  assert.deepEqual(items.map((i) => i.id), ["new", "old"]);
});

test("loads instruments", () => {
  const { instruments } = loadContent(fixture());
  assert.deepEqual(instruments.map((i) => i.slug).sort(), ["eu-act", "us-act"]);
});

test("throws with the file name when content is invalid", () => {
  const dir = fixture();
  writeFileSync(join(dir, "items", "2026-10", "bad.json"), JSON.stringify({ id: "bad" }));
  assert.throws(() => loadContent(dir), /bad\.json/);
});

test("returns empty lists when the content directories are missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "empty-"));
  assert.deepEqual(loadContent(dir), { items: [], instruments: [] });
});

test("itemsForInstrument filters by slug", () => {
  const { items } = loadContent(fixture());
  assert.deepEqual(itemsForInstrument(items, "eu-act").map((i) => i.id), ["new"]);
  assert.deepEqual(itemsForInstrument(items, "nope"), []);
});

test("instrumentsForJurisdiction filters by jurisdiction", () => {
  const { instruments } = loadContent(fixture());
  assert.deepEqual(instrumentsForJurisdiction(instruments, "us").map((i) => i.slug), ["us-act"]);
});
