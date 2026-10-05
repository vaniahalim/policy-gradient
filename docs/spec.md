# AI Regulation Tracker: Spec and Plan

## Context
The user is a technology-policy student with an AI background and wants a public portfolio piece: a tracker of AI regulation news and developments in Europe, the US and Asia. It should be publishable later for other people. Content is produced by parallel, independent research subagents (one per jurisdiction) and checked by separate reviewer agents. Decision from the user: **run the agents on demand from Claude Code first, automate on a schedule later (Phase 2).**

The project directory `/Users/vania/projects/ai regulation tracker` is empty (greenfield, not a git repo yet).

## Product: what makes it useful (not just a news feed)
Most trackers are link dumps. This one is a **structured, sourced, reviewed** tracker.

**Core views**
1. **Feed**: reviewed items newest-first, filterable by jurisdiction, type, topic, stage and date. Each item has a 2-3 sentence summary, "why it matters", a primary-source link and a reviewer-confidence badge.
2. **Instrument pages** (the differentiator): one page per law or policy (e.g. EU AI Act, Colorado AI Act, China's Generative AI Measures, Korea AI Basic Act, Japan AI Promotion Act). Each has a status timeline (proposed, passed, in force, amended), key obligations, who is covered, and the news items linked to it.
3. **Jurisdiction pages**: a regime overview, active instruments and recent items for Europe (EU and Switzerland), US (federal and state) and Asia (China, Japan, South Korea, Singapore, India, others), treated as sub-regions.
4. **Compare**: side-by-side matrix of regimes (approach, risk-based or sectoral, enforcement, penalties, GPAI/frontier rules). This is strong portfolio content.
5. **Weekly digest page and RSS feed**, so others can subscribe.
6. **Methodology page**: how items are found, how agents and reviewers work, and the confidence rubric. It signals rigor and sets the site apart as research, not an aggregator.
7. **Analysis posts (optional, human-written)**: short essays by the user. These are the portfolio's personal voice. The agents supply facts and the user supplies judgment.

**Out of scope (v1):** accounts, comments, email alerts, full-text legal-document hosting, non-English UIs, an LLM chat interface.

## Architecture
```
.claude/agents/            researcher-europe, researcher-us, researcher-asia, reviewer, editor
content/
  items/<yyyy-mm>/<id>.json        reviewed news items
  instruments/<slug>.json          laws/policies + status timeline
  digests/<yyyy-ww>.md
  runs/<run-id>/                   raw findings, review verdicts, logs (provenance, committed)
schema/                            zod schemas = single source of truth for item/instrument shape
scripts/
  validate.ts                      schema + link check + dedupe
  build-digest.ts
site/                              Next.js (App Router), static export, Tailwind
```
- **Static site, content-as-files**: no database needed. Git history is the audit trail, hosting is free (Vercel or Cloudflare Pages), and it fits a portfolio.
- **Schema-first**: every agent output must validate against the zod schema before it can enter `content/`. This makes the later automated pipeline a drop-in.

### Item schema (key fields)
`id, title, jurisdiction (europe|us|asia), subregion, instrument_slug?, type (law|regulation|guidance|enforcement|court|consultation|news), stage, topics[], summary, why_it_matters, sources[{url, publisher, tier: primary|secondary, accessed_at}], event_date, confidence (high|medium|low), review{verdict, reviewer_notes, checks[]}, run_id`

## Multi-agent workflow (the "parallelized" part)
Run as one orchestrated command (e.g. a `/research-run` skill or script prompt):

1. **Plan**: the orchestrator reads the existing content to know what's already tracked and sets the date window.
2. **Research (parallel, independent)**: 3 researcher subagents run concurrently (Europe / US / Asia, with Asia optionally split into China / Japan+Korea / SEA+India for 5 workers). Each uses web search and fetch, prefers **primary sources** (Official Journal, Federal Register, congress.gov, state legislature sites, CAC, METI and similar), and writes candidate items to `content/runs/<id>/<jurisdiction>.json`. They do not see each other's output, which avoids anchoring.
3. **Review (parallel, independent)**: one reviewer per researcher batch, a **fresh context**, not the author. It re-fetches every cited URL and checks: (a) the claim matches the source, (b) the date and status are correct, (c) the source is primary or at least credible, (d) no duplicates or hallucinated instruments, (e) the summary is neutral. Verdicts are accept, revise or reject. Rejected items never publish, and revise items go back once.
4. **Edit and merge**: an editor agent dedupes across jurisdictions, links items to instruments, updates instrument timelines and drafts the weekly digest.
5. **Gate**: `scripts/validate.ts` (schema, URLs resolve, no duplicates). **Human approval of the diff before commit**, since a policy site's credibility depends on accuracy.

## Phases
- **Phase 0, Foundation:** init repo, Next.js and Tailwind scaffold, zod schemas, validation script, 5-10 hand-seeded instruments as fixtures, and the design tokens.
- **Phase 1, Agents:** write the 3 researcher, reviewer and editor agent definitions, the orchestration command and the confidence rubric. First dry run on a single jurisdiction, then all in parallel. Measure review rejection rate and fix the prompts.
- **Phase 2, Site:** feed with filters, item pages, instrument pages with timelines, jurisdiction pages, methodology page and digest/RSS.
- **Phase 3, Differentiators:** compare matrix, search (Pagefind, static), "last verified" stamps and an OG-image/sharing polish pass.
- **Phase 4, Publish:** deploy, custom domain, a README with an architecture diagram, and a short case-study write-up.
- **Phase 5 (later), Automation:** move the same agent definitions into a scheduled GitHub Action using the Claude API with web search. It opens a PR each week for human review, and keeps the same validation gate.

## Seed coverage for the first run (agents must verify current status; do not trust this list)
- **Europe (EU):** AI Act (GPAI obligations, high-risk timeline, any delay or "digital omnibus" changes), the GPAI Code of Practice, AI Office guidance.
- **Europe (Switzerland):** Federal Council plan to ratify the Council of Europe AI Convention with sector-specific implementation, and the resulting consultation drafts.
- **US:** federal executive actions and preemption debate, NIST, state laws (Colorado, California, Texas and others), notable litigation.
- **Asia:** China (generative AI measures, content-labeling rules, algorithm filing), Japan AI Promotion Act, South Korea AI Basic Act, Singapore model governance, India's approach.

## Key risks and mitigations
- **Hallucinated or stale legal facts:** an independent reviewer re-fetches the sources, with a primary-source preference, a human diff approval and a visible "last verified" date.
- **Paywalled or non-English sources (China, Japan, Korea):** researchers cite the official text and flag machine-translated summaries with lower confidence.
- **Not legal advice:** a clear disclaimer on every page and in the footer.
- **Scope creep:** v1 is the feed, instruments, jurisdictions and methodology pages. Compare and search come after.

## Verification (end to end)
1. `npm run validate` passes on all content, with the schema, URL liveness and dedupe checks.
2. Dry run: the orchestrated command produces `content/runs/<id>/` with findings and verdicts for all jurisdictions. Spot-check at least 10 accepted items by hand against their sources, and confirm at least some items are rejected or revised (a reviewer that accepts everything isn't working).
3. `npm run build` produces a static export, and `npm run dev` is checked in the browser at mobile, tablet and desktop widths. Check filters, instrument timelines and the RSS feed.
4. Accessibility pass (contrast, keyboard navigation, focus states), then Lighthouse.

## Open questions to confirm before building
- Visual identity: editorial and scholarly (serif-forward, restrained), or dashboard-style? Recommendation is editorial and scholarly, which suits the policy-student positioning.
- Which "Asia" sub-regions to cover in v1? Recommendation is China, Japan, South Korea, Singapore and India.
- Whether to include human-written analysis posts in v1 or leave them for later.
