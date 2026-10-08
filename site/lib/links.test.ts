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

import { isCertificateError, curlArgs, curlStatus } from "./links";

const tlsError = (code: string) => Object.assign(new Error("fetch failed"), { cause: { code } });

test("recognises certificate-chain failures", () => {
  for (const code of ["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT"]) {
    assert.equal(isCertificateError(tlsError(code)), true, code);
  }
});

test("does not treat other failures as certificate problems", () => {
  assert.equal(isCertificateError(tlsError("ECONNREFUSED")), false);
  assert.equal(isCertificateError(tlsError("ENOTFOUND")), false);
  assert.equal(isCertificateError(new Error("fetch failed")), false);
  assert.equal(isCertificateError("nope"), false);
  assert.equal(isCertificateError(null), false);
});

test("curl is called without a shell and with certificate checking on", () => {
  const args = curlArgs("https://example.org/a?b=1&c=2");
  assert.ok(!args.includes("-k") && !args.includes("--insecure"));
  assert.equal(args.at(-1), "https://example.org/a?b=1&c=2");
  assert.equal(args.at(-2), "--"); // everything after is a URL, never an option
  assert.ok(args.includes("-L") && args.includes("--max-time"));
});

test("curl refuses anything that is not an http(s) URL", () => {
  assert.throws(() => curlArgs("file:///etc/passwd"), /http/i);
  assert.throws(() => curlArgs("--output=/tmp/x"), /http/i);
  assert.throws(() => curlArgs("javascript:alert(1)"), /http/i);
});

test("reads curl's printed status code", () => {
  assert.equal(curlStatus("200"), null);
  assert.equal(curlStatus("301"), "HTTP 301");
  assert.equal(curlStatus("404"), "HTTP 404");
  assert.equal(curlStatus("000"), "no response");
  assert.equal(curlStatus("garbage"), "no response");
});
