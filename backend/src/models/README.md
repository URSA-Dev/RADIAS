# backend/src/models

**Project:** RADIAS · **Mirrors:** SSP-Vercel-Build/backend/src/models

## Purpose

Domain types shared across services. Types and policy tables only — no I/O, no model calls.

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| `evidence.ts` | Types | Evidence Object shape; `TIER_POLICY` mapping source tier → weight and confidence |
| `variance.ts` | Types | Variance model; DVI components and caps (55/25/20); materiality point weights; band boundaries |

Both files hold the numbers the model is forbidden to produce. Weight, confidence
and index points live here so they are assigned deterministically.
