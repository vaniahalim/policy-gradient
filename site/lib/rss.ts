export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-05" -> "Mon, 05 Oct 2026 00:00:00 GMT". */
export function rfc822(date: string): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]}, ${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 GMT`;
}

export type RssEntry = { title: string; path: string; date: string; description: string };

export function buildRss(feed: { siteUrl: string; title: string; description: string; path: string; entries: RssEntry[] }): string {
  const base = feed.siteUrl.replace(/\/+$/, "");
  const url = (path: string) => `${base}${path}`;
  const items = feed.entries
    .map(
      (e) => `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${url(e.path)}</link>
      <guid isPermaLink="true">${url(e.path)}</guid>
      <pubDate>${rfc822(e.date)}</pubDate>
      <description>${escapeXml(e.description)}</description>
    </item>`,
    )
    .join("\n");
  const latest = feed.entries.map((e) => e.date).sort().at(-1);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${base}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <atom:link href="${url(feed.path)}" rel="self" type="application/rss+xml"/>${latest ? `\n    <lastBuildDate>${rfc822(latest)}</lastBuildDate>` : ""}${items ? `\n${items}` : ""}
  </channel>
</rss>
`;
}
