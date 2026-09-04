/**
 * The Disclosure Variance Index scorer. DETERMINISTIC — no model, no network.
 *
 * This file is the other half of the AI boundary. `services/ai/reconcile.ts`
 * asks Claude which component a variance belongs to and how material it is;
 * this file turns those labels into the published number, and nothing else may.
 *
 * Same inputs always produce the same output, which is what makes UC-G3
 * ("replay any published conclusion") achievable at all.
 */

import {
  DVI_COMPONENTS,
  MATERIALITY_POINTS,
  dviBand,
  NO_QUOTE_DVI_THRESHOLD,
  type DviComponent,
  type Variance,
} from "../../models/variance.js";

export interface ComponentScore {
  component: DviComponent;
  label: string;
  /** Points before the cap is applied. */
  raw: number;
  /** Points after the cap. */
  score: number;
  cap: number;
  /** True when the cap bound the result — the component is saturated. */
  capped: boolean;
  /** Per-variance contributions, for the reason-code trail. */
  contributions: { field: string; materiality: string; points: number }[];
}

export interface DviResult {
  dvi: number;
  band: ReturnType<typeof dviBand>;
  components: ComponentScore[];
  /** Variances that reconciled cleanly and contribute nothing. */
  reconciled: string[];
  /** True when DVI crosses the posture ladder's no-quote rung. */
  blocksQuote: boolean;
  /** The scoring rule in force, recorded so a result can be replayed. */
  rule: { materialityPoints: typeof MATERIALITY_POINTS; caps: Record<string, number> };
}

/**
 * Computes the DVI from classified variances.
 *
 * Each component sums the points of its variances and is then capped. Capping
 * per component rather than globally is what makes the index interpretable: a
 * firm cannot reach 70 on practice-mix alone (cap 55), so the no-quote rung
 * always reflects divergence across at least two dimensions.
 */
export function scoreDvi(variances: Variance[]): DviResult {
  const components: ComponentScore[] = [];

  for (const key of Object.keys(DVI_COMPONENTS) as DviComponent[]) {
    const def = DVI_COMPONENTS[key];
    const rows = variances.filter((v) => v.component === key && v.materiality !== "consistent");

    const contributions = rows.map((v) => ({
      field: v.field,
      materiality: v.materiality,
      points: MATERIALITY_POINTS[v.materiality],
    }));

    const raw = contributions.reduce((a, c) => a + c.points, 0);
    const score = Math.min(def.cap, raw);

    components.push({
      component: key,
      label: def.label,
      raw,
      score,
      cap: def.cap,
      capped: raw > def.cap,
      contributions,
    });
  }

  const dvi = components.reduce((a, c) => a + c.score, 0);

  return {
    dvi,
    band: dviBand(dvi),
    components,
    reconciled: variances
      .filter((v) => v.materiality === "consistent" || v.component === "none")
      .map((v) => v.field),
    blocksQuote: dvi >= NO_QUOTE_DVI_THRESHOLD,
    rule: {
      materialityPoints: MATERIALITY_POINTS,
      caps: Object.fromEntries(
        Object.entries(DVI_COMPONENTS).map(([k, v]) => [k, v.cap]),
      ),
    },
  };
}

/**
 * The component subtotals the prototype publishes for Harrison, Cole & Bennett,
 * read from `FIRMS.hcb.dviC` in index.html. Used only to show the calibration
 * gap — never as an input to scoring.
 */
export const HCB_PUBLISHED_DVI = {
  total: 52,
  components: {
    "practice-mix": 35,
    "control-claims": 5,
    "change-not-reflected": 12,
  } as Record<DviComponent, number>,
} as const;

export interface CalibrationRow {
  component: DviComponent;
  label: string;
  computed: number;
  published: number;
  delta: number;
}

/** Lines up computed subtotals against the prototype's published ones. */
export function compareToPublished(result: DviResult): {
  rows: CalibrationRow[];
  totalDelta: number;
  sameBand: boolean;
} {
  const rows = result.components.map((c) => ({
    component: c.component,
    label: c.label,
    computed: c.score,
    published: HCB_PUBLISHED_DVI.components[c.component],
    delta: c.score - HCB_PUBLISHED_DVI.components[c.component],
  }));

  return {
    rows,
    totalDelta: result.dvi - HCB_PUBLISHED_DVI.total,
    sameBand: dviBand(result.dvi).label === dviBand(HCB_PUBLISHED_DVI.total).label,
  };
}
