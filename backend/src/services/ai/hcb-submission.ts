/**
 * Act 3 demo inputs — Harrison, Cole & Bennett LLP.
 *
 * HCB is a FICTIONAL firm. That matters: the platform refuses to score real
 * firms (mode `scan` / `case` publish no scores), so a fictional subject is the
 * only place a full scored reconciliation can be demonstrated. Act 2 does
 * extraction on a real firm; Act 3 does scoring on an invented one. That split
 * is deliberate and is already how the prototype behaves.
 *
 * Values below are transcribed from index.html — `FIRM`, `PRACTICE_MIX`,
 * `VARIANCE_ROWS` and `DRIFT_EVENTS`. Unlike Act 2's corpus, nothing here is a
 * summary of an outside source: it is the prototype's own illustrative data.
 */

/** What the firm put on its renewal application. */
export interface ApplicationSubmission {
  firmName: string;
  line: string;
  renewal: string;
  attorneys: number;
  offices: string[];
  laterals24mo: number;
  revenue: string;
  practiceMix: { area: string; sharePct: number }[];
  declarations: { question: string; answer: string }[];
  tower: string;
}

/** What public evidence shows, as compiled by the observation stage (UC-C2). */
export interface ObservedRecord {
  attorneys: string;
  offices: string[];
  laterals24mo: string;
  practiceMix: { area: string; observedRange: string; verified: string }[];
  findings: { subject: string; observation: string; evidence: string[] }[];
  timeline: { date: string; event: string; source: string; evidence: string }[];
  controls: { control: string; claimed: string; verified: string }[];
}

export const HCB_APPLICATION: ApplicationSubmission = {
  firmName: "Harrison, Cole & Bennett LLP",
  line: "Lawyers Professional Liability",
  renewal: "01 Nov 2026",
  attorneys: 82,
  offices: ["Chicago (HQ)", "New York", "Washington, DC"],
  laterals24mo: 9,
  revenue: "$68,000,000",
  practiceMix: [
    { area: "Litigation", sharePct: 30 },
    { area: "Corporate / M&A", sharePct: 28 },
    { area: "Real Estate", sharePct: 8 },
    { area: "Employment", sharePct: 10 },
    { area: "Government Contracts", sharePct: 8 },
    { area: "Trusts & Estates", sharePct: 6 },
    { area: "Other", sharePct: 10 },
  ],
  declarations: [
    { question: "Securities / capital markets practice share", answer: "0%" },
    { question: "Does any attorney serve as trustee, executor, or fiduciary?", answer: "No" },
    { question: "Extent of generative AI use in legal work", answer: "Limited" },
    { question: "Does the firm hold client funds?", answer: "Yes — IOLTA only" },
    { question: "Cyber controls in place", answer: "MFA, EDR, backups" },
    { question: "Docketing practice", answer: "Centralized" },
    { question: "Conflicts checking", answer: "Automated" },
  ],
  tower: "$10M limit, $1M retention, claims-made & reported. Crime $2M with $250K social-engineering sublimit.",
};

export const HCB_OBSERVED: ObservedRecord = {
  attorneys: "87 active attorneys across IL, NY, DC, FL, VA, NJ and WI bar records",
  offices: ["Chicago (HQ)", "New York", "Washington, DC", "Miami (opened Mar 2025)"],
  laterals24mo: "12, identified from lateral announcements and bar-record employment changes",
  practiceMix: [
    { area: "Litigation", observedRange: "28–32%", verified: "31%" },
    { area: "Corporate / M&A", observedRange: "26–30%", verified: "27%" },
    { area: "Real Estate", observedRange: "15–18%", verified: "15%" },
    { area: "Employment", observedRange: "8–11%", verified: "9%" },
    { area: "Government Contracts", observedRange: "7–9%", verified: "8%" },
    { area: "Trusts & Estates", observedRange: "6–9%", verified: "7%" },
    { area: "Other", observedRange: "2–4%", verified: "3%" },
  ],
  findings: [
    {
      subject: "Real estate exposure",
      observation:
        "19 attorney biographies list real estate, real estate finance or land use. Three describe escrow or closing responsibilities. Fourteen real-estate deal releases in 18 months. Miami office opened Mar 2025 for hospitality finance. Firm-authorized matter metadata puts real estate at 15.1% of fees across 1,840 open matters, with 41 escrow matters holding client funds.",
      evidence: ["EV-001", "EV-004", "EV-005", "EV-025"],
    },
    {
      subject: "Securities activity",
      observation:
        "Four attorneys list securities or capital markets work. The firm is named as issuer's counsel in an S-1 registration statement (Oct 2025) and appears in two SEC 8-K exhibits.",
      evidence: ["EV-006", "EV-007"],
    },
    {
      subject: "Fiduciary roles",
      observation:
        "Six attorney biographies describe trustee, executor or board roles; one describes administering four family trusts. Sourced from firm website biographies only, so roles may be historic.",
      evidence: ["EV-002"],
    },
    {
      subject: "Generative AI use",
      observation:
        "Firm-wide generative AI research tool announced Sep 2024. An 'AI Innovation Counsel' role was posted describing deployment across litigation and transactional workflows. A court sanctioned the firm's associate in Oct 2025 for three fabricated citations ($5,000). A mandatory citation-verification policy was announced Dec 2025. An approved AI environment with logging was announced Apr 2026; access logs show 91% of AI sessions inside it over 90 days, implying roughly 9% shadow usage. Citation-verification adoption is measured at 72%.",
      evidence: ["EV-010", "EV-014", "EV-015", "EV-016", "EV-023"],
    },
    {
      subject: "Client funds",
      observation:
        "Escrow activity is described in three attorney biographies. An escrow account is confirmed. Four of seven real-estate closing releases reference the firm acting as closing or escrow counsel.",
      evidence: ["EV-004", "EV-025"],
    },
    {
      subject: "Matter complexity",
      observation:
        "Median announced deal size rose from $38M to $115M over 18 months (+203%). The firm was lead counsel on a $410M carve-out with a public-company counterparty.",
      evidence: ["EV-003", "EV-006", "EV-018"],
    },
    {
      subject: "Discipline history",
      observation:
        "Two historical Illinois ARDC reprimand or censure orders (2011, 2014), both pre-dating current controls and neither a malpractice claim. One Florida Bar admonishment (2018) for trust-account record-keeping against an attorney who joined the firm in 2025.",
      evidence: ["EV-012", "EV-013"],
    },
    {
      subject: "Lateral prior acts",
      observation:
        "Six partners joined in Nov 2024 from a dissolved boutique. Prior-acts coverage for those attorneys is not established in public sources.",
      evidence: ["EV-019"],
    },
  ],
  timeline: [
    { date: "Sep 2024", event: "Adopted generative AI research tool across the litigation group", source: "Firm press release; 'AI Innovation Counsel' job posting", evidence: "EV-014" },
    { date: "Nov 2024", event: "Six lateral partners join from a dissolved boutique", source: "Lateral announcement; bar-record employment updates", evidence: "EV-019" },
    { date: "Mar 2025", event: "Opened Miami office (real estate, hospitality finance)", source: "Firm press release; five Florida Bar admissions", evidence: "EV-005" },
    { date: "Jun 2025", event: "Median announced deal size rises from $38M to $115M", source: "Firm newsroom (11 releases); two SEC 8-K exhibits", evidence: "EV-006" },
    { date: "Aug 2025", event: "Real estate closing practice expands (Miami and Chicago)", source: "Seven deal announcements; three bios updated with escrow language", evidence: "EV-004" },
    { date: "Oct 2025", event: "Sanction order for fabricated citations in a motion (N.D. Ill.)", source: "Judicial opinion; legal news coverage", evidence: "EV-010" },
    { date: "Dec 2025", event: "Mandatory AI citation-verification policy adopted", source: "Firm AI policy statement", evidence: "EV-015" },
    { date: "Feb 2026", event: "Six additional laterals (employment, government contracts)", source: "Lateral announcements; bio changes", evidence: "EV-020" },
    { date: "Apr 2026", event: "Approved AI environment with logging and DLP enforced", source: "Firm technology announcement; verified access logs", evidence: "EV-016" },
  ],
  controls: [
    { control: "Dual docketing", claimed: "Centralized", verified: "98.7% of applicable matters over 24 months (firm-authorized export)" },
    { control: "Conflicts checking", claimed: "Automated", verified: "99.4% completed pre-engagement" },
    { control: "Cyber (MFA / EDR)", claimed: "MFA, EDR, backups", verified: "MFA 100%, EDR 100%; SOC 2 referenced in an RFP response" },
    { control: "AI citation verification", claimed: "Mandatory policy (Dec 2025)", verified: "NOT independently established — adoption measured at 72%; policy exists on paper, technical enforcement unevidenced" },
    { control: "Wire verification", claimed: "Not stated on the application", verified: "0.85 effective" },
    { control: "Lateral prior-acts review", claimed: "Not stated on the application", verified: "Weak — 0.17" },
  ],
};
