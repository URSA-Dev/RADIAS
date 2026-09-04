/**
 * Act 3 — application-vs-record reconciliation (UC-C4).
 *
 * Complementary to Act 2 by design:
 *
 *   Act 2  free text in  →  citations on,  structured outputs OFF (they conflict)
 *   Act 3  structured in →  citations off, structured outputs ON
 *
 * Act 3's inputs are already structured, so there is nothing to cite into and
 * the 400 that pairs citations with `output_config.format` never arises. That
 * frees us to constrain the response to a schema — which is what makes the
 * output safe to hand to a deterministic scorer.
 *
 * The model classifies. It does not score. The schema below has no field for a
 * number the model could invent.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { HCB_APPLICATION, HCB_OBSERVED, type ApplicationSubmission, type ObservedRecord } from "./hcb-submission.js";
import type { Variance } from "../../models/variance.js";

const MODEL = "claude-opus-5";

/**
 * Response schema. Note what is absent: no points, no index, no confidence
 * percentage, no expected loss. The model cannot emit a published figure
 * because there is nowhere to put one.
 */
const VarianceSchema = z.object({
  field: z.string().describe("The application field or subject being reconciled"),
  disclosed: z.string().describe("Value exactly as the application states it"),
  observed: z.string().describe("Value as public evidence shows it"),
  verified: z.string().describe("Independently verified value, or 'Not verified'"),
  component: z
    .enum(["practice-mix", "control-claims", "change-not-reflected", "none"])
    .describe(
      "Which DVI component this feeds. practice-mix = disclosed vs observed practice shares. control-claims = a control the firm claims but public evidence does not support. change-not-reflected = headcount, offices or laterals that post-date the application. none = reconciles cleanly.",
    ),
  materiality: z
    .enum(["material", "review", "minor", "consistent"])
    .describe(
      "material = changes how the risk should be priced or structured. review = needs an answer before pricing but may resolve benignly. minor = real but not pricing-relevant on its own. consistent = application and record agree.",
    ),
  signal: z.enum(["high", "medium", "low"]).describe("Strength of the underlying public evidence"),
  rationale: z.string().describe("One sentence: why this classification"),
  resolvingQuestion: z
    .string()
    .describe("The single question that would settle this item. Empty string if nothing is open."),
  whyItMatters: z
    .string()
    .describe("Underwriting consequence — what this changes about price, structure or coverage response"),
  evidence: z.array(z.string()).describe("Evidence IDs supporting the observed value"),
});

const ReconciliationSchema = z.object({
  variances: z.array(VarianceSchema),
  headline: z.string().describe("One sentence an underwriter would read first"),
  coverageNote: z
    .string()
    .describe("Where the public record is thin for this firm, so a quiet record is not read as a clean one"),
});

export type Reconciliation = z.infer<typeof ReconciliationSchema>;

const SYSTEM_PROMPT = `You reconcile a law firm's insurance application against an independently compiled public record, for a Lawyers Professional Liability underwriter.

You are the comparison layer. A separate deterministic engine owns every published number.

HARD RULES:

1. Produce NO scores, indices, weights, confidence percentages, probabilities, premiums or loss figures. Not in any field. If a number appears in your output it must be a figure quoted from the application or the observed record (a practice share, a headcount, a date), never one you derived.

2. Reconcile every field the application declares, including the ones that AGREE. An item that reconciles cleanly is classified component "none", materiality "consistent" — this matters, because a reader must be able to see what was checked and found sound, not only what diverged.

3. Variance is not dishonesty. Divergence may reflect decentralized firm data, an ambiguous application question, or change since the application date. Say which is plausible in the rationale. Never impute intent.

4. Separate a control's EXISTENCE from its ENFORCEMENT. A written policy that public evidence cannot show is enforced is an unsupported control claim, not a satisfied control. This distinction is the single most important judgment you make.

5. Only what public evidence could not resolve becomes a resolvingQuestion. If the record settles a point, leave resolvingQuestion empty — do not manufacture a question for something already answered. Never write a generic application question.

6. Classify by cause, not by topic. A new office is "change-not-reflected" even though it also affects practice mix; the test is what made the application wrong.

Assign materiality on underwriting consequence alone: would an underwriter price, structure, or condition this risk differently if this item were true as observed?`;

function buildPrompt(app: ApplicationSubmission, obs: ObservedRecord): string {
  return [
    "APPLICATION AS SUBMITTED",
    "```json",
    JSON.stringify(app, null, 2),
    "```",
    "",
    "OBSERVED RECORD, COMPILED FROM PUBLIC AND FIRM-AUTHORIZED SOURCES",
    "```json",
    JSON.stringify(obs, null, 2),
    "```",
    "",
    "Reconcile these two, field by field. Return every declared field, whether it diverges or agrees.",
  ].join("\n");
}

export interface ReconcileResult {
  reconciliation: Reconciliation;
  variances: Variance[];
  usage: Anthropic.Usage;
}

export async function reconcileSubmission(
  app: ApplicationSubmission = HCB_APPLICATION,
  obs: ObservedRecord = HCB_OBSERVED,
): Promise<ReconcileResult> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(app, obs) }],
    output_config: { format: zodOutputFormat(ReconciliationSchema) },
  });

  if (response.stop_reason === "refusal") {
    const d = response.stop_details;
    throw new Error(
      `Model declined this request (category: ${d?.category ?? "unknown"}). ${d?.explanation ?? ""}`,
    );
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(
      "Response did not parse against the schema. stop_reason=" +
        response.stop_reason +
        (response.stop_reason === "max_tokens"
          ? " — the response was truncated; raise max_tokens."
          : ""),
    );
  }

  return {
    reconciliation: parsed,
    variances: parsed.variances as Variance[],
    usage: response.usage,
  };
}
