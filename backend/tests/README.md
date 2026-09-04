# backend/tests

**Project:** RADIAS · **Mirrors:** SSP-Vercel-Build/backend/tests

## Purpose

Offline checks. No API key, no network, no cost — they exercise the deterministic half of each act.

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| `map-citations.offline.ts` | Test | 16 checks: citation → Evidence Object mapping, tier policy, locator verification, uncited-claim rejection |
| `dvi.offline.ts` | Test | 26 checks: component subtotals, capping, determinism, order-independence, band boundaries, question-pack ranking |

Run both with `npm run test:offline`. Stage 1 of each act calls the API and is
**not** covered here.
