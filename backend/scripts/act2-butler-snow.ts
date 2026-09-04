/**
 * Act 2 — "the scan". Public record in, cited Evidence Objects out.
 *
 *   npm run act2              full run
 *   npm run act2 -- --quiet   skip the streaming pass, print the table only
 *   npm run act2 -- --json    emit the EVIDENCE array for index.html and exit
 *
 * Stage note: the streaming pass is the part an audience watches. The table and
 * the locator verification are the part a skeptic checks.
 */

import { writeFileSync } from "node:fs";
import {
  extractPublicRecord,
  describeError,
  BOLD,
  DIM,
  RESET,
  TEAL,
  AMBER,
  RED,
} from "../src/services/ai/extract.js";
import { mapCitationsToEvidence, verifyLocators } from "../src/services/ai/map-citations.js";
import { BUTLER_SNOW_SOURCES } from "../src/services/ai/sources.js";
import { TIER_POLICY } from "../src/models/evidence.js";

const argv = process.argv.slice(2);
const quiet = argv.includes("--quiet");
const asJson = argv.includes("--json");

function rule(label = "") {
  const line = "─".repeat(Math.max(0, 74 - label.length - (label ? 1 : 0)));
  console.log(DIM + (label ? label + " " : "") + line + RESET);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

async function main() {
  if (!asJson) {
    console.log();
    rule(BOLD + "RADIAS · Act 2 — public-record scan" + RESET);
    console.log(
      `${DIM}Subject:${RESET} Butler Snow LLP    ` +
        `${DIM}Sources:${RESET} ${BUTLER_SNOW_SOURCES.length}    ` +
        `${DIM}Mode:${RESET} case (public record only — no scores)`,
    );
    for (const s of BUTLER_SNOW_SOURCES) {
      const p = TIER_POLICY[s.tier];
      console.log(
        `  ${DIM}·${RESET} ${truncate(s.title, 52).padEnd(53)} ` +
          `${DIM}${p.label}  w ${p.w}  c ${p.c}${RESET}`,
      );
    }
    rule();
    console.log(
      `${DIM}Extracting. Each ${RESET}*${DIM} is a claim being bound to a source passage.${RESET}\n`,
    );
  }

  const { message, sources, usage } = await extractPublicRecord(
    BUTLER_SNOW_SOURCES,
    quiet || asJson ? () => {} : (t) => process.stdout.write(t),
  );

  const { evidence, open, uncited, needsReview } = mapCitationsToEvidence(message, sources);

  if (asJson) {
    // Shape matches the EVIDENCE array in index.html.
    const forPrototype = evidence.map((e) => ({
      id: e.id, src: e.src, st: e.st, d: e.d, subj: e.subj, pa: e.pa,
      att: e.att, rf: e.rf, w: e.w, c: e.c, rel: e.rel, body: e.body, link: e.link,
    }));
    const out = "evidence.generated.json";
    writeFileSync(out, JSON.stringify(forPrototype, null, 2));
    console.log(`Wrote ${forPrototype.length} evidence objects to ${out}`);
    return;
  }

  console.log("\n");
  rule(BOLD + "Evidence Objects" + RESET);
  for (const e of evidence) {
    const tierColor = e.st === "official" || e.st === "verified" ? TEAL : AMBER;
    console.log(
      `${BOLD}${e.id}${RESET}  ${tierColor}${e.st.padEnd(8)}${RESET} ` +
        `${DIM}w ${e.w.toFixed(2)}  c ${e.c}  ${e.d}${RESET}`,
    );
    console.log(`      ${e.subj}`);
    console.log(`      ${DIM}src${RESET}  ${truncate(e.src, 62)}`);
    console.log(`      ${DIM}pa${RESET}   ${e.pa}   ${DIM}att${RESET} ${e.att}`);
    console.log(`      ${DIM}rf${RESET}   ${e.rf}`);
    console.log(`      ${DIM}cited${RESET} "${truncate(e.citedText, 88)}"`);
    if (e.locator) {
      console.log(`      ${DIM}chars ${e.locator.startChar}–${e.locator.endChar}${RESET}`);
    }
    console.log();
  }

  const { verified, failed } = verifyLocators(evidence, sources);
  rule(BOLD + "Verification" + RESET);
  console.log(
    `  Citations whose offsets match the source bytes exactly: ` +
      `${verified === evidence.length ? TEAL : AMBER}${verified}/${evidence.length}${RESET}`,
  );
  if (failed.length) {
    console.log(`  ${AMBER}Unverified:${RESET} ${failed.map((f) => f.id).join(", ")}`);
    console.log(
      `  ${DIM}A mismatch usually means the citation spans chunk boundaries — ` +
        `inspect before trusting the offsets.${RESET}`,
    );
  }

  if (open.length) {
    console.log();
    rule(BOLD + "What the record cannot establish" + RESET);
    for (const o of open) console.log(`  ${DIM}?${RESET} ${o}`);
    console.log(
      `\n  ${DIM}These are UC-V1 candidates: unknowns that would become the ` +
        `question pack, not findings.${RESET}`,
    );
  }

  if (uncited.length) {
    console.log();
    rule(RED + BOLD + "Uncited claims — defects" + RESET);
    for (const u of uncited) console.log(`  ${RED}!${RESET} ${truncate(u, 96)}`);
    console.log(
      `\n  ${DIM}The prompt requires a citation per claim. Anything here was ` +
        `asserted without one and must not reach a published finding.${RESET}`,
    );
  }
  if (needsReview.length) {
    console.log(`\n  ${AMBER}${needsReview.length} finding(s) had a malformed metadata tag.${RESET}`);
  }

  console.log();
  rule(BOLD + "Usage" + RESET);
  console.log(
    `  ${DIM}input${RESET} ${usage.input_tokens}   ` +
      `${DIM}output${RESET} ${usage.output_tokens}   ` +
      `${DIM}cache read${RESET} ${usage.cache_read_input_tokens ?? 0}`,
  );
  console.log(
    `  ${DIM}cited_text does not count toward output tokens.${RESET}`,
  );
  console.log();
}

main().catch((error) => {
  console.error(`\n${RED}${BOLD}Act 2 failed.${RESET}\n${describeError(error)}\n`);
  process.exit(1);
});
