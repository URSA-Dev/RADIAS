/**
 * Act 3 — "the reconciliation". Application vs public record, then the ask.
 *
 *   npm run act3                 full run
 *   npm run act3 -- --pack       print only the question pack document
 *   npm run act3 -- --json       write reconciliation.generated.json and exit
 *
 * What this act demonstrates that Act 2 does not: the AI/quant boundary in
 * operation. Claude classifies each variance; a deterministic scorer computes
 * the index. The two stages are printed separately, on purpose.
 */

import { writeFileSync } from "node:fs";
import { BOLD, DIM, RESET, TEAL, AMBER, RED, describeError } from "../src/services/ai/extract.js";
import { reconcileSubmission } from "../src/services/ai/reconcile.js";
import { HCB_APPLICATION, HCB_OBSERVED } from "../src/services/ai/hcb-submission.js";
import { buildQuestionPack, renderQuestionPack } from "../src/services/ai/question-pack.js";
import { scoreDvi, compareToPublished, HCB_PUBLISHED_DVI } from "../src/services/scoring/dvi.js";
import { NO_QUOTE_DVI_THRESHOLD } from "../src/models/variance.js";

const argv = process.argv.slice(2);
const packOnly = argv.includes("--pack");
const asJson = argv.includes("--json");

function rule(label = "") {
  const plain = label.replace(/\[[0-9;]*m/g, "");
  console.log(DIM + (label ? label + " " : "") + "─".repeat(Math.max(0, 76 - plain.length - (label ? 1 : 0))) + RESET);
}
function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
function sevColor(m: string) {
  return m === "material" ? RED : m === "review" ? AMBER : m === "minor" ? TEAL : DIM;
}

async function main() {
  if (!packOnly && !asJson) {
    console.log();
    rule(BOLD + "RADIAS · Act 3 — application vs. public record" + RESET);
    console.log(
      `${DIM}Subject:${RESET} ${HCB_APPLICATION.firmName}   ${DIM}(fictional — scoring permitted)${RESET}`,
    );
    console.log(
      `${DIM}Line:${RESET} ${HCB_APPLICATION.line}   ${DIM}Renewal:${RESET} ${HCB_APPLICATION.renewal}`,
    );
    console.log(
      `${DIM}Declared fields:${RESET} ${HCB_APPLICATION.practiceMix.length + HCB_APPLICATION.declarations.length}   ` +
        `${DIM}Observed subjects:${RESET} ${HCB_OBSERVED.findings.length}   ` +
        `${DIM}Timeline events:${RESET} ${HCB_OBSERVED.timeline.length}`,
    );
    rule();
    console.log(`${DIM}Stage 1 — Claude classifies each variance. No numbers.${RESET}\n`);
  }

  const { reconciliation, variances, usage } = await reconcileSubmission();

  if (asJson) {
    const out = "reconciliation.generated.json";
    writeFileSync(out, JSON.stringify(reconciliation, null, 2));
    console.log(`Wrote ${variances.length} variances to ${out}`);
    return;
  }

  const pack = buildQuestionPack(variances, {
    firmName: HCB_APPLICATION.firmName,
    line: HCB_APPLICATION.line,
    renewal: HCB_APPLICATION.renewal,
  });

  if (packOnly) {
    console.log("\n" + renderQuestionPack(pack) + "\n");
    return;
  }

  // ── Stage 1 output ────────────────────────────────────────────────────────
  console.log(`  ${BOLD}${reconciliation.headline}${RESET}\n`);

  const diverging = variances.filter((v) => v.materiality !== "consistent");
  const agreeing = variances.filter((v) => v.materiality === "consistent");

  rule(BOLD + "Variances" + RESET);
  for (const v of diverging) {
    console.log(
      `${sevColor(v.materiality)}${BOLD}${v.materiality.toUpperCase().padEnd(10)}${RESET}` +
        `${BOLD}${v.field}${RESET}  ${DIM}${v.component} · signal ${v.signal}${RESET}`,
    );
    console.log(`           ${DIM}application${RESET}  ${truncate(v.disclosed, 62)}`);
    console.log(`           ${DIM}record${RESET}       ${truncate(v.observed, 62)}`);
    if (v.verified && v.verified !== "Not verified") {
      console.log(`           ${DIM}verified${RESET}     ${truncate(v.verified, 62)}`);
    }
    console.log(`           ${DIM}why${RESET}          ${truncate(v.whyItMatters, 62)}`);
    console.log(`           ${DIM}evidence${RESET}     ${v.evidence.join(", ") || "—"}`);
    console.log();
  }

  if (agreeing.length) {
    rule(BOLD + "Checked and consistent" + RESET);
    for (const v of agreeing) {
      console.log(`  ${TEAL}ok${RESET}  ${v.field.padEnd(26)} ${DIM}${truncate(v.rationale, 46)}${RESET}`);
    }
    console.log(
      `\n  ${DIM}Printed because absence of a finding is information. A reader must see` +
        `\n  what was checked and found sound, not only what diverged.${RESET}\n`,
    );
  }

  // ── Stage 2: deterministic ────────────────────────────────────────────────
  rule(BOLD + "Stage 2 — deterministic scorer (no model)" + RESET);
  const result = scoreDvi(variances);

  for (const c of result.components) {
    const bar = "█".repeat(Math.round((c.score / c.cap) * 24)).padEnd(24, "·");
    console.log(
      `  ${c.label.padEnd(28)} ${DIM}${bar}${RESET} ` +
        `${String(c.score).padStart(2)}${DIM}/${c.cap}${RESET}` +
        (c.capped ? `  ${AMBER}capped from ${c.raw}${RESET}` : ""),
    );
    for (const k of c.contributions) {
      console.log(`      ${DIM}${k.field} · ${k.materiality} · +${k.points}${RESET}`);
    }
  }

  const bandColor =
    result.band.severity === "high" ? RED : result.band.severity === "elevated" ? AMBER : TEAL;
  console.log(
    `\n  ${BOLD}DVI ${result.dvi}${RESET}  ${bandColor}${result.band.label}${RESET}` +
      `   ${DIM}no-quote threshold ${NO_QUOTE_DVI_THRESHOLD}${RESET}`,
  );
  console.log(
    result.blocksQuote
      ? `  ${RED}Crosses the threshold — posture short-circuits to "Do not quote on this submission".${RESET}`
      : `  ${DIM}Below the threshold — pricing arithmetic proceeds.${RESET}`,
  );

  // ── Calibration gap ───────────────────────────────────────────────────────
  console.log();
  rule(BOLD + "Calibration against the prototype" + RESET);
  const cal = compareToPublished(result);
  console.log(`  ${DIM}component                      computed   published   delta${RESET}`);
  for (const r of cal.rows) {
    const sign = r.delta > 0 ? "+" : "";
    const dc = r.delta === 0 ? TEAL : Math.abs(r.delta) >= 10 ? RED : AMBER;
    console.log(
      `  ${r.label.padEnd(28)} ${String(r.computed).padStart(6)} ${String(r.published).padStart(11)} ` +
        `${dc}${(sign + r.delta).padStart(7)}${RESET}`,
    );
  }
  console.log(
    `  ${DIM}${"total".padEnd(28)}${RESET} ${String(result.dvi).padStart(6)} ` +
      `${String(HCB_PUBLISHED_DVI.total).padStart(11)} ` +
      `${cal.totalDelta === 0 ? TEAL : AMBER}${((cal.totalDelta > 0 ? "+" : "") + cal.totalDelta).padStart(7)}${RESET}`,
  );
  console.log(
    `\n  Band agreement: ${cal.sameBand ? TEAL + "same band" : AMBER + "DIFFERENT band"}${RESET}` +
      `${DIM} — the band, not the point value, drives the posture ladder.${RESET}`,
  );
  console.log(
    `  ${DIM}The scorer's weights were NOT fitted to reproduce ${HCB_PUBLISHED_DVI.total}. The gap is real and` +
      `\n  is open question 7: are the prototype's constants illustrative or intended` +
      `\n  calibration? Largest per-component gap points at where to look first.${RESET}`,
  );

  // ── UC-V2 ─────────────────────────────────────────────────────────────────
  console.log();
  rule(BOLD + "Question pack" + RESET);
  console.log(
    `  ${pack.items.length} question(s) earned a place; ${pack.notAsked.length} field(s) deliberately not asked.\n`,
  );
  for (const it of pack.items) {
    const tag = it.affects === "structure" ? AMBER + "structure" : DIM + "price";
    console.log(`  ${BOLD}${it.n}.${RESET} ${it.question}  ${tag}${RESET}`);
  }
  console.log(`\n  ${DIM}Full document: npm run act3 -- --pack${RESET}`);

  if (reconciliation.coverageNote) {
    console.log();
    rule(BOLD + "Coverage" + RESET);
    console.log(`  ${reconciliation.coverageNote}`);
    console.log(`\n  ${DIM}Published so a quiet record is not mistaken for a clean one.${RESET}`);
  }

  console.log();
  rule(BOLD + "Usage" + RESET);
  console.log(
    `  ${DIM}input${RESET} ${usage.input_tokens}   ${DIM}output${RESET} ${usage.output_tokens}` +
      `   ${DIM}variances${RESET} ${variances.length}`,
  );
  console.log();
}

main().catch((error) => {
  console.error(`\n${RED}${BOLD}Act 3 failed.${RESET}\n${describeError(error)}\n`);
  process.exit(1);
});
