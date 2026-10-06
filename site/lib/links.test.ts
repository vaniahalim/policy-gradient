import { test } from "node:test";
import assert from "node:assert/strict";
import { blocksAutomatedFetches } from "./links";

test("flags hosts known to return 403 to automated fetches", () => {
  assert.equal(blocksAutomatedFetches("https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53"), true);
});

test("does not flag ordinary hosts", () => {
  assert.equal(blocksAutomatedFetches("https://eur-lex.europa.eu/eli/reg/2024/1689/oj"), false);
});

test("does not match lookalike hosts", () => {
  assert.equal(blocksAutomatedFetches("https://leginfo.legislature.ca.gov.evil.example/x"), false);
});

test("returns false for an unparseable url instead of throwing", () => {
  assert.equal(blocksAutomatedFetches("not a url"), false);
});

test("flags the NY Senate site, which sits behind a Cloudflare bot challenge", () => {
  assert.equal(blocksAutomatedFetches("https://www.nysenate.gov/legislation/bills/2025/S6953"), true);
});
