# backend/src/services/ai

**Project:** RADIAS · **Mirrors:** SSP-Vercel-Build/backend/src/services/ai

## Purpose

The AI layer. Everything the platform's AI boundary permits: collection, extraction, classification, reconciliation, drafting. Nothing here computes a published figure.

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| `sources.ts` | Fixture | Butler Snow public-record corpus (Act 2). Condensed summaries, **not** verbatim source text |
| `extract.ts` | Service | Citations call + streaming; ANSI helpers; error descriptions |
| `map-citations.ts` | Service | Citations → Evidence Objects; `verifyLocators()` re-slices sources to prove offsets |
| `hcb-submission.ts` | Fixture | HCB application + observed record (Act 3) |
| `reconcile.ts` | Service | Structured-output reconciliation (Act 3 stage 1) |
| `question-pack.ts` | Service | UC-V1 ranking + UC-V2 request document. No transport — by design |

Act 2 uses citations with structured outputs **off**; Act 3 uses structured
outputs with citations **off**. The two cannot be combined — see `../../../README.md`.
