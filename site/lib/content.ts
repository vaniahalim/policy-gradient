import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { ItemSchema, InstrumentSchema, type Item, type Instrument } from "./schema";

// `next build` and the scripts both run with cwd = site/, and content/ is a sibling.
const DEFAULT_CONTENT_DIR = resolve(process.cwd(), "../content");

export function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => join(e.parentPath, e.name));
}

function readAll<T>(dir: string, parse: (raw: unknown) => { success: true; data: T } | { success: false; error: { message: string } }): T[] {
  return jsonFiles(dir).map((file) => {
    const result = parse(JSON.parse(readFileSync(file, "utf8")));
    if (!result.success) throw new Error(`Invalid content in ${relative(dir, file)}: ${result.error.message}`);
    return result.data;
  });
}

// Only items/ and instruments/ are published. runs/ holds raw agent output and is never loaded.
export function loadContent(contentDir: string = DEFAULT_CONTENT_DIR): { items: Item[]; instruments: Instrument[] } {
  const items = readAll(join(contentDir, "items"), (raw) => ItemSchema.safeParse(raw));
  const instruments = readAll(join(contentDir, "instruments"), (raw) => InstrumentSchema.safeParse(raw));
  items.sort((a, b) => b.event_date.localeCompare(a.event_date) || a.id.localeCompare(b.id));
  instruments.sort((a, b) => a.name.localeCompare(b.name));
  return { items, instruments };
}

export const itemsForInstrument = (items: Item[], slug: string): Item[] =>
  items.filter((i) => i.instrument_slug === slug);
