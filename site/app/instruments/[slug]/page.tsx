import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InstrumentDetail } from "@/components/detail";
import { PageShell } from "@/components/PageShell";
import { KindTag, Stamp } from "@/components/Stamp";
import { loadContent, itemsForInstrument } from "@/lib/content";
import { formatDate } from "@/lib/labels";

// Static export: only the instruments that exist at build time get a page.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadContent().instruments.map((i) => ({ slug: i.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const instrument = loadContent().instruments.find((i) => i.slug === slug);
  return instrument ? { title: `${instrument.name} | Policy Gradient`, description: instrument.summary.slice(0, 200) } : {};
}

export default async function InstrumentPage({ params }: Params) {
  const { slug } = await params;
  const { instruments, items } = loadContent();
  const instrument = instruments.find((i) => i.slug === slug);
  if (!instrument) notFound();
  const related = itemsForInstrument(items, slug);

  return (
    <PageShell current="files">
      <Link className="pg-back" href="/files">
        All files
      </Link>
      <div className="pg-badges">
        <Stamp stage={instrument.status} />
        <KindTag kind={instrument.kind} />
      </div>
      <h1>{instrument.name}</h1>
      <InstrumentDetail instrument={instrument} />
      {related.length > 0 && (
        <div className="detail">
          <h3>Related news</h3>
          <ul>
            {related.map((i) => (
              <li key={i.id}>
                <Link href={`/items/${i.id}`}>{i.title}</Link> ({formatDate(i.event_date)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}
