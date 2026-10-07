# Policy Gradient: Spec and Plan

Last updated 2026-10-06. This is the product source of truth. `CLAUDE.md` covers how to work in the repo.

## Context
A public AI-regulation tracker for a technology-policy student with an AI background, built as a portfolio piece and publishable for other people. Content is researched by parallel, independent subagents (one per region) and checked by separate reviewer agents. The pipeline runs on demand from Claude Code first, and scheduled automation comes later.

Most trackers are link dumps. This one is **structured, sourced and independently reviewed**, and it says plainly what each item is and how far along it is.

## Scope
- **Regions:** Europe (the EU and Switzerland), the US (federal and state), and Asia limited to **China and Singapore** in v1. Japan, South Korea and India were dropped on 2026-10-06. Other regions come later.
- **Out of scope (v1):** accounts, comments, email alerts, full-text legal-document hosting, non-English UIs, an LLM chat interface.
- **Not legal advice.** Every page says so.

## Look and feel
**Policy Gradient.** A globe of paper sheets on a walnut desk, bold extended type (Archivo) with a readable serif (Source Serif 4), and a palette of parchment, ink, oxblood, pen-blue and brass. Tokens are in `.planning/design/system/tokens.md` and are binding. The earlier "editorial serif" direction was rejected.

## Views
| View | Status | Notes |
|---|---|---|
| **Globe home** | Built | Every instrument, timeline event and news item is a sheet. Hover steers the globe, drag spins it, region buttons spin to a region, and a click opens a detail panel. A list view gives the same content as plain HTML. |
| **Files** | Built | Filterable archive (region, type, status), newest first. |
| **Instrument pages** | Built | One per law or policy: status, type, obligations, timeline with sources, related news. This is the differentiator. |
| **News item pages** | Built | Summary, why it matters, sources, confidence. |
| **Methodology** | Built | How a file is made, what the labels mean, the limits. Counts come from the content. |
| **Digest and RSS** | Built | Weekly digests and `/digest/feed.xml`. |
| **Jurisdiction pages** | Not built | The globe's region buttons and the Files filters cover this for now. |
| **Compare matrix** | Not built | Side-by-side regimes (approach, enforcement, penalties, frontier-model rules). |
| **Search** | Not built | Static search (Pagefind). |
| **Analysis posts** | Not built | Optional short essays by the author. Agents supply facts and the author supplies judgment. |

## Architecture
```
.claude/agents/ .claude/commands/   researcher-europe/us/asia, reviewer, editor, /research-run
content/
  items/<yyyy-mm>/<id>.json         reviewed news items
  instruments/<slug>.json           laws and policies with status timelines
  digests/<yyyy>-w<ww>.md           weekly digests
  runs/<run-id>/                    raw agent output and review verdicts (provenance, committed, never published)
docs/                               this spec, research-protocol.md
.planning/design/                   design tokens
site/                               Next.js (App Router), Tailwind, static export
  lib/                              zod schema, content loader, globe maths, filters, digest, RSS (tested)
  scripts/                          validate.ts, preview.ts
```
- **Static site, content as files.** No database. Git history is the audit trail, and hosting is free. Hosting stays host-neutral (any static host, no vendor-specific features), so the site can move between Vercel, Cloudflare Pages and others. See CLAUDE.md, "Hosting and portability".
- **Schema first.** Every agent output must validate before it can enter `content/`. The pipeline can later move to a scheduled job without changing the data.

### Data model
- **Instrument:** `slug, name, kind, jurisdiction, subregion, status, summary, key_obligations[], timeline[{date, stage, note, source_url}], last_verified`.
  - `kind` is what it is: statute, regulation, executive order, guidance, voluntary code or policy framework. `status` is how far along it is.
- **Item:** `id, title, jurisdiction, subregion, instrument_slug?, type, stage, topics[], summary, why_it_matters, sources[{url, publisher, tier, accessed_at}], event_date, confidence, review{verdict, reviewer_notes, checks[]}, run_id`.
- `jurisdiction` is `europe | us | asia`. Timestamps are ISO 8601 UTC. Event and timeline dates are plain calendar dates.

## Pipeline
`/research-run [regions] [days] [bootstrap]`

1. **Plan:** read existing content, set the date window.
2. **Research (parallel, independent):** one researcher per region reads primary sources and writes candidates to `content/runs/<id>/`. They never see each other's output.
3. **Review (parallel, independent):** a fresh-context reviewer per candidate file re-fetches every cited source and returns accept, revise or reject. Revisions go back up to three rounds. Anything not accepted is never published.
4. **Edit:** the editor promotes accepted items, merges instrument timelines, links news to instruments and drafts the digest.
5. **Gate:** `npm run validate:links` (schema, duplicates, instrument and digest links, every cited URL live). A person approves the diff before it is committed.

**Bootstrap mode** builds the instrument list first, because news items link to instruments. The rules every agent follows are in `docs/research-protocol.md`.

## Phases
| Phase | Status |
|---|---|
| 0. Foundation: repo, Next.js scaffold, schema, validator, tokens | Done |
| 1. Agents: researchers, reviewer, editor, `/research-run`, bootstrap runs | Done. One bootstrap run per region set. No normal news run yet. |
| 2. Site: globe, Files, instrument and item pages, Methodology, Digest and RSS | Done |
| 3. Differentiators: compare matrix, search, jurisdiction pages, sharing images | Not started |
| 4. Publish: deploy, custom domain, README with an architecture diagram, case-study write-up | Not started |
| 5. Automation: a scheduled job runs the same agents through the Claude API and opens a weekly PR | Later |

## Risks and mitigations
- **Hallucinated or stale legal facts:** independent re-fetching reviewers, a primary-source preference, a human diff approval and a visible "last verified" date.
- **Sites that block automated fetches** (some legislature sites): the link checker skips a short list of hosts and reports them as skipped, not as passed. Reviewers read the content another way and say so in their notes.
- **Non-English sources (China):** researchers cite the official text and flag machine translation with lower confidence.
- **Binding vs soft law looking the same:** the instrument `kind` is shown on every file.
- **Claims about process:** the Methodology page describes human approval as the design. Make sure it is true in practice before publishing.

## Open items
- A normal 30-day news run, since only 2 news items exist.
- Before publishing: set `SITE_URL` for the RSS build, measure colour contrast, add a skip link past the sheet tab stops.
- Whether to add human-written analysis posts in v1.
- Which regions come after China and Singapore.
- When Switzerland publishes its consultation bill (due by end of 2026), track it as a proposed statute.
