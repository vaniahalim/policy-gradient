import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { loadDigests, type Inline } from "@/lib/digest";
import { formatDate } from "@/lib/labels";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDigests().map((d) => ({ week: d.slug }));
}

type Params = { params: Promise<{ week: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { week } = await params;
  const digest = loadDigests().find((d) => d.slug === week);
  return digest ? { title: `${digest.title} | Policy Gradient`, description: digest.summary } : {};
}

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.text}</span>
        ) : p.href.startsWith("/") ? (
          <Link key={i} href={p.href}>
            {p.text}
          </Link>
        ) : (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">
            {p.text}
          </a>
        ),
      )}
    </>
  );
}

export default async function DigestWeekPage({ params }: Params) {
  const { week } = await params;
  const digest = loadDigests().find((d) => d.slug === week);
  if (!digest) notFound();

  return (
    <PageShell current="digest">
      <Link className="pg-back" href="/digest">
        All digests
      </Link>
      <h1>{digest.title}</h1>
      <p className="pg-lede">Week starting {formatDate(digest.date)}.</p>
      <div className="prose">
        {digest.blocks.map((b, i) =>
          b.type === "h2" ? (
            <h2 key={i}>{b.text}</h2>
          ) : b.type === "p" ? (
            <p key={i}>
              <Inlines parts={b.inline} />
            </p>
          ) : (
            <ul key={i}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Inlines parts={item} />
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </PageShell>
  );
}
