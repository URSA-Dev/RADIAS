/**
 * Offline checks for the deterministic scorer and the question pack.
 * No API key, no network, no cost.
 *
 * The scorer is the half of Act 3 that must be provably deterministic, since
 * UC-G3 promises any published conclusion can be replayed. That makes it fully
 * testable without a model, which is the point of separating it.
 *
 *   npx tsx tests/dvi.offline.ts
 */

import { scoreDvi, compareToPublished } from "../src/services/scoring/dvi.js";
import { buildQuestionPack, renderQuestionPack } from "../src/services/ai/question-pack.js";
import { MATERIALITY_POINTS, dviBand, type Variance } from "../src/models/variance.js";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? "\n        " + detail : ""}`);
  }
}

function v(p: Partial<Variance>): Variance {
  return {
    field: "F",
    disclosed: "d",
    observed: "o",
    verified: "Not verified",
    component: "practice-mix",
    materiality: "material",
    signal: "high",
    rationale: "r",
    resolvingQuestion: "",
    whyItMatters: "w",
    evidence: [],
    ...p,
  };
}

/** HCB's twelve reconciled fields, classified as the prompt should classify them. */
const HCB: Variance[] = [
  v({ field: "Litigation", component: "none", materiality: "consistent" }),
  v({ field: "Real Estate", component: "practice-mix", materiality: "material",
      resolvingQuestion: "What share of fees is real estate, and does the firm hold client funds at closing?",
      whyItMatters: "Closings carry client funds; the $250K social-engineering sublimit is small against 41 escrow matters." }),
  v({ field: "Securities", component: "practice-mix", materiality: "review",
      resolvingQuestion: "Is securities work an ongoing practice or a one-off engagement?",
      whyItMatters: "Issuer's-counsel work sits in the severity tail and changes the P95 estimate." }),
  v({ field: "Fiduciary Work", component: "practice-mix", materiality: "review",
      resolvingQuestion: "Are any of these roles currently active, and does the firm also act as counsel?",
      whyItMatters: "Fiduciary activity is commonly excluded or sublimited; the current form may not respond." }),
  v({ field: "Client Funds", component: "practice-mix", materiality: "review",
      resolvingQuestion: "Does the firm hold escrow beyond IOLTA?",
      whyItMatters: "Escrow exposure drives the crime sublimit decision." }),
  v({ field: "AI Usage", component: "control-claims", materiality: "material",
      resolvingQuestion: "Is citation verification enforced in the tool, or required by policy alone?",
      whyItMatters: "Largest controllable emerging risk; sanctions are only partly covered under the current form." }),
  v({ field: "Attorney Count", component: "change-not-reflected", materiality: "minor" }),
  v({ field: "Offices", component: "change-not-reflected", materiality: "minor" }),
  v({ field: "Lateral Hires (24 mo)", component: "change-not-reflected", materiality: "minor",
      resolvingQuestion: "Was prior-acts cover or tail purchased for the six November 2024 laterals?",
      whyItMatters: "Six laterals came from a dissolved boutique with unconfirmed prior-acts cover." }),
  v({ field: "Cyber Controls", component: "none", materiality: "consistent" }),
  v({ field: "Docketing", component: "none", materiality: "consistent" }),
  v({ field: "Conflicts", component: "none", materiality: "consistent" }),
];

console.log("\nOffline DVI scorer + question pack checks\n");

const r = scoreDvi(HCB);

// practice-mix: material 15 + review 8 + review 8 + review 8 = 39
// control-claims: material 15
// change-not-reflected: minor 4 x3 = 12
check("practice-mix subtotal is 39", r.components[0]?.score === 39, `got ${r.components[0]?.score}`);
check("control-claims subtotal is 15", r.components[1]?.score === 15, `got ${r.components[1]?.score}`);
check("change-not-reflected subtotal is 12", r.components[2]?.score === 12, `got ${r.components[2]?.score}`);
check("DVI is the sum of components", r.dvi === 39 + 15 + 12, `got ${r.dvi}`);
check("no component saturated its cap", r.components.every((c) => !c.capped));
check("band is Elevated at 66", r.band.label === "Elevated", r.band.label);
check("does not cross the no-quote threshold", r.blocksQuote === false);
check("four consistent fields recorded as reconciled", r.reconciled.length === 4, JSON.stringify(r.reconciled));
check("reason codes present for every contributing variance",
  r.components.reduce((a, c) => a + c.contributions.length, 0) === 8);
check("scoring rule is recorded on the result for replay",
  r.rule.materialityPoints.material === MATERIALITY_POINTS.material && r.rule.caps["practice-mix"] === 55);

// Determinism — the property UC-G3 depends on.
check("scoring is deterministic across repeated runs",
  JSON.stringify(scoreDvi(HCB)) === JSON.stringify(scoreDvi(HCB)));
check("scoring is order-independent",
  scoreDvi([...HCB].reverse()).dvi === r.dvi);

// Capping behaviour.
const saturate = Array.from({ length: 6 }, (_, i) =>
  v({ field: `RE-${i}`, component: "practice-mix", materiality: "material" }),
); // 6 x 15 = 90 raw
const sat = scoreDvi(saturate);
check("practice-mix caps at 55 when raw exceeds it", sat.components[0]?.score === 55 && sat.components[0]?.raw === 90);
check("capped flag set", sat.components[0]?.capped === true);
check("practice-mix alone cannot trigger no-quote", sat.blocksQuote === false, `dvi ${sat.dvi}`);

// Band boundaries.
check("band boundaries match the prototype",
  dviBand(70).label === "High" && dviBand(69).label === "Elevated" &&
  dviBand(45).label === "Elevated" && dviBand(44).label === "Moderate" &&
  dviBand(25).label === "Moderate" && dviBand(24).label === "Low");

// Calibration comparison.
const cal = compareToPublished(r);
check("calibration reports the same band as published 52", cal.sameBand === true);
check("calibration surfaces the control-claims gap as the largest",
  Math.max(...cal.rows.map((x) => Math.abs(x.delta))) === Math.abs(cal.rows[1]!.delta),
  JSON.stringify(cal.rows.map((x) => [x.component, x.delta])));

// Question pack.
const pack = buildQuestionPack(HCB, { firmName: "HCB LLP", line: "LPL", renewal: "01 Nov 2026" });
check("only open items become questions", pack.items.length === 6, `got ${pack.items.length}`);
check("consistent fields are never asked",
  !pack.items.some((i) => ["Litigation", "Docketing", "Conflicts", "Cyber Controls"].includes(i.field)));
check("material items rank above review items",
  pack.items[0]!.field === "Real Estate" || pack.items[0]!.field === "AI Usage",
  pack.items.map((i) => i.field).join(" > "));
check("structure-affecting items rank ahead of price within a tier",
  pack.items.findIndex((i) => i.affects === "structure") <
    pack.items.map((i) => i.affects).lastIndexOf("price"),
  pack.items.map((i) => `${i.field}:${i.affects}`).join(", "));
check("fields not asked are recorded with a reason", pack.notAsked.length === 6, `got ${pack.notAsked.length}`);

const doc = renderQuestionPack(pack);
check("rendered pack states disclosed and observed per item",
  doc.includes("Application reports:") && doc.includes("Public record shows:"));
check("rendered pack states the correction route", doc.toLowerCase().includes("correct the"));
check("rendered pack is issued by underwriting, not the platform",
  doc.includes("Issued by underwriting") && !/radias/i.test(doc));

console.log(
  failures === 0
    ? `\nAll checks passed. DVI ${r.dvi} (${r.band.label}), ${pack.items.length} questions, ${pack.notAsked.length} not asked.\n`
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
