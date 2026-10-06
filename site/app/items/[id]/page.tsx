import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemDetail } from "@/components/detail";
import { PageShell } from "@/components/PageShell";
import { Stamp } from "@/components/Stamp";
import { loadContent } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadContent().items.map((i) => ({ id: i.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const item = loadContent().items.find((i) => i.id === id);
  return item ? { title: `${item.title} | Policy Gradient`, description: item.summary.slice(0, 200) } : {};
}

export default async function ItemPage({ params }: Params) {
  const { id } = await params;
  const { instruments, items } = loadContent();
  const item = items.find((i) => i.id === id);
  if (!item) notFound();
  const instrument = item.instrument_slug ? instruments.find((i) => i.slug === item.instrument_slug) : undefined;

  return (
    <PageShell current="files">
      <Link className="pg-back" href="/files">
        All files
      </Link>
      <div className="pg-badges">
        <Stamp stage={item.stage} />
      </div>
      <h1>{item.title}</h1>
      <ItemDetail item={item} />
      {instrument && (
        <div className="detail">
          <h3>About the law</h3>
          <p className="sum">
            This concerns <Link href={`/instruments/${instrument.slug}`}>{instrument.name}</Link>.
          </p>
        </div>
      )}
    </PageShell>
  );
}
