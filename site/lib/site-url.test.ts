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

// The host can report its own production address (Vercel: VERCEL_PROJECT_PRODUCTION_URL, a bare hostname).
test("uses the host's address when SITE_URL is unset, adding https://", () => {
  assert.deepEqual(resolveSiteUrl(undefined, "policy-gradient.vercel.app"), { url: "https://policy-gradient.vercel.app", isDefault: false });
  assert.equal(resolveSiteUrl("  ", "policy-gradient.vercel.app").url, "https://policy-gradient.vercel.app");
});

test("SITE_URL wins over the host's address", () => {
  assert.equal(resolveSiteUrl("https://policygradient.example", "policy-gradient.vercel.app").url, "https://policygradient.example");
});

test("does not double the scheme or keep a trailing slash on the host's address", () => {
  assert.equal(resolveSiteUrl(undefined, "https://policy-gradient.vercel.app/").url, "https://policy-gradient.vercel.app");
});

test("a blank host address falls back to localhost and says so", () => {
  assert.deepEqual(resolveSiteUrl(undefined, ""), { url: "http://localhost:3000", isDefault: true });
  assert.deepEqual(resolveSiteUrl(undefined, "   "), { url: "http://localhost:3000", isDefault: true });
});

test("a malformed host address fails the build the same way SITE_URL does", () => {
  assert.throws(() => resolveSiteUrl(undefined, "not a host"), /SITE_URL|host/i);
});
