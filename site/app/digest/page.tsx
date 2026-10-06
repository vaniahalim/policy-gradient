import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { loadDigests } from "@/lib/digest";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Digest | Policy Gradient",
  description: "A short weekly summary of what changed in AI regulation, by region.",
  alternates: { types: { "application/rss+xml": "/digest/feed.xml" } },
};

export default function DigestPage() {
  const digests = loadDigests();
  return (
    <PageShell current="digest">
      <h1>Digest</h1>
      <p className="pg-lede">
        A short weekly summary of what changed, by region. <a className="inline" href="/digest/feed.xml">Subscribe by RSS</a>.
      </p>
      {digests.length === 0 ? (
        <p>No digests yet. The first appears after the next research run.</p>
      ) : (
        <ul className="dg-list">
          {digests.map((d) => (
            <li key={d.slug}>
              <Link href={`/digest/${d.slug}`}>
                <h2 className="dg-title">{d.title}</h2>
                <p className="dg-date">Week starting {formatDate(d.date)}</p>
                {d.summary && <p className="dg-sum">{d.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
