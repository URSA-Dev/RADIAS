/**
 * The verification question pack (UC-V1 + UC-V2).
 *
 * UC-V1 ranks the unknowns that actually move price. UC-V2 drafts the request.
 * Both are deterministic here: the questions were already written by the
 * reconciliation step, so building the pack is selection and ordering, not
 * generation. No second model call.
 *
 * Two constraints from the platform's own rules are enforced in code:
 *
 *   FIRM NON-INTERACTION — this module returns text. It has no transport, no
 *   recipient field and no send function. The platform never contacts a firm;
 *   underwriting issues the request under its own name, through the renewal.
 *   Do not add a send path here.
 *
 *   NO GENERIC QUESTIONS — an item earns a place only if public evidence left
 *   it open AND resolving it would change price, structure or coverage. Items
 *   the record already settles stay measured, not asked.
 */

import type { Variance } from "../../models/variance.js";

export interface QuestionItem {
  n: number;
  field: string;
  question: string;
  /** What the application says. */
  disclosed: string;
  /** What the record shows. */
  observed: string;
  /** Why underwriting is asking — stated to the firm, not kept internal. */
  why: string;
  evidence: string[];
  /** Whether resolving this changes structure/coverage or only rate. */
  affects: "structure" | "price";
}

export interface QuestionPack {
  firmName: string;
  line: string;
  renewal: string;
  items: QuestionItem[];
  /** Items deliberately NOT asked, with the reason. Shows restraint is a choice. */
  notAsked: { field: string; reason: string }[];
}

/**
 * Ranking: material before review, and within a tier, structure before price.
 *
 * Structure-affecting items rank first because they can make a risk unwritable
 * on the current form, whereas a rate question only changes the number.
 */
const MATERIALITY_RANK: Record<string, number> = { material: 0, review: 1, minor: 2, consistent: 3 };

/**
 * Heuristic split between structure and price effects.
 *
 * Coverage-response language — exclusions, sublimits, endorsements, fiduciary
 * roles, client funds — points at structure. Everything else defaults to price.
 * A real implementation would take this from the scenario-to-coverage map
 * rather than keywords; flagged rather than hidden.
 */
function affectsOf(v: Variance): "structure" | "price" {
  const t = `${v.field} ${v.whyItMatters}`.toLowerCase();
  const structural = [
    "exclu", "sublimit", "endorse", "fiduciary", "trustee", "executor",
    "client funds", "escrow", "coverage", "form may not respond", "not respond",
  ];
  return structural.some((k) => t.includes(k)) ? "structure" : "price";
}

export function buildQuestionPack(
  variances: Variance[],
  meta: { firmName: string; line: string; renewal: string },
): QuestionPack {
  const open = variances.filter(
    (v) => v.resolvingQuestion.trim().length > 0 && v.materiality !== "consistent",
  );

  const ranked = [...open].sort((a, b) => {
    const m = (MATERIALITY_RANK[a.materiality] ?? 9) - (MATERIALITY_RANK[b.materiality] ?? 9);
    if (m !== 0) return m;
    const aStruct = affectsOf(a) === "structure" ? 0 : 1;
    const bStruct = affectsOf(b) === "structure" ? 0 : 1;
    return aStruct - bStruct;
  });

  const items: QuestionItem[] = ranked.map((v, i) => ({
    n: i + 1,
    field: v.field,
    question: v.resolvingQuestion,
    disclosed: v.disclosed,
    observed: v.observed,
    why: v.whyItMatters,
    evidence: v.evidence,
    affects: affectsOf(v),
  }));

  const notAsked = variances
    .filter((v) => !v.resolvingQuestion.trim() || v.materiality === "consistent")
    .map((v) => ({
      field: v.field,
      reason:
        v.materiality === "consistent"
          ? "Application and record agree — measured, not asked."
          : "Public evidence resolved it — no question needed.",
    }));

  return { ...meta, items, notAsked };
}

/**
 * Renders the pack as the request document underwriting would send.
 *
 * Deliberately plain text: this is meant to be pasted into a renewal email by
 * a human, under their own name. It is not addressed to the firm by this
 * system, and contains no sender identity of its own.
 */
export function renderQuestionPack(pack: QuestionPack): string {
  const L: string[] = [];
  L.push(`VERIFICATION REQUEST — ${pack.firmName}`);
  L.push(`${pack.line} · Renewal ${pack.renewal}`);
  L.push("");
  L.push(
    "The following items are points where our file and the public record differ, or where",
  );
  L.push(
    "the record is incomplete. Each states what the application reports, what we observe,",
  );
  L.push(
    "and why we are asking. Where our observation is wrong, tell us and we will correct the",
  );
  L.push("record and note the correction.");
  L.push("");

  for (const it of pack.items) {
    L.push(`${it.n}. ${it.question}`);
    L.push(`   Application reports:  ${it.disclosed}`);
    L.push(`   Public record shows:  ${it.observed}`);
    L.push(`   Why we ask:           ${it.why}`);
    L.push(`   Reference:            ${it.evidence.join(", ") || "—"}  (${it.affects})`);
    L.push("");
  }

  if (!pack.items.length) {
    L.push("No open items. The record resolved every declared field.");
    L.push("");
  }

  L.push("— Issued by underwriting. Please reply on this thread; your broker is copied.");
  return L.join("\n");
}
