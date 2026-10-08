# Design tokens: Policy Gradient

Direction (user-set, 2026-10-06): a globe made of paper documents; bold type; warm paper, ink, legal and woody palette. Inspired by the mood of oumahi.art (dossier / file language). No fonts, code or imagery are copied from it.

## Colors
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Desk (background) | --color-walnut | #2a1c13 | Page background, with a faint wood grain |
| Desk, deep | --color-walnut-deep | #1a110b | Vignette, panel shadows |
| Paper | --color-paper | #eadfc4 | Default sheet |
| Paper, aged | --color-paper-aged | #dfcfab | Alternate sheet tint |
| Paper, pale | --color-paper-pale | #f0e8d3 | Alternate sheet tint, panel |
| Ink | --color-ink | #1d1712 | Text on paper |
| Ink, soft | --color-ink-soft | #5a4a3a | Secondary text on paper |
| Oxblood | --color-oxblood | #8a2a1d | "In force" stamp, seal, focus ring on paper |
| Legal-pen blue | --color-pen | #274a73 | "Proposed" and "Consultation" stamps |
| Brass (text) | --color-brass | #70520f | "Passed" and "Amended" stamps (text on paper) |
| Brass (fill) | --color-brass-fill | #b58a2e | Fills only, with ink text on top |
| Text on desk | --color-on-desk | #eadfc4 | Text over walnut |

Contrast checks (approx.): ink on paper 12:1; oxblood on paper 6:1; pen blue on paper 7:1; brass text on paper 5.5:1 (4.7:1 on aged paper); paper on walnut 10:1. Re-verify with a tool before launch.

## Typography
- Display: Archivo, width axis 125 (extended), weight 800. Wordmark, sheet titles, nav, stamps.
- Body: Source Serif 4, 400/600, line-height 1.6. Summaries and legal detail.
- Scale (px): 11 stamp / 13 small / 17 body / 22 panel subhead / clamp(34, 5vw, 64) wordmark.
- Capitals only on stamps. Everything else sentence case.

## Spacing
- Base 4px. Scale: xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2xl 48.

## Radius
- Sheet: 2px. Pill button: 999px. Panel: 3px.

## Shadows
- sm (sheet at rest): 0 10px 18px -8px rgba(0,0,0,.6)
- md (lifted sheet): 0 22px 34px -10px rgba(0,0,0,.7)
- lg (panel): 0 30px 60px -20px rgba(0,0,0,.8)

## Motion
- Ease: cubic-bezier(.22,1,.36,1). Lift 0.35s. Region spin 1.1s.
- prefers-reduced-motion: no idle drift, no hover-steering, region buttons jump instantly.
