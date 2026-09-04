# backend

**Project:** RADIAS · **Mirrors:** SSP-Vercel-Build/backend

## Purpose

Assessment services. Two demo acts are built:

| Act | Use case | Subject | What it shows |
| --- | --- | --- | --- |
| **2** | UC-C2 | Butler Snow (real) | Public record in → Evidence Objects, each bound to an exact source passage |
| **3** | UC-C4 → UC-V2 | Harrison, Cole & Bennett (fictional) | Application vs. record, then the AI/quant boundary in operation, then the ask |

Neither touches `index.html`; the static app is unaffected.

## Run

```bash
cd backend
npm install

# Credentials — either works:
cp .env.example .env      # paste your key   (.env is gitignored)
# ...or, with the Anthropic CLI:  ant auth login

npm run act2      # the scan
npm run act3      # the reconciliation
```

```bash
npm run test:offline      # 42 checks — no key, no network, no cost
npm run typecheck         # tsc --noEmit

npm run act2 -- --quiet   # skip streaming, print the table
npm run act2 -- --json    # → evidence.generated.json
npm run act3 -- --pack    # print only the verification request document
npm run act3 -- --json    # → reconciliation.generated.json
```

`--json` on either act emits the field shapes `index.html` already renders, so
output pastes into the prototype with no mapping.

## Act 2 — the scan

Seven public sources go in as separate `document` blocks with
`citations: {enabled: true}`. One document per source means every citation's
`document_index` identifies *which* source it came from.

Each `*` in the stream is a claim being bound to a passage. Every cited block
becomes an Evidence Object carrying verbatim `cited_text` plus character
offsets, and **`verifyLocators()` re-slices each source at those offsets and
compares**. That is the check that answers a skeptic: it proves the citation
points at real bytes, not a paraphrase.

Claims the model wrote *without* a citation are printed as defects and never
become Evidence Objects.

## Act 3 — the reconciliation

Two stages, printed separately on purpose:

**Stage 1 (Claude).** Reconciles the application against the observed record
field by field. For each field it emits a component classification, a
materiality, a rationale, the one resolving question, and the underwriting
consequence. Fields that *agree* are returned too, classified `consistent` —
because a reader must see what was checked and found sound, not only what
diverged.

**Stage 2 (deterministic).** `services/scoring/dvi.ts` turns those labels into
the index. Points by materiality, summed per component, capped per component
(55 / 25 / 20). No model involvement, no network, fully replayable.

Then the **question pack** (UC-V2): open items ranked material-before-review and
structure-before-price, rendered as the plain-text request underwriting would
send under its own name.

### The calibration gap is a feature

Act 3 prints computed component subtotals beside the ones the prototype
publishes for HCB (practice-mix 35, control-claims 5, change 12 → DVI 52):

```
component                      computed   published   delta
Practice-mix divergence              39          35      +4
Control claims unsupported           15           5     +10
Change not reflected                 12          12       0
total                                66          52     +14
```

The scorer's weights were **not** fitted to reproduce 52 — deliberately, because
tuning a rule to hit a known answer is the exact failure mode this platform
exists to detect. Both land in the **Elevated** band, and the band is what drives
the posture ladder, not the point value.

The largest gap is `control-claims`, which says something concrete: the prototype
treats an unsupported control claim far more leniently than a flat
materiality weighting does. That is where calibration should start. It is open
question 7 in the use case model — are the prototype's constants illustrative,
or intended calibration?

## Design constraints — read before editing

**Citations and structured outputs are mutually exclusive.** Enabling
`citations` on a document while also sending `output_config.format` returns a
**400**; citations interleave citation blocks with text, which cannot satisfy a
strict JSON schema. The two acts are complementary because of this:

| | Input | Citations | Structured outputs |
| --- | --- | --- | --- |
| Act 2 | free text | **on** | off |
| Act 3 | already structured | off | **on** |

Act 3's inputs are structured, so there is nothing to cite into and the conflict
never arises — which frees it to constrain the response to a schema.

**The model produces no numbers.** Act 2: `w` and `c` come from `TIER_POLICY`,
keyed on source tier. Act 3: the response schema has **no field** for a score,
index, weight or loss figure, so there is nowhere for the model to put one.
Both enforce the platform's own rule — *"AI is never permitted to set the
variance index, readiness score, or any published figure."*

**Firm non-interaction.** `question-pack.ts` returns text. It has no transport,
no recipient field and no send function, by design: the platform never contacts
an assessed firm. Underwriting issues the request under its own name, through
the renewal. Do not add a send path.

**Documents are untrusted input.** Act 2's corpus includes firm-authored
material, and an assessed firm has direct motive to author text that shapes its
own assessment. The system prompt treats document text as data rather than
instructions and reports anything resembling an injected directive in the `OPEN`
section. Do not add tools to that call.

**Real firms are not scored.** Act 2 runs extraction on a real firm and produces
no score. Act 3 scores a fictional one. That split is how the prototype already
behaves (`scan` / `case` modes publish no scores) and is presumably a legal
posture — see open question 1.

## Act 2's corpus is summaries, not source text

`sources.ts` contains **condensed summaries** written for this demo, restating
what each named source is reported to say, compiled from the citations already in
`index.html`'s Butler Snow record. They are **not** verbatim court orders.

So `cited_text` quotes *those summaries*. The mechanism is real and the
attribution chain is visible, but a citation into a summary is not a citation
into a source. Replace each `text` field with the fetched source document before
any non-demo use — nothing else in the pipeline changes. This is the highest-value
upgrade before showing Act 2 to a carrier.

Act 3's fixtures carry no such caveat: they are the prototype's own illustrative
data for a fictional firm.

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| `src/models/evidence.ts` | Types | Evidence Object + tier→weight policy |
| `src/models/variance.ts` | Types | Variance model, DVI components, materiality weights |
| `src/services/ai/sources.ts` | Fixture | Butler Snow public-record corpus (Act 2) |
| `src/services/ai/hcb-submission.ts` | Fixture | HCB application + observed record (Act 3) |
| `src/services/ai/extract.ts` | Service | Citations call + streaming (Act 2) |
| `src/services/ai/map-citations.ts` | Service | Citations → Evidence Objects, + locator verification |
| `src/services/ai/reconcile.ts` | Service | Structured-output reconciliation (Act 3 stage 1) |
| `src/services/ai/question-pack.ts` | Service | UC-V1 ranking + UC-V2 request document |
| `src/services/scoring/dvi.ts` | Engine | Deterministic DVI scorer (Act 3 stage 2) |
| `scripts/act2-butler-snow.ts` | Script | Act 2 runner |
| `scripts/act3-hcb-variance.ts` | Script | Act 3 runner |
| `tests/map-citations.offline.ts` | Test | 16 checks, no key needed |
| `tests/dvi.offline.ts` | Test | 26 checks, no key needed |

## Stage notes

**Streaming** is on in Act 2 because a call over seven documents is otherwise a
long silence. Act 3 uses `messages.parse()`, which is not streamed — the wait is
shorter and the payoff is the table.

**Fast mode** is available if dead air is unacceptable: Opus 5 supports
`speed: "fast"` for up to ~2.5× output throughput at $10/$50 per MTok, via
`client.beta.messages.*` with `betas: ["fast-mode-2026-02-01"]`. Left off to keep
both acts on the stable path.

**Refusal fallbacks** are off. Both acts check `stop_reason === "refusal"` and
report the category, but do not enable server-side fallbacks, which need the beta
endpoint. To add: `betas: ["server-side-fallback-2026-07-01"]` + `fallbacks: "default"`.

**Cache a good response** before presenting. A saved transcript beats a rate
limit in front of a carrier.

## Model

`claude-opus-5`. Adaptive thinking is on by default for this model, so
`thinking` is deliberately omitted. Act 2 omits `output_config` entirely, which
removes any chance of reintroducing the `format` key that conflicts with
citations.
