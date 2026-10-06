# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Policy Gradient** is a public AI-regulation tracker for a technology-policy student's portfolio, publishable for others later. It follows laws and policies on AI in **Europe (EU and Switzerland), the US (federal and state), China and Singapore**. Content is researched by parallel subagents, checked by independent reviewer agents, and shown on a static site whose home page is a rotating globe of paper sheets.

`docs/spec.md` is the product spec and phase plan. Read it before building anything. Some of it is superseded by the decisions below.

## Where things stand

**Done**
- Schema, validator, content loader and link checker (`site/lib`, `site/scripts`), all tested.
- Agent pipeline (`.claude/agents/`, `/research-run`) and two bootstrap runs. `content/` holds 15 reviewed instruments and 2 news items, each instrument carrying a verified `kind`.
- Design tokens and the globe prototypes (`.planning/design/`). Prototype **option A** (instruments, timeline events and items as sheets) was chosen and is now the real home page.
- Home page: the globe, region spin, detail panel, list view, info pop-ups. Static export builds.

**Next, in order**
1. Pages the nav links to: Files (filterable feed), one page per instrument at its own URL, Methodology, Digest with RSS. Until they exist those links 404.
2. A normal (non-bootstrap) 30-day news run. Only 2 items exist, so the feed is thin.
3. Compare matrix, search, then deploy (static host, custom domain), then scheduled automation of the pipeline (Phase 5 in the spec).

## Decisions that override the spec

- **Name and look:** Policy Gradient. A globe of paper sheets on a walnut desk, bold extended type (Archivo) with a readable serif (Source Serif 4), parchment, ink, oxblood, pen-blue and brass. The earlier "editorial serif" default was rejected by the user.
- **Asia in v1 is China and Singapore only.** Japan, South Korea and India were dropped on 2026-10-06 and their instruments deleted. The raw findings remain in `content/runs/2026-10-05-b/`.
- **`jurisdiction` is `europe | us | asia`** (not `eu`). Switzerland is a Europe sub-region.
- **Instruments have a required `kind`** (statute, regulation, executive_order, guidance, voluntary_code, policy_framework), separate from `status`. Definitions are in `docs/research-protocol.md`.
- **Schema and scripts live in `site/`**, not a root `schema/` folder.
- **Timestamps are ISO 8601 UTC with `Z`.** `event_date` and timeline dates are plain calendar dates.

## Commands

All run from `site/` (there is no root `package.json`):

```bash
npm run dev             # dev server on :3000
npm run build           # static export to site/out/
npm run lint            # eslint
npm test                # node:test via tsx, over lib/*.test.ts
npm run validate        # schema, duplicates, instrument links
npm run validate:links  # also checks every cited URL is live
```

Run `lint`, `test`, `validate` and `build` before committing. Pipeline: `/research-run [regions] [days] [bootstrap]`.

## Layout

```
content/items/<yyyy-mm>/<id>.json   reviewed news items (only reviewer-accepted items validate)
content/instruments/<slug>.json     laws and policies with status timelines
content/digests/                    weekly digests
content/runs/<run-id>/              raw agent output and review verdicts. Provenance. Never loaded by the site.
docs/                               spec.md, research-protocol.md (the rules every agent follows)
.claude/agents/ .claude/commands/   researcher-europe/us/asia, reviewer, editor, /research-run
.planning/design/                   tokens.md (binding) and the home-globe prototypes
site/lib/                           schema, content loader, globe maths, labels, link helpers (tested)
site/components/                    GlobeHome, Sheet, DetailPanel, NavInfo, useGlobeMotion, globe.css
site/app/                           routes, layout, globals.css (tokens and the wood background)
```

## Rules for content and the pipeline

- Primary sources first. Every item has a confidence rating, and every instrument a "last verified" date.
- Agents verify current legal status from fetched pages. Their training data and the spec's seed list are not sources.
- Facts are never published on one agent's say-so: a fresh reviewer re-fetches the sources, and a human approves the diff before commit. Do not edit facts to make validation pass.
- Revision rounds are capped at 3 in `/research-run`. An entry still at "revise" stays unpromoted.
- Every page needs the "not legal advice" disclaimer.

## Working on the site

- **Next.js 16, React 19, Tailwind 4.** `site/AGENTS.md` warns this version has breaking changes. Read the matching guide in `site/node_modules/next/dist/docs/` before writing Next code. Route `params` are a `Promise`, and `PageProps<'/route'>` is a global helper.
- **Static export (`output: 'export'`).** Every dynamic route needs `generateStaticParams`, and route handlers (RSS) need `export const dynamic = 'force-static'`. No server features.
- **Design tokens are binding** (`.planning/design/system/tokens.md`, mirrored as CSS variables in `app/globals.css`). Use variables, not raw hex. No default fonts or Tailwind colours.
- **TDD for anything in `site/lib/`.** UI is checked with real screenshots: serve `site/out/` with `python3 -m http.server` and drive headless Google Chrome (`--screenshot`, `--virtual-time-budget`).
- **Format dates with `lib/labels.ts`, never `Intl`.** The server and the browser disagree on month abbreviations and cause hydration mismatches.
- **The globe turns via DOM refs, not React state** (`useGlobeMotion`), so nothing re-renders per frame. Keep it that way.

## Gotchas that cost time

- On sheets, never put `opacity` on `.sheet` (it flattens the 3D context and shows mirrored backs). Dim the faces instead. Scale only `.face.front` on hover, or the back face loses its flip and covers the front.
- The panel is outside `.stage`, so it can't use the stage's `--u` scale variable.
- Headless Chrome cannot go below a 500px-wide window, so 390px screenshots only crop a wider layout.
- Some sites return 403 or 406 to automated fetches (California legislature, NY Senate). `lib/links.ts` lists hosts the link check skips, and the checker sends browser headers.
- In zsh a variable named `path` overwrites `PATH`. Don't use it in shell loops.
- A stray `package-lock.json` in the home folder confuses Turbopack, so `next.config.ts` pins `turbopack.root`.

## Git

`main` is production and is untouched. `develop` is the integration branch and the one to work on. Remote: `origin` (github.com/vaniahalim/policy-gradient). Commit and push only when asked. Commit messages end with the Co-Authored-By line from the session's attribution instructions.
