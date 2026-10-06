import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_DIGEST_DIR = resolve(process.cwd(), "../content/digests");

export type Inline = { type: "text"; text: string } | { type: "link"; text: string; href: string };
export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; inline: Inline[] }
  | { type: "ul"; items: Inline[][] };

// [text](target), where the target may contain one level of parentheses.
const LINK = /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

// Digests are written by our own pipeline, but links are still limited to site paths and https.
const isSafeHref = (href: string) => /^\/(?!\/)/.test(href) || /^https:\/\//.test(href);

export function parseInline(source: string): Inline[] {
  const parts: Inline[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = parts.at(-1);
    if (last?.type === "text") last.text += text;
    else parts.push({ type: "text", text });
  };
  let cursor = 0;
  for (const m of source.matchAll(LINK)) {
    pushText(source.slice(cursor, m.index));
    if (isSafeHref(m[2])) parts.push({ type: "link", text: m[1], href: m[2] });
    else pushText(m[1]);
    cursor = m.index + m[0].length;
  }
  pushText(source.slice(cursor));
  return parts;
}

/** Reads the small markdown subset digests use: one title, section headings, paragraphs and bullet lists. */
export function parseDigest(markdown: string): { title: string; blocks: Block[] } {
  let title: string | null = null;
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Inline[][] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", inline: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "ul", items: list });
    list = null;
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      title ??= line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      (list ??= []).push(parseInline(line.slice(2).trim()));
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  if (title === null) throw new Error("A digest needs a title (a line starting with '# ').");
  return { title, blocks };
}

/** The Monday (UTC) that starts an ISO week, from a slug like "2026-w41". Returns YYYY-MM-DD. */
export function isoWeekStart(slug: string): string {
  const m = /^(\d{4})-w(\d{2})$/i.exec(slug);
  if (!m) throw new Error(`Not a week slug like 2026-w41: ${slug}`);
  const jan4 = new Date(Date.UTC(Number(m[1]), 0, 4));
  const mondayOfWeek1 = jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86_400_000;
  return new Date(mondayOfWeek1 + (Number(m[2]) - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
}

export type Digest = { slug: string; title: string; date: string; summary: string; blocks: Block[] };

const plain = (parts: Inline[]) => parts.map((p) => p.text).join("");

export function loadDigests(dir: string = DEFAULT_DIGEST_DIR): Digest[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}-w\d{2}\.md$/i.test(f))
    .map((f): Digest => {
      const slug = f.replace(/\.md$/i, "");
      const { title, blocks } = parseDigest(readFileSync(join(dir, f), "utf8"));
      const first = blocks.find((b) => b.type === "p");
      return { slug, title, date: isoWeekStart(slug), summary: first?.type === "p" ? plain(first.inline) : "", blocks };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

const SECTION_PATHS = new Set(["/", "/files", "/methodology", "/digest"]);

/** Internal links in a digest that point at a page that will not exist. Run at validation time. */
export function brokenDigestLinks(blocks: Block[], known: { instruments: Set<string>; items: Set<string> }): string[] {
  const hrefs: string[] = [];
  const collect = (parts: Inline[]) => parts.forEach((p) => p.type === "link" && p.href.startsWith("/") && hrefs.push(p.href));
  for (const b of blocks) {
    if (b.type === "p") collect(b.inline);
    if (b.type === "ul") b.items.forEach(collect);
  }
  return hrefs.filter((href) => {
    const path = href.split(/[?#]/)[0];
    const instrument = /^\/instruments\/([^/]+)$/.exec(path);
    const item = /^\/items\/([^/]+)$/.exec(path);
    if (instrument) return !known.instruments.has(instrument[1]);
    if (item) return !known.items.has(item[1]);
    return !SECTION_PATHS.has(path);
  });
}
