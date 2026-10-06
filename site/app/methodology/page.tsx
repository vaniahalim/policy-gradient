import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { loadContent } from "@/lib/content";
import { formatDate } from "@/lib/labels";
import { INSTRUMENT_KINDS, INSTRUMENT_KIND_LABELS } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Methodology | Policy Gradient",
  description: "How a file gets onto Policy Gradient, what its labels mean, and the limits to keep in mind.",
};

const KIND_MEANING: Record<(typeof INSTRUMENT_KINDS)[number], string> = {
  statute: "An act adopted by a legislature. EU Regulations adopted by Parliament and Council count here.",
  regulation: "Binding rules issued by an agency or ministry under delegated authority.",
  executive_order: "An order issued by a head of state or government.",
  guidance: "Official guidance or an agency policy statement that does not bind by itself.",
  voluntary_code: "A code of practice that parties may choose to sign up to.",
  policy_framework: "A government's stated approach or legislative recommendations that are not themselves law.",
};

export default function MethodologyPage() {
  const { instruments, items } = loadContent();
  const lastVerified = instruments.map((i) => i.last_verified).sort().at(-1);

  return (
    <PageShell current="methodology">
      <h1>Methodology</h1>
      <p className="pg-lede">How a file gets onto Policy Gradient, what its labels mean, and how far to trust it.</p>

      <div className="prose">
        <h2>What this covers</h2>
        <p>
          Policy Gradient tracks laws and policies on artificial intelligence in Europe (the EU and Switzerland), the United States (federal and state), China and Singapore.
          Right now that is {instruments.length} laws and policies and {items.length} news items{lastVerified ? `, last verified on ${formatDate(lastVerified)}` : ""}.
        </p>
        <p>It is a starting set, not a complete one. Japan, South Korea, India and most US states are not covered yet.</p>

        <h2>How a file is made</h2>
        <ol>
          <li>A research agent for each region searches for developments and reads the primary sources: official journals, legislature pages and regulator publications. The regions are researched independently, so one cannot anchor on another&rsquo;s findings.</li>
          <li>A separate reviewer agent, starting fresh, re-fetches every source the researcher cited. It checks that the claim matches the source, that dates and status are right, that the source is what it is labelled as, that nothing is a duplicate and that the tone is neutral. It answers accept, revise or reject.</li>
          <li>Anything marked revise goes back to the researcher and is reviewed again, up to three more times. Anything not accepted by then is not published.</li>
          <li>An editor agent merges the accepted material, links news to the laws it concerns and drafts the weekly digest.</li>
          <li>Automated checks run. The data has to match its schema, nothing can be duplicated, and every cited link is checked to be live.</li>
          <li>The pipeline is designed so that a person reads the changes and approves them before they are published.</li>
        </ol>
        <p>The research, review and editing are done by AI agents. That is why the independent second reading and the human approval step exist.</p>

        <h2>Reading a file: status</h2>
        <p>The stamp shows where something is in its life: proposed, consultation, passed, in force, amended, repealed or withdrawn.</p>
        <p>
          &ldquo;In force&rdquo; does not mean every obligation applies today. Many laws phase in over years, and a file&rsquo;s timeline lists the dates.
        </p>

        <h2>Reading a file: type</h2>
        <p>The type says what kind of document it is, which is separate from its status. A proposed statute and a voluntary code that is already in use are very different things.</p>
        <dl>
          {INSTRUMENT_KINDS.map((k) => (
            <div key={k}>
              <dt>{INSTRUMENT_KIND_LABELS[k]}</dt>
              <dd>{KIND_MEANING[k]}</dd>
            </div>
          ))}
        </dl>

        <h2>Confidence in news items</h2>
        <dl>
          <dt>High</dt>
          <dd>At least one primary source was read in full for the key claim, and the date and status match it.</dd>
          <dt>Medium</dt>
          <dd>The primary source was read only in part, or the status comes from a secondary source that cites the primary.</dd>
          <dt>Low</dt>
          <dd>Only secondary sources, a machine-translated source, or conflicting reports.</dd>
        </dl>

        <h2>Limits to keep in mind</h2>
        <ul>
          <li>Every file is a snapshot. The &ldquo;last verified&rdquo; date is when it was last checked, and it does not change until the next research run.</li>
          <li>Some official sites refuse automated visits, so a few cited links are not checked by the link checker.</li>
          <li>Some Chinese-language sources were read through machine translation. A file says so where that applies.</li>
          <li>Where a primary source could not be read, a file relies on secondary sources and says so in its text.</li>
          <li>This is a research tracker, not legal advice.</li>
        </ul>
      </div>
    </PageShell>
  );
}
