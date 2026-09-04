/**
 * Offline check for the citation mapper. No API key, no network, no cost.
 *
 * Builds a synthetic response in the exact shape the citations API returns —
 * text split across blocks, cited blocks carrying a `citations` array of
 * `char_location` objects — and asserts the mapper turns it into Evidence
 * Objects with correct tiers, tier-assigned weights and verifiable offsets.
 *
 *   npx tsx tests/map-citations.offline.ts
 */

import type Anthropic from "@anthropic-ai/sdk";
import { mapCitationsToEvidence, verifyLocators } from "../src/services/ai/map-citations.js";
import { BUTLER_SNOW_SOURCES } from "../src/services/ai/sources.js";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? "\n        " + detail : ""}`);
  }
}

/** Real offsets into the real corpus, so locator verification is a genuine test. */
function locate(docIndex: number, needle: string) {
  const doc = BUTLER_SNOW_SOURCES[docIndex];
  if (!doc) throw new Error(`no source at index ${docIndex}`);
  const start = doc.text.indexOf(needle);
  if (start === -1) throw new Error(`needle not present in source ${docIndex}: ${needle}`);
  return {
    type: "char_location" as const,
    cited_text: needle,
    document_index: docIndex,
    document_title: doc.title,
    start_char_index: start,
    end_char_index: start + needle.length,
  };
}

const SANCTION = "The court publicly reprimanded three Butler Snow attorneys";
const POLICY = "the court credited the existence of Butler Snow's written artificial intelligence policy";
const SETTLE = "Butler Snow agreed to a cash payment of $9,500,000";

const message = {
  id: "msg_offline",
  type: "message",
  role: "assistant",
  model: "claude-opus-5",
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 0, output_tokens: 0 },
  content: [
    { type: "text", text: "1. " },
    {
      type: "text",
      text: "Three attorneys were publicly reprimanded for filings containing non-existent citations.",
      citations: [locate(0, SANCTION)],
    },
    {
      type: "text",
      text: " [pa: Litigation | att: Reeves; Cranford; Lunsford | rf: AI professional risk; Discipline | subj: Sanctions for fabricated citations]\n2. ",
    },
    {
      type: "text",
      text: "The court released the firm itself, crediting its written AI policy.",
      citations: [locate(0, POLICY)],
    },
    {
      type: "text",
      text: " [pa: All | att: — | rf: AI governance | subj: Policy credited, enforcement failed]\n3. ",
    },
    {
      type: "text",
      text: "The firm settled the Madison Timber receiver litigation for $9.5 million.",
      citations: [locate(4, SETTLE)],
    },
    {
      type: "text",
      text: " [pa: Corporate | att: — | rf: Prior severity history | subj: Settled seven-figure liability]\n4. ",
    },
    {
      type: "text",
      text: "This firm is widely regarded as low risk overall and should be priced accordingly.",
    },
    { type: "text", text: "\n\nOPEN\n- Loss runs beyond the public docket\n- Current tower, limits and retention\n" },
  ],
} as unknown as Anthropic.Message;

console.log("\nOffline citation-mapper check\n");

const { evidence, open, uncited, needsReview } = mapCitationsToEvidence(
  message,
  BUTLER_SNOW_SOURCES,
);

check("three cited findings became Evidence Objects", evidence.length === 3, `got ${evidence.length}`);
check("ids are sequential", evidence.map((e) => e.id).join(",") === "EV-001,EV-002,EV-003");

const [e1, e2, e3] = evidence;
check("official tier resolved from source index 0", e1?.st === "official", `got ${e1?.st}`);
check("official tier gets weight 1.0 / confidence 99", e1?.w === 1.0 && e1?.c === 99);
check("source title carried onto `src`", e1?.src.startsWith("Sanctions order"), e1?.src);
check("date carried from source, not model", e1?.d === "2025-07-23", e1?.d);
check("metadata tag parsed into pa/att/rf", e1?.pa === "Litigation" && e1?.att.includes("Reeves") && e1?.rf.includes("AI governance") === false);
check("second finding attributes AI governance", e2?.rf === "AI governance", e2?.rf);
check("third finding resolves to the Madison Timber source", e3?.src.startsWith("Madison Timber"), e3?.src);
check("cited_text preserved verbatim", e1?.citedText === SANCTION);
check("locator present", !!e1?.locator);

check(
  "uncited claim was flagged as a defect, not published",
  uncited.length === 1 && uncited[0]!.includes("low risk overall"),
  JSON.stringify(uncited),
);
check("uncited claim did NOT become an Evidence Object", !evidence.some((e) => e.body.includes("low risk overall")));
check("OPEN section parsed", open.length === 2, JSON.stringify(open));
check("no malformed metadata tags", needsReview.length === 0, JSON.stringify(needsReview));

const { verified, failed } = verifyLocators(evidence, BUTLER_SNOW_SOURCES);
check("every locator verifies against source bytes", verified === 3 && failed.length === 0, `verified ${verified}, failed ${failed.length}`);

console.log(
  failures === 0
    ? `\nAll checks passed (${evidence.length} evidence objects, ${open.length} open items, ${uncited.length} defect caught).\n`
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
