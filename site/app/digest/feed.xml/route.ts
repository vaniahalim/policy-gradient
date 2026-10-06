import { loadDigests } from "@/lib/digest";
import { buildRss } from "@/lib/rss";

export const dynamic = "force-static";

// Set SITE_URL when deploying (for example https://policygradient.example). RSS links must be absolute.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export function GET() {
  const xml = buildRss({
    siteUrl: SITE_URL,
    title: "Policy Gradient: weekly digest",
    description: "A short weekly summary of what changed in AI regulation, by region.",
    path: "/digest/feed.xml",
    entries: loadDigests().map((d) => ({ title: d.title, path: `/digest/${d.slug}/`, date: d.date, description: d.summary })),
  });
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
