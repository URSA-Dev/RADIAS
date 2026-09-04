/**
 * Turns a cited Claude response into Evidence Objects.
 *
 * The citations API returns text split across many blocks; blocks carrying a
 * factual claim have a `citations` array. Each citation names the source
 * (`document_index`, `document_title`), quotes the exact passage (`cited_text`)
 * and gives its offsets (`start_char_index` / `end_char_index`).
 *
 * That is already most of an Evidence Object. The remaining fields come from two
 * places, and NEITHER is a model-produced number:
 *   - `pa` / `att` / `rf` / `subj` from an inline metadata tag the prompt requires
 *   - `w` / `c` from TIER_POLICY, keyed on the source's tier
 *
 * Because a finding's prose and its metadata tag can land in different blocks,
 * blocks are accumulated in order and an item is closed when its tag appears.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  TIER_POLICY,
  type EvidenceObject,
  type SourceTier,
} from "../../models/evidence.js";
import type { SourceDocument } from "./sources.js";

/** `[pa: ... | att: ... | rf: ... | subj: ...]` */
const META_RE = /\[pa:\s*([^|\]]*)\|\s*att:\s*([^|\]]*)\|\s*rf:\s*([^|\]]*)\|\s*subj:\s*([^\]]*)\]/i;

interface PendingCitation {
  documentIndex: number;
  documentTitle: string;
  citedText: string;
  startChar: number | null;
  endChar: number | null;
}

export interface MappedResult {
  evidence: EvidenceObject[];
  /** Bullets from the OPEN section — what the record cannot establish. */
  open: string[];
  /** Findings the model wrote without any citation. Each one is a defect. */
  uncited: string[];
  /** Findings whose metadata tag was missing or malformed. */
  needsReview: string[];
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Pulls a plain-text rendering of the response, for the OPEN section. */
function fullText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseOpenSection(text: string): string[] {
  const idx = text.search(/^\s*OPEN\s*$/im);
  if (idx === -1) return [];
  return text
    .slice(idx)
    .split(/\r?\n/)
    .filter((l) => /^\s*-\s+/.test(l))
    .map((l) => clean(l.replace(/^\s*-\s+/, "")))
    .filter(Boolean);
}

export function mapCitationsToEvidence(
  message: Anthropic.Message,
  sources: SourceDocument[],
): MappedResult {
  const evidence: EvidenceObject[] = [];
  const uncited: string[] = [];
  const needsReview: string[] = [];

  let prose = "";
  let cites: PendingCitation[] = [];
  let seq = 0;

  const flush = (metaMatch: RegExpMatchArray | null) => {
    const body = clean(prose.replace(META_RE, ""));
    prose = "";
    const pending = cites;
    cites = [];

    // Ignore structural fragments (numbering, the OPEN heading, stray whitespace).
    if (!body || /^\d+[.)]?$/.test(body) || /^OPEN$/i.test(body)) return;
    if (!pending.length) {
      // A claim with no citation. The prompt calls this a defect; surface it
      // rather than silently dropping it or inventing a source.
      if (body.length > 24 && !/^-\s/.test(body)) uncited.push(body);
      return;
    }

    const pa = clean(metaMatch?.[1] ?? "");
    const att = clean(metaMatch?.[2] ?? "");
    const rf = clean(metaMatch?.[3] ?? "");
    const subj = clean(metaMatch?.[4] ?? "");
    if (!metaMatch) needsReview.push(body);

    // One Evidence Object per (finding × cited source). A finding chaining two
    // sources yields two objects, each with its own tier, weight and locator —
    // which is correct: they are separately verifiable.
    for (const c of pending) {
      const src = sources[c.documentIndex];
      const tier: SourceTier = src?.tier ?? "third";
      const policy = TIER_POLICY[tier];
      seq += 1;
      evidence.push({
        id: `EV-${String(seq).padStart(3, "0")}`,
        src: src?.title ?? c.documentTitle ?? "Unknown source",
        st: tier,
        d: src?.date ?? "—",
        subj: subj || body.slice(0, 60),
        pa: pa || "All",
        att: att || "—",
        rf: rf || "—",
        w: policy.w,
        c: policy.c,
        rel: subj || "—",
        body,
        link: src?.link ?? "—",
        citedText: c.citedText,
        locator:
          c.startChar !== null && c.endChar !== null
            ? { startChar: c.startChar, endChar: c.endChar }
            : null,
      });
    }
  };

  for (const block of message.content) {
    if (block.type !== "text") continue;
    prose += block.text;

    const anyCites = (block as Anthropic.TextBlock).citations;
    if (anyCites) {
      for (const c of anyCites) {
        // TextCitation is a union. Only the three document location types
        // carry `document_index` — char_location (plain text), page_location
        // (PDF) and content_block_location (custom content). The search-result
        // and web-search variants do not, and cannot occur here since we send
        // documents rather than search results. Narrowing positively keeps
        // this correct if the pipeline later gains a web-search path.
        if (
          c.type !== "char_location" &&
          c.type !== "page_location" &&
          c.type !== "content_block_location"
        ) {
          continue;
        }

        const startChar = c.type === "char_location" ? c.start_char_index : null;
        const endChar = c.type === "char_location" ? c.end_char_index : null;

        cites.push({
          documentIndex: c.document_index,
          documentTitle: c.document_title ?? "",
          citedText: c.cited_text,
          startChar,
          endChar,
        });
      }
    }

    const m = prose.match(META_RE);
    if (m) flush(m);
  }
  if (prose.trim() || cites.length) flush(prose.match(META_RE));

  return {
    evidence,
    open: parseOpenSection(fullText(message)),
    uncited,
    needsReview,
  };
}

/**
 * Verifies every citation's offsets actually bracket the quoted text in the
 * source we sent. This is the check that makes the demo answerable to a
 * skeptic: it proves the citation points at real bytes, not a paraphrase.
 */
export function verifyLocators(
  evidence: EvidenceObject[],
  sources: SourceDocument[],
): { verified: number; failed: EvidenceObject[] } {
  const byTitle = new Map(sources.map((s) => [s.title, s.text]));
  const failed: EvidenceObject[] = [];
  let verified = 0;

  for (const e of evidence) {
    const text = byTitle.get(e.src);
    if (!text || !e.locator) {
      failed.push(e);
      continue;
    }
    const slice = text.slice(e.locator.startChar, e.locator.endChar);
    if (clean(slice) === clean(e.citedText)) verified += 1;
    else failed.push(e);
  }
  return { verified, failed };
}
