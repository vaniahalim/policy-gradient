import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ItemSchema, InstrumentSchema } from "../lib/schema";

const CONTENT_DIR = resolve(__dirname, "../../content");
const checkLinks = process.argv.includes("--links");

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => join(e.parentPath, e.name));
}

const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${file.replace(CONTENT_DIR + "/", "")}: ${msg}`);

const instrumentSlugs = new Set<string>();
for (const file of jsonFiles(join(CONTENT_DIR, "instruments"))) {
  const parsed = InstrumentSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    fail(file, parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));
    continue;
  }
  if (instrumentSlugs.has(parsed.data.slug)) fail(file, `duplicate instrument slug ${parsed.data.slug}`);
  instrumentSlugs.add(parsed.data.slug);
}

const ids = new Set<string>();
const primaryUrls = new Map<string, string>();
const urlsToCheck = new Set<string>();
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

async function liveness(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15_000) });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    return e instanceof Error ? e.message : "request failed";
  }
}

async function main() {
  if (checkLinks) {
    for (const url of urlsToCheck) {
      const problem = await liveness(url);
      if (problem) errors.push(`link ${url}: ${problem}`);
    }
  }
  if (errors.length > 0) {
    console.error(`Validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`OK: ${instrumentSlugs.size} instruments, ${ids.size} items${checkLinks ? `, ${urlsToCheck.size} links live` : ""}`);
}

main();
