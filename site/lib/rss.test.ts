import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRss, rfc822, escapeXml } from "./rss";

test("escapes the characters XML reserves", () => {
  assert.equal(escapeXml(`A & B <c> "d" 'e'`), "A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;");
});

test("formats a date the way RSS wants it, in GMT", () => {
  assert.equal(rfc822("2026-10-05"), "Mon, 05 Oct 2026 00:00:00 GMT");
  assert.equal(rfc822("2024-12-30"), "Mon, 30 Dec 2024 00:00:00 GMT");
});

const feed = (siteUrl = "https://example.org/") =>
  buildRss({
    siteUrl,
    title: "Policy Gradient & friends",
    description: "Weekly <digest>",
    path: "/digest/feed.xml",
    entries: [
      { title: "Week 41", path: "/digest/2026-w41", date: "2026-10-05", description: "Runs & items" },
      { title: "Week 40", path: "/digest/2026-w40", date: "2026-09-28", description: "Older" },
    ],
  });

test("builds absolute links whatever the trailing slash on the site URL", () => {
  assert.match(feed("https://example.org/"), /<link>https:\/\/example\.org\/digest\/2026-w41<\/link>/);
  assert.match(feed("https://example.org"), /<link>https:\/\/example\.org\/digest\/2026-w41<\/link>/);
});

test("escapes channel and item text", () => {
  const xml = feed();
  assert.match(xml, /<title>Policy Gradient &amp; friends<\/title>/);
  assert.match(xml, /<description>Weekly &lt;digest&gt;<\/description>/);
  assert.match(xml, /<description>Runs &amp; items<\/description>/);
});

test("lists entries in the order given, with a permalink guid and a pubDate", () => {
  const xml = feed();
  assert.ok(xml.indexOf("Week 41") < xml.indexOf("Week 40"));
  assert.match(xml, /<guid isPermaLink="true">https:\/\/example\.org\/digest\/2026-w41<\/guid>/);
  assert.match(xml, /<pubDate>Mon, 05 Oct 2026 00:00:00 GMT<\/pubDate>/);
});

test("points back at itself and is declared as UTF-8 RSS 2.0", () => {
  const xml = feed();
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.match(xml, /<rss version="2\.0"/);
  assert.match(xml, /<atom:link href="https:\/\/example\.org\/digest\/feed\.xml" rel="self" type="application\/rss\+xml"\/>/);
});

test("a feed with no entries is still valid", () => {
  const xml = buildRss({ siteUrl: "https://example.org", title: "T", description: "D", path: "/feed.xml", entries: [] });
  assert.ok(!xml.includes("<item>"));
  assert.ok(!xml.includes("<lastBuildDate>"));
});
