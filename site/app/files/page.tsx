import type { Metadata } from "next";
import { FileBrowser } from "@/components/FileBrowser";
import { PageShell } from "@/components/PageShell";
import { loadContent } from "@/lib/content";
import { toFileRows } from "@/lib/files";

export const metadata: Metadata = {
  title: "Files | Policy Gradient",
  description: "Every law, policy and news item tracked on Policy Gradient, filterable by region, type and status.",
};

export default function FilesPage() {
  const { instruments, items } = loadContent();
  return (
    <PageShell current="files">
      <h1>Files</h1>
      <p className="pg-lede">Every law, policy and news item we track. Filter by region, type and status, then open a file for its obligations, timeline and sources.</p>
      <FileBrowser rows={toFileRows(instruments, items)} />
    </PageShell>
  );
}
