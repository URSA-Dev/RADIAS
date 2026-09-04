# backend/src/services/scoring

**Project:** RADIAS · **Mirrors:** _nothing — RADIAS-specific, no SSP counterpart_

## Purpose

The deterministic engine. No model calls, no network. Same inputs plus same rule version always produce the same output, which is what makes replay (UC-G3) achievable.

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| `dvi.ts` | Engine | Disclosure Variance Index scorer; per-component capping; calibration comparison against the prototype's published subtotals |

This directory is not part of the SSP mirror. It exists because the AI boundary
requires published figures to be computed outside the AI layer.
