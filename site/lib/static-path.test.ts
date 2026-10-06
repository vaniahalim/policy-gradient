import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveStaticFile } from "./static-path";

const root = "/srv/out";

test("a folder URL maps to its index page", () => {
  assert.deepEqual(resolveStaticFile(root, "/"), ["/srv/out/index.html"]);
  assert.deepEqual(resolveStaticFile(root, "/files/"), ["/srv/out/files/index.html"]);
});

test("a file URL is tried as given, then as a folder or .html page", () => {
  assert.deepEqual(resolveStaticFile(root, "/digest/feed.xml"), ["/srv/out/digest/feed.xml", "/srv/out/digest/feed.xml/index.html", "/srv/out/digest/feed.xml.html"]);
});

test("ignores the query string and fragment", () => {
  assert.deepEqual(resolveStaticFile(root, "/files/?region=us#top"), ["/srv/out/files/index.html"]);
});

test("refuses paths that climb out of the folder", () => {
  assert.equal(resolveStaticFile(root, "/../etc/passwd"), null);
  assert.equal(resolveStaticFile(root, "/a/../../etc/passwd"), null);
  assert.equal(resolveStaticFile(root, "/%2e%2e/etc/passwd"), null);
  assert.equal(resolveStaticFile(root, "/%2E%2E%2fetc/passwd"), null);
});

test("refuses NUL bytes and malformed escapes", () => {
  assert.equal(resolveStaticFile(root, "/a%00b"), null);
  assert.equal(resolveStaticFile(root, "/%E0%A4%A"), null);
});

test("a path that wanders but stays inside is allowed", () => {
  assert.deepEqual(resolveStaticFile(root, "/ok/../files/"), ["/srv/out/files/index.html"]);
});

test("a sibling folder with the same prefix is not inside the root", () => {
  assert.equal(resolveStaticFile("/srv/out", "/../out-secret/x"), null);
});
