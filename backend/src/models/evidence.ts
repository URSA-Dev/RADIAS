/**
 * Evidence Object — the atom of a RADIAS assessment.
 *
 * Field names deliberately match the `EVIDENCE` array in index.html so extracted
 * objects can be pasted straight into the prototype and render without mapping.
 */

/** Source tier. Drives permitted language (the "language ladder") and scoring weight. */
export type SourceTier =
  | "official" // court records, bar registers, SEC/GAO filings — highest authority
  | "verified" // firm-authorized private export, metadata only
  | "third" //    press, directories, third-party reporting
  | "firm"; //    the firm's own statements about itself

export interface EvidenceObject {
  /** Stable citation handle referenced by reason codes, e.g. "EV-001". */
  id: string;
  /** Named source. */
  src: string;
  /** Source tier. */
  st: SourceTier;
  /** Validity date or range as published, e.g. "2025-07-23" or "2025-08 → 2026-04". */
  d: string;
  /** What the item is about. */
  subj: string;
  /** Practice-area attribution, or "All". */
  pa: string;
  /** Attorney attribution, "All", or "—". */
  att: string;
  /** Risk factors this item feeds, semicolon-separated. */
  rf: string;
  /** Scoring weight, 0–1. Assigned by tier policy — never by the model. */
  w: number;
  /** Confidence percentage, 0–100. Assigned by tier policy — never by the model. */
  c: number;
  /** What this item establishes. */
  rel: string;
  /** Narrative detail, including corroboration. */
  body: string;
  /** Source locator. */
  link: string;
  /** Exact passage the claim rests on, returned by the citations API. Verbatim. */
  citedText: string;
  /** Character offsets into the source document. Lets a reviewer find the passage. */
  locator: { startChar: number; endChar: number } | null;
}

/**
 * Tier policy: weight and confidence are a deterministic function of source tier,
 * NOT a model output.
 *
 * This is a hard constraint from the platform's own AI boundary — "AI is never
 * permitted to set the variance index, readiness score, or any published figure."
 * The model extracts and cites; this table assigns the numbers. Ranges are taken
 * from the observed tier→weight relationship in the prototype's EVIDENCE array
 * (judicial order w 1.0 / c 99; bar records w 0.95 / c 98; firm AI policy
 * statement w 0.4 / c 70).
 *
 * These are the prototype's illustrative values. Replace with calibrated figures
 * before any non-demo use — see open question 7 in the use case model.
 */
export const TIER_POLICY: Record<SourceTier, { w: number; c: number; label: string }> = {
  official: { w: 1.0, c: 99, label: "Official record" },
  verified: { w: 1.0, c: 97, label: "Firm-authorized (verified)" },
  third: { w: 0.6, c: 90, label: "Third-party reporting" },
  firm: { w: 0.4, c: 72, label: "Firm's own statement" },
};

/**
 * Language ladder tier for a given source tier.
 *
 * Tier 1 (official) may be stated in the indicative. Everything else must be
 * attributed or hedged. Enforced at render time, not here — but carried on the
 * object so the renderer has what it needs.
 */
export function languageTier(st: SourceTier): 1 | 2 {
  return st === "official" || st === "verified" ? 1 : 2;
}
