# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Policy Gradient** is a public AI-regulation tracker for a technology-policy student's portfolio, publishable for others later. It follows laws and policies on AI in **Europe (EU and Switzerland), the US (federal and state), China and Singapore**. Content is researched by parallel subagents, checked by independent reviewer agents, and shown on a static site whose home page is a rotating globe of paper sheets.

`docs/spec.md` is the product spec and phase plan, and is kept in step with the code. Read it before building anything.

## Where things stand

**Done**
- Schema, validator, content loader and link checker (`site/lib`, `site/scripts`), all tested.
- Agent pipeline (`.claude/agents/`, `/research-run`) and two bootstrap runs. `content/` holds 15 reviewed instruments and 2 news items, each instrument carrying a verified `kind`.
- Design tokens (`.planning/design/system/tokens.md`) and the home page built from them: the globe of paper sheets (instruments, timeline events and items). The design prototypes were removed once the real site superseded them. They are in git history at `7472fe1`.
- Home page: the globe, region spin, detail panel, info pop-ups. (There is no list view: the Files page is the plain-HTML alternative to the globe.) Static export builds.
- Accessibility basics: `lib/contrast.ts` and its test check every text/background pair in the tokens against WCAG AA (4.5:1). A skip link on every page. `SITE_URL` is validated by `lib/site-url.ts` and the build warns when it is unset.
- A normal 30-day news run (`content/runs/2026-10-06-b/`): 7 news items and 19 instruments in all.
- The pages the nav links to: Files (filterable archive), one page per instrument (`/instruments/<slug>/`) and per news item (`/items/<id>/`), Methodology, and the Digest with an RSS feed (`/digest/feed.xml`). 35 static pages in all.

**Next, in order**
1. Make sure the Methodology page's "a person approves every change" is true in practice. The 2026-w41 digest lists the California EO N-9-26 instrument but not its news item; add a line for the item if you want it in the digest.
2. Check the skip link and focus order by hand in a real browser (only the built HTML has been checked so far).
3. Compare matrix and search, then deploy (static host, custom domain, `SITE_URL` set), then scheduled automation of the pipeline (Phase 5 in the spec).

## Key decisions

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
npm run validate        # schema, duplicates, instrument links, digest links
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
.planning/design/system/            tokens.md (binding design tokens)
site/lib/                           schema, content loader, globe maths, labels, files filters, digest parser, rss, link helpers (all tested)
site/components/                    home: GlobeHome, Sheet, DetailPanel, NavInfo, useGlobeMotion, globe.css
                                    pages: PageShell, FileBrowser, Stamp, detail.tsx (shared by panel and pages), page.css
site/app/                           routes, layout, globals.css (tokens and the wood background)
```

## Hosting and portability

The site is a plain static export, so any host that runs `npm run build` in `site/` and serves `site/out/` can host it (Vercel, Cloudflare Pages, Netlify, GitHub Pages). Keep it host-neutral so switching stays a 30-minute job:

- Host settings: root directory `site`, build command `npm run build`, output directory `out`, env vars `SITE_URL` (the custom domain) and `NODE_VERSION` (Next 16 needs Node 20.9+).
- **No host-specific code or config.** No `vercel.json`, `@vercel/*` packages, Vercel Analytics, Speed Insights, KV or Blob, `next/image` optimisation (static export needs `images.unoptimized`), or Next features that need a server. Same for Cloudflare- or Netlify-only files unless the user has chosen that host.
- **Use the custom domain everywhere permanent.** `SITE_URL`, the RSS feed and any links must never point at a `*.vercel.app` or `*.pages.dev` URL, or they break on a move. Register the domain with a registrar the user controls, not through the host.
- Preview URLs are public. Do not put anything unpublished in a branch that a host auto-deploys.
- Content stays in git (about 340 KB). No database or object storage until it outgrows that.
- Delete `site/node_modules`, `site/.next` and `site/out` to free disk space. `npm install` and `npm run build` restore them.

## Rules for content and the pipeline

- Primary sources first. Every item has a confidence rating, and every instrument a "last verified" date.
- Agents verify current legal status from fetched pages. Their training data is not a source.
- Facts are never published on one agent's say-so: a fresh reviewer re-fetches the sources, and a human approves the diff before commit. Do not edit facts to make validation pass.
- Revision rounds are capped at 3 in `/research-run`. An entry still at "revise" stays unpromoted.
- Every page needs the "not legal advice" disclaimer.

## Working on the site

- **Next.js 16, React 19, Tailwind 4.** `site/AGENTS.md` warns this version has breaking changes. Read the matching guide in `site/node_modules/next/dist/docs/` before writing Next code. Route `params` are a `Promise`, and `PageProps<'/route'>` is a global helper.
- **Static export (`output: 'export'`, `trailingSlash: true`).** Every dynamic route needs `generateStaticParams` and `dynamicParams = false`, and route handlers (RSS) need `export const dynamic = 'force-static'`. No server features. Trailing slashes make `/files/` export as `files/index.html`, which any static host serves. Without them a plain static server shows directory listings.
- **Design tokens are binding** (`.planning/design/system/tokens.md`, mirrored as CSS variables in `app/globals.css`). Use variables, not raw hex. No default fonts or Tailwind colours.
- **TDD for anything in `site/lib/`.** UI is checked with real screenshots: serve `site/out/` with `python3 -m http.server` and drive headless Google Chrome (`--screenshot`, `--virtual-time-budget`).
- **Format dates with `lib/labels.ts`, never `Intl`.** The server and the browser disagree on month abbreviations and cause hydration mismatches.
- **Document pages close back to the globe two ways** (`PageShell`): the × in the sheet corner, and a fixed `.pg-backdrop` link behind the page, so a click on the bare desk goes home. That is why `.pg` and `.pg-head` are `pointer-events: none`. Any new element placed directly in `.pg` needs `pointer-events: auto` to be clickable.
- **The globe turns via DOM refs, not React state** (`useGlobeMotion`), so nothing re-renders per frame. Keep it that way.

## Gotchas that cost time

- On sheets, never put `opacity` on `.sheet` (it flattens the 3D context and shows mirrored backs). Dim the faces instead. Scale only `.face.front` on hover, or the back face loses its flip and covers the front.
- The panel is outside `.stage`, so it can't use the stage's `--u` scale variable.
- Headless Chrome cannot go below a 500px-wide window, so 390px screenshots only crop a wider layout.
- Some sites return 403 or 406 to automated fetches (California legislature, NY Senate). `lib/links.ts` lists hosts the link check skips, and the checker sends browser headers.
- Tailwind's reset strips list bullets and numbers. Any new `ul` or `ol` needs `list-style` set explicitly (see `.detail` and `.prose`).
- In zsh a variable named `path` overwrites `PATH`. Don't use it in shell loops.
- A stray `package-lock.json` in the home folder confuses Turbopack, so `next.config.ts` pins `turbopack.root`.

## Git

`main` is production and is untouched. `develop` is the integration branch and the one to work on. Remote: `origin` (github.com/vaniahalim/policy-gradient). Commit and push only when asked. Commit messages end with the Co-Authored-By line from the session's attribution instructions.
