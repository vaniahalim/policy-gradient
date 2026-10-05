# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

AI regulation tracker (EU / US / Asia): a public portfolio site. `docs/spec.md` is the source of truth for product scope, architecture and phases. Read it before building anything.

**Only Phase 0 has started.** Right now the repo holds `docs/spec.md` and `site/`, a stock `create-next-app` scaffold (`app/page.tsx` is still the default template). The spec's other directories (`.claude/agents/`, `content/`, `schema/`, `scripts/`) do not exist yet. Don't assume they do.

## Commands

All run from `site/` (there is no root `package.json`):

```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run lint     # eslint (flat config, eslint.config.mjs); no test runner is configured
```

`zod` and `tsx` are already in `site/package.json`, anticipating the schema and `scripts/validate.ts` work. The spec's `npm run validate` doesn't exist yet.

## Next.js version warning

`site/` runs Next 16 with React 19 and Tailwind 4. `site/AGENTS.md` (imported by `site/CLAUDE.md`) says this version has breaking changes from what you may know. Read the relevant guide in `site/node_modules/next/dist/docs/` before writing Next code, and heed deprecation notices.

## Planned architecture (from the spec)

- **Content-as-files, static site.** No database. Reviewed items go in `content/items/<yyyy-mm>/<id>.json`, laws and policies in `content/instruments/<slug>.json`, and weekly digests in `content/digests/`. The site is a static export, and git history is the audit trail.
- **Schema-first.** zod schemas in `schema/` define the item and instrument shapes. All agent output must validate against them before it enters `content/`, and `scripts/validate.ts` checks schema, URL liveness and dedupe.
- **Multi-agent pipeline.** Parallel, independent researcher subagents (EU / US / Asia) write candidates to `content/runs/<run-id>/`. Separate fresh-context reviewer agents re-fetch every cited source and return accept/revise/reject. An editor agent dedupes, links items to instruments and drafts the digest. A human approves the diff before commit. Run provenance in `content/runs/` is committed. The pipeline runs on demand from Claude Code first, with scheduled automation deferred to Phase 5.
- **Views:** feed, instrument pages with status timelines, jurisdiction pages, methodology, digest and RSS. Compare matrix and search come later.

## Content conventions

- Prefer primary sources (Official Journal, Federal Register, congress.gov, official regulator sites). Every item carries a confidence rating and a "last verified" date.
- Agents must verify current legal status. The spec's seed list is not to be trusted as fact.
- Every page needs a "not legal advice" disclaimer.

## Git

The repo is on `master` with no commits yet. Per the global config, `main` is the production branch and `develop` is the integration branch.
