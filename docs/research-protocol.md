# Research Protocol (shared by all agents)

Read this fully before doing any work. Schemas are defined in `site/lib/schema.ts` and are the source of truth for field names and allowed values. Output must validate against them.

## Principles
1. **Primary sources first.** Official gazettes, legislature sites, regulator publications, court records. Use secondary sources (news, law-firm notes) to discover items, then trace back to the primary source. If no primary source is reachable, say so and lower confidence.
2. **Never state what you did not read.** Every claim in `summary` and `why_it_matters` must be supported by a page you actually fetched in this run. If a fetch fails, do not fill in from memory. Drop the claim or drop the item.
3. **Your training data is not a source.** Legal status, dates and article numbers change. Verify them from the fetched page.
4. **Neutral voice.** Describe what the instrument does. No advocacy, no predictions stated as fact. "Why it matters" explains practical consequence for affected parties, not opinion.
5. **Be honest about uncertainty.** Use `confidence: low` and say why in the summary when sources conflict or only machine-translated text was available.

## Source tiers
- `primary`: the issuing body itself (e.g. EUR-Lex, Federal Register, congress.gov, a state legislature, CAC, METI, Swiss Federal Council / admin.ch, a court).
- `secondary`: everything else (news, law firms, think tanks).

## Confidence rubric
- `high`: at least one primary source read in full for the key claim, and the date and status match the source.
- `medium`: primary source read but only partly (e.g. only a summary page), or status inferred from a secondary source that cites the primary.
- `low`: secondary sources only, machine-translated source, or conflicting reports.

## What counts as an item
A dated, discrete development: a law passed or entering into force, a regulation or guidance published, an enforcement action, a court ruling, a public consultation opening or closing, or a significant official statement. Not opinion pieces, product launches or funding news.

## Output: candidate file
Write one JSON file to `content/runs/<run-id>/<region>.json`:

```json
{
  "run_id": "2026-10-05-a",
  "region": "europe",
  "window": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "candidates": [ /* Item objects WITHOUT the "review" field */ ],
  "instrument_candidates": [ /* Instrument objects, full schema */ ],
  "gaps": ["things you looked for but could not verify, with why"]
}
```

- `id`: lowercase kebab-case, prefix with sub-region code, e.g. `ch-...`, `eu-...`.
- `sources[].accessed_at`: ISO 8601 UTC with `Z`, the time you fetched it.
- `event_date`: the calendar date of the event itself (not the date you found it).
- `instrument_slug` on an item must match an `instrument_candidates[].slug` or an existing file in `content/instruments/`.
- Read existing `content/items/` and `content/instruments/` first. Do not re-propose an item that already exists. Propose an update (new timeline entry) only for a new development.

## Bootstrap mode
When the run prompt says `bootstrap`, the window is ignored. Focus on `instrument_candidates`: identify the main AI-specific laws and policies in your region, with a full status timeline sourced from primary documents. Items are optional.

## Output: review file
Reviewers write `content/runs/<run-id>/<region>.review.json`:

```json
{
  "run_id": "2026-10-05-a",
  "region": "europe",
  "verdicts": [
    {
      "id": "item id or instrument slug",
      "kind": "item",
      "verdict": "accept | revise | reject",
      "checks": ["claim_matches_source", "date_correct", "status_correct", "source_tier_correct", "not_duplicate", "neutral_tone"],
      "reviewer_notes": "what was verified, what was wrong",
      "required_changes": ["only for revise: concrete edits"]
    }
  ]
}
```
`checks` lists only the checks that PASSED. An `accept` requires all six to pass.
