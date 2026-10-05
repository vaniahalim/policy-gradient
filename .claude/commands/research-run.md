---
description: Run the research → review → edit pipeline for the AI regulation tracker
argument-hint: "[regions: europe,us,asia] [days: 30] [bootstrap]"
---

Run one research cycle for the AI regulation tracker. Arguments: `$ARGUMENTS`

Defaults: all regions (`europe`, `us`, `asia`), a 30-day window ending today (UTC), normal mode. If `bootstrap` is present, run in bootstrap mode (see `docs/research-protocol.md`).

You are the orchestrator. You coordinate and report. You do not research, review or edit facts yourself.

## Steps
1. **Set up.** Pick a run id `YYYY-MM-DD-a` (UTC date; bump the letter if `content/runs/<id>/` exists). Create `content/runs/<run-id>/`. Compute the window `from`/`to`.
2. **Research, in parallel.** In ONE message, launch one subagent per selected region: `researcher-europe`, `researcher-us`, `researcher-asia`. Give each the run id, the window, and `bootstrap` if set. Give them nothing else: no hints about what other regions found.
3. **Review, in parallel.** When all researchers finish, in ONE message launch one `reviewer` subagent per candidate file. Give each only the file path and the run id. Do not pass the researcher's summary or reasoning.
4. **Revision rounds (up to 3).** For every `revise` verdict, send the `required_changes` back to the matching researcher agent (SendMessage to the same agent if possible, otherwise a new instance with the file and changes) and then run a fresh `reviewer` on only the revised entries. Write each round's verdicts to a new file (`<region>.review2.json`, `.review3.json`, ...); never overwrite an earlier one. Repeat for entries still at `revise`, up to 3 revision rounds in total. Anything not `accept` after the last round stays unpromoted, and the report must say so.
5. **Edit.** Launch the `editor` subagent with the run id.
6. **Gate.** Run `cd site && npm run validate:links`. If it fails, show the failures and stop.
7. **Report to the human, do not commit.** Summarize: counts of accepted / revised / rejected per region, the biggest `gaps`, and the list of files added or changed under `content/`. Highlight every `confidence: low` item and every item the reviewer flagged. Ask the human to review the diff and approve before committing.

## Rules
- Never publish an item whose verdict is not `accept`.
- Never skip the reviewer step, even for a single region.
- If a researcher or reviewer fails or returns nothing, report it. Do not fill in the gap yourself.
- Do not run git commands that change history.
