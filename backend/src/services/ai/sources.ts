/**
 * Act 2 demo corpus — Butler Snow LLP public record.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ READ THIS BEFORE USING THE OUTPUT FOR ANYTHING                            │
 * │                                                                           │
 * │ The `text` below is NOT verbatim source material. Each passage is a       │
 * │ condensed summary written for this demo, restating what the named source  │
 * │ is reported to say — compiled from the citations already present in       │
 * │ index.html's Butler Snow case-study record.                               │
 * │                                                                           │
 * │ Consequence: the citations API will return `cited_text` quoting THESE      │
 * │ summaries, not the underlying court order or article. That is fine for a   │
 * │ demo — the mechanism is real and the attribution chain is visible — but    │
 * │ a citation into a summary is not a citation into a source.                 │
 * │                                                                           │
 * │ For anything beyond a demo, replace each `text` with the fetched source    │
 * │ document. The rest of the pipeline needs no changes: `document_index`      │
 * │ still identifies the source and `char_location` still points into it.     │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Why one document per source rather than one big document: the citations API
 * returns a `document_index`, so a separate document per source means every
 * citation identifies WHICH source it came from. That maps 1:1 onto the Evidence
 * Object's `src` and `st` fields. Plain-text documents are sentence-chunked, so
 * Claude can cite a single sentence or chain several together.
 *
 * The `context` field is explicitly never cited from, which makes it the right
 * place for tier and date metadata that must not be quoted back as if it were
 * source text.
 */

import type { SourceTier } from "../../models/evidence.js";

export interface SourceDocument {
  /** Short key for logs. */
  key: string;
  /** Becomes `document_title`, and the Evidence Object's `src`. */
  title: string;
  /** Source tier — drives weight, confidence and permitted language. */
  tier: SourceTier;
  /** Date or range as published. */
  date: string;
  /** Source locator for the Evidence Object's `link`. */
  link: string;
  /** Citable body text. See the warning above: these are summaries, not originals. */
  text: string;
}

export const BUTLER_SNOW_SOURCES: SourceDocument[] = [
  {
    key: "sanctions-order",
    title: "Sanctions order, Johnson v. Dunn (N.D. Ala.)",
    tier: "official",
    date: "2025-07-23",
    link: "N.D. Ala. docket — Johnson v. Dunn (order of Judge Anna M. Manasco)",
    text: [
      "The court publicly reprimanded three Butler Snow attorneys — Matthew Reeves, William Cranford and William Lunsford — for filings containing citations that did not exist.",
      "The three attorneys were disqualified from further participation in the case and referred to the Alabama State Bar for disciplinary review.",
      "The order was directed to be served on clients, opposing counsel and presiding judges in every pending case involving the firm, and on every Butler Snow attorney.",
      "The firm itself, and two other lawyers who had signed the filings, were released from disciplinary proceedings.",
      "In releasing the firm, the court credited the existence of Butler Snow's written artificial intelligence policy, noting that the policy had been violated by an individual rather than disregarded institutionally.",
    ].join(" "),
  },
  {
    key: "aba-ap-reporting",
    title: "ABA Journal and Associated Press reporting on the citations",
    tier: "third",
    date: "2025-05",
    link: "ABA Journal; AP reporting on the docket",
    text: [
      "Opposing counsel flagged citations in two Butler Snow filings defending the Alabama Department of Corrections.",
      "Five citations, generated using ChatGPT, were later described by the court as completely made up.",
      "At a show-cause hearing on 21 May 2025, partner Matthew Reeves told the court that he alone was responsible for the fabricated citations, although four attorneys had signed the filings.",
      "Two national legal publications covered the sanctions order.",
    ].join(" "),
  },
  {
    key: "firm-filing",
    title: "Butler Snow filing acknowledging the citations",
    tier: "firm",
    date: "2025-05-19",
    link: "Butler Snow filing as reported by ABA Journal",
    text: [
      "The firm acknowledged in a filing that the cited authorities either do not exist or do not stand for the proposition cited.",
      "The filing apologized to the court and stated that the attorney's use of generative artificial intelligence violated the firm's own written policy.",
      "The firm described the conduct as an isolated failure to verify research output before filing.",
    ].join(" "),
  },
  {
    key: "morgan-lewis-audit",
    title: "External citation audit by Morgan, Lewis & Bockius",
    tier: "firm",
    date: "2025-05 → 2025-07",
    link: "ABA Journal; AI Incident Database entry 1196",
    text: [
      "Butler Snow retained Morgan, Lewis & Bockius to audit citations in filings by the implicated lawyers.",
      "The external review covered approximately 2,400 citations across roughly 330 filings.",
      "The review reported no further citation errors beyond those already identified in Johnson v. Dunn.",
    ].join(" "),
  },
  {
    key: "madison-timber",
    title: "Madison Timber receivership — settlement order and receiver filings",
    tier: "official",
    date: "2018-12 → 2021-05",
    link: "madisontimberreceiver.com settlement page and court order",
    text: [
      "Following the collapse of the approximately $100 million Madison Timber Ponzi scheme, court-appointed receiver Alysson Mills sued Butler Snow and others in December 2018.",
      "The receiver alleged that the firm's advisory group acted recklessly and that the defendants' involvement lent credibility to the scheme.",
      "In September 2019 a federal judge denied Butler Snow's motion to compel arbitration and the receiver's claims proceeded.",
      "On 25 February 2021 the court approved a settlement under which Butler Snow agreed to a cash payment of $9,500,000, together with a bar order channeling related claims through the receivership estate.",
      "The firm ended its appeal in May 2021 following the settlement.",
      "Whether the settlement was funded by an insurer, and at what retention, does not appear in the public record.",
    ].join(" "),
  },
  {
    key: "state-spending",
    title: "Alabama state spending records as reported",
    tier: "third",
    date: "2020 → 2025",
    link: "AP and Courthouse News reporting on state spending records",
    text: [
      "State spending records show more than $40 million paid to the lead attorney and the firm for prison-system defense work since 2020.",
      "Fiscal year 2025 alone accounted for more than $14 million.",
      "In August 2025, following the sanctions order, Alabama's Contract Review Committee delayed a $200,000 Department of Corrections legal contract.",
      "The state subsequently proceeded with new contracts, and the Attorney General's office publicly defended the attorneys' limited culpability.",
    ].join(" "),
  },
  {
    key: "firm-profile",
    title: "Firm profile — U.S. News, firm LinkedIn, Chambers USA",
    tier: "firm",
    date: "2026-08",
    link: "U.S. News firm profile; Butler Snow LinkedIn; Chambers USA",
    text: [
      "Butler Snow LLP was founded in 1954 and is headquartered in Ridgeland, Mississippi.",
      "Sources give the attorney count as nearly 400 (U.S. News) to over 400 (firm LinkedIn).",
      "The firm lists roughly 27 offices, including Ridgeland, Huntsville, Birmingham, Nashville, Memphis, New Orleans, Dallas, Denver, New York, Washington DC, London and Singapore.",
      "The Huntsville office is the base of the team sanctioned in Johnson v. Dunn.",
      "Chambers USA describes the practice as full-service business law and litigation, including product liability and mass torts, commercial litigation, employment, M&A, regulatory, public finance and intellectual property.",
      "Clients are described as Fortune 100 companies, healthcare systems, financial institutions and growth businesses.",
    ].join(" "),
  },
];
