import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSiteUrl } from "./site-url";

test("uses SITE_URL when it is an absolute http(s) URL", () => {
  assert.deepEqual(resolveSiteUrl("https://policygradient.example"), { url: "https://policygradient.example", isDefault: false });
  assert.equal(resolveSiteUrl("http://localhost:4173").isDefault, false);
});

test("trims whitespace and a trailing slash", () => {
  assert.equal(resolveSiteUrl("  https://policygradient.example/ ").url, "https://policygradient.example");
});

test("falls back to localhost and says so when unset or blank", () => {
  assert.deepEqual(resolveSiteUrl(undefined), { url: "http://localhost:3000", isDefault: true });
  assert.deepEqual(resolveSiteUrl("   "), { url: "http://localhost:3000", isDefault: true });
});

test("rejects a value that is not an absolute http(s) URL, so RSS links never come out relative", () => {
  assert.throws(() => resolveSiteUrl("policygradient.example"), /SITE_URL/);
  assert.throws(() => resolveSiteUrl("/digest"), /SITE_URL/);
  assert.throws(() => resolveSiteUrl("ftp://example.org"), /SITE_URL/);
});
