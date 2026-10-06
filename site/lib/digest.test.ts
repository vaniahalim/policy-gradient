import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseInline, parseDigest, isoWeekStart, loadDigests } from "./digest";

test("splits text and links", () => {
  assert.deepEqual(parseInline("See [AI Act](/instruments/eu-ai-act) now."), [
    { type: "text", text: "See " },
    { type: "link", text: "AI Act", href: "/instruments/eu-ai-act" },
    { type: "text", text: " now." },
  ]);
});

test("allows site paths and https links only", () => {
  assert.deepEqual(parseInline("[ok](https://example.org/a)"), [{ type: "link", text: "ok", href: "https://example.org/a" }]);
  assert.deepEqual(parseInline("[bad](javascript:alert(1))"), [{ type: "text", text: "bad" }]);
  assert.deepEqual(parseInline("[bad](http://example.org)"), [{ type: "text", text: "bad" }]);
  assert.deepEqual(parseInline("[bad](//evil.example)"), [{ type: "text", text: "bad" }]);
});

test("text without links stays one text part", () => {
  assert.deepEqual(parseInline("Plain words."), [{ type: "text", text: "Plain words." }]);
});

const SAMPLE = `# Weekly digest, 2026 week 41

Runs one and two. Not legal advice.

## Europe

- EU: [AI Act](/instruments/eu-ai-act) is tracked.
- Switzerland: [Swiss approach](/instruments/ch-x).

## US

Items:

- California: [Bills](/items/ca) signed.
`;

test("parses headings, paragraphs and bullet lists in order", () => {
  const { title, blocks } = parseDigest(SAMPLE);
  assert.equal(title, "Weekly digest, 2026 week 41");
  assert.deepEqual(blocks.map((b) => b.type), ["p", "h2", "ul", "h2", "p", "ul"]);
  const ul = blocks[2];
  assert.equal(ul.type === "ul" && ul.items.length, 2);
  assert.deepEqual(blocks[1], { type: "h2", text: "Europe" });
});

test("a digest without a title is rejected", () => {
  assert.throws(() => parseDigest("## Only a section\n"), /title/i);
});

test("an ISO week starts on its Monday, in UTC", () => {
  assert.equal(isoWeekStart("2026-w41"), "2026-10-05");
  assert.equal(isoWeekStart("2026-w01"), "2025-12-29");
  assert.equal(isoWeekStart("2025-w01"), "2024-12-30");
  assert.throws(() => isoWeekStart("latest"), /week/i);
});

test("loads digests newest first and ignores other files", () => {
  const dir = mkdtempSync(join(tmpdir(), "digests-"));
  writeFileSync(join(dir, "2026-w40.md"), "# Older\n\nFirst paragraph.\n");
  writeFileSync(join(dir, "2026-w41.md"), SAMPLE);
  writeFileSync(join(dir, "notes.txt"), "ignore me");
  const all = loadDigests(dir);
  assert.deepEqual(all.map((d) => d.slug), ["2026-w41", "2026-w40"]);
  assert.equal(all[0].date, "2026-10-05");
  assert.equal(all[0].summary, "Runs one and two. Not legal advice.");
});

test("a missing digest folder gives an empty list", () => {
  assert.deepEqual(loadDigests(join(tmpdir(), "does-not-exist-xyz")), []);
});

import { brokenDigestLinks } from "./digest";

const known = { instruments: new Set(["eu-ai-act"]), items: new Set(["ca-news"]) };

test("finds digest links to instruments and items that do not exist", () => {
  const { blocks } = parseDigest(
    "# T\n\n- [ok](/instruments/eu-ai-act) and [gone](/instruments/jp-ai-promotion-act)\n- [news](/items/ca-news) and [missing](/items/nope)\n",
  );
  assert.deepEqual(brokenDigestLinks(blocks, known), ["/instruments/jp-ai-promotion-act", "/items/nope"]);
});

test("section pages and external links are not flagged", () => {
  const { blocks } = parseDigest("# T\n\n[a](/files) [b](/methodology) [c](/digest) [d](https://example.org/x)\n");
  assert.deepEqual(brokenDigestLinks(blocks, known), []);
});

test("an unknown site path is flagged", () => {
  const { blocks } = parseDigest("# T\n\n[x](/somewhere/else)\n");
  assert.deepEqual(brokenDigestLinks(blocks, known), ["/somewhere/else"]);
});
