import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ItemSchema, InstrumentSchema } from "../lib/schema";
import { jsonFiles } from "../lib/content";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { blocksAutomatedFetches, curlArgs, curlStatus, isCertificateError } from "../lib/links";
import { brokenDigestLinks, loadDigests } from "../lib/digest";

const CONTENT_DIR = resolve(__dirname, "../../content");
const checkLinks = process.argv.includes("--links");

const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${file.replace(CONTENT_DIR + "/", "")}: ${msg}`);

const urlsToCheck = new Set<string>();
const skipped: string[] = [];
const instrumentSlugs = new Set<string>();
for (const file of jsonFiles(join(CONTENT_DIR, "instruments"))) {
  const parsed = InstrumentSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    fail(file, parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));
    continue;
  }
  if (instrumentSlugs.has(parsed.data.slug)) fail(file, `duplicate instrument slug ${parsed.data.slug}`);
  instrumentSlugs.add(parsed.data.slug);
  for (const entry of parsed.data.timeline) urlsToCheck.add(entry.source_url);
}

const ids = new Set<string>();
const primaryUrls = new Map<string, string>();
for (const file of jsonFiles(join(CONTENT_DIR, "items"))) {
  const parsed = ItemSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    fail(file, parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));
    continue;
  }
  const item = parsed.data;
  if (ids.has(item.id)) fail(file, `duplicate item id ${item.id}`);
  ids.add(item.id);
  if (item.instrument_slug && !instrumentSlugs.has(item.instrument_slug)) {
    fail(file, `unknown instrument_slug ${item.instrument_slug}`);
  }
  if (!item.sources.some((s) => s.tier === "primary") && item.confidence === "high") {
    fail(file, "confidence high requires at least one primary source");
  }
  for (const s of item.sources) {
    urlsToCheck.add(s.url);
    if (s.tier !== "primary") continue;
    const prior = primaryUrls.get(s.url);
    if (prior && prior !== item.id) fail(file, `primary source ${s.url} already used by ${prior} (possible duplicate)`);
    primaryUrls.set(s.url, item.id);
  }
}

// Digests link to instruments and items by URL. A link to something that no longer exists would ship as a dead page.
try {
  for (const digest of loadDigests(join(CONTENT_DIR, "digests"))) {
    for (const href of brokenDigestLinks(digest.blocks, { instruments: instrumentSlugs, items: ids })) {
      errors.push(`digests/${digest.slug}.md: link to ${href} points at nothing`);
    }
  }
} catch (e) {
  errors.push(`digests: ${e instanceof Error ? e.message : "could not be read"}`);
}

// Some legislature sites answer 406 to requests that lack ordinary browser headers.
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
};

async function liveness(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    // Node could not verify the certificate chain, but a browser or curl may be able to. Retry with curl,
    // which keeps certificate checking on, so a page that is up is not reported as dead.
    if (isCertificateError(e)) return viaCurl(url);
    return e instanceof Error ? e.message : "request failed";
  }
}

const run = promisify(execFile);

async function viaCurl(url: string): Promise<string | null> {
  try {
    const { stdout } = await run("curl", curlArgs(url), { timeout: 30_000 });
    return curlStatus(stdout);
  } catch (e) {
    return `certificate chain could not be verified, and the curl retry failed (${e instanceof Error ? e.message.split("\n")[0] : "error"})`;
  }
}

async function main() {
  if (checkLinks) {
    for (const url of urlsToCheck) {
      if (blocksAutomatedFetches(url)) {
        skipped.push(url);
        continue;
      }
      const problem = await liveness(url);
      if (problem) errors.push(`link ${url}: ${problem}`);
    }
  }
  if (errors.length > 0) {
    console.error(`Validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`OK: ${instrumentSlugs.size} instruments, ${ids.size} items${checkLinks ? `, ${urlsToCheck.size - skipped.length} links live${skipped.length ? `, ${skipped.length} skipped (host blocks automated fetches)` : ""}` : ""}`);
}

main();
