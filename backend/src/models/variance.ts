/**
 * Disclosure variance model (UC-C4) and the Disclosure Variance Index.
 *
 * The split in this file IS the architecture:
 *
 *   CLASSIFICATION  — which component, how material   → the model may decide
 *   SCORING         — points, subtotals, the index    → the model may NOT decide
 *
 * The platform's AI boundary states it plainly: "AI is never permitted to set
 * the variance index, readiness score, or any published figure." So the model
 * emits labels and the scorer in `services/scoring/dvi.ts` turns labels into
 * numbers, deterministically.
 */

/** The three DVI components and their maximum contributions, from the prototype. */
export const DVI_COMPONENTS = {
  "practice-mix": {
    cap: 55,
    label: "Practice-mix divergence",
    describes: "Disclosed practice shares against observed shares",
  },
  "control-claims": {
    cap: 25,
    label: "Control claims unsupported",
    describes: "Claimed controls with no public support",
  },
  "change-not-reflected": {
    cap: 20,
    label: "Change not reflected",
    describes: "Offices, laterals, combinations post-dating the application",
  },
} as const;

export type DviComponent = keyof typeof DVI_COMPONENTS;

/** Components sum to 100 by construction. Asserted at import so a bad edit fails loudly. */
const CAP_TOTAL = Object.values(DVI_COMPONENTS).reduce((a, c) => a + c.cap, 0);
if (CAP_TOTAL !== 100) {
  throw new Error(`DVI component caps must sum to 100, got ${CAP_TOTAL}`);
}

export type Materiality = "material" | "review" | "minor" | "consistent";
export type Signal = "high" | "medium" | "low";

/**
 * Points contributed by one variance, by materiality.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ THESE ARE DEMO WEIGHTS, NOT CALIBRATED VALUES.                          │
 * │                                                                         │
 * │ The prototype publishes component subtotals for Harrison, Cole &        │
 * │ Bennett (practice-mix 35, control-claims 5, change 12 → DVI 52) but     │
 * │ does not expose the rule that produced them. This table is a            │
 * │ transparent stand-in chosen for explainability, not fitted to           │
 * │ reproduce 52 — deliberately, because tuning a rule to hit a known       │
 * │ answer is the failure mode this whole platform exists to detect.        │
 * │                                                                         │
 * │ Act 3 prints computed subtotals beside the published ones so the        │
 * │ calibration gap is visible per component. See open question 7 in the    │
 * │ use case model.                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const MATERIALITY_POINTS: Record<Materiality, number> = {
  material: 15,
  review: 8,
  minor: 4,
  consistent: 0,
};

/** One reconciled line item: what was disclosed, what the record shows, how it is classified. */
export interface Variance {
  /** Application field, e.g. "Real Estate" or "AI Usage". */
  field: string;
  /** Value as disclosed on the application. */
  disclosed: string;
  /** Value as observed in public evidence. */
  observed: string;
  /** Value where independently verified, or "Not verified". */
  verified: string;
  /** Which DVI component this feeds. "none" for items that reconcile cleanly. */
  component: DviComponent | "none";
  materiality: Materiality;
  signal: Signal;
  /** Why the classification, in one sentence. */
  rationale: string;
  /** The single question that would settle it. Empty when nothing is open. */
  resolvingQuestion: string;
  /** Underwriting consequence — why this changes price, structure or coverage. */
  whyItMatters: string;
  /** Evidence IDs supporting the observed value. */
  evidence: string[];
}

/** Band boundaries from the prototype's `idxBand()`. */
export function dviBand(v: number): { label: string; severity: "low" | "moderate" | "elevated" | "high" } {
  if (v >= 70) return { label: "High", severity: "high" };
  if (v >= 45) return { label: "Elevated", severity: "elevated" };
  if (v >= 25) return { label: "Moderate", severity: "moderate" };
  return { label: "Low", severity: "low" };
}

/**
 * The posture ladder's second rung: DVI >= 70 short-circuits to "Do not quote
 * on this submission" before any pricing arithmetic runs. Exposed here so the
 * demo can state whether the computed index crosses it.
 */
export const NO_QUOTE_DVI_THRESHOLD = 70;
