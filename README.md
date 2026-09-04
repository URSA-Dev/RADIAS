# RADIAS

Professional Risk Intelligence · Treaty and facultative reinsurance

**Live:** https://radias-murex.vercel.app

## What this is

A single-file, self-contained HTML application. `index.html` holds all markup,
styles, and logic — there is no build step, no bundler, and no package manifest.

Two runtime dependencies are loaded from CDNs, so the page needs public internet
access to render fully:

- Chart.js 4.4.1 — `cdnjs.cloudflare.com`
- Inter + IBM Plex Mono — `fonts.googleapis.com`

## Deployment pipeline

```
local edit  →  git push origin main   (source of record — does NOT deploy)
            →  vercel deploy --prod   (what actually publishes)
```

> **Deploys are manual, by design of circumstance rather than choice.**
> Pushing to `main` does **not** trigger a build. When Vercel created the
> project on 2026-09-02 it also auto-created a throwaway repo
> `URSA-Dev/radius` and connected the project to *that* instead of
> `URSA-Dev/RADIAS`. Until the Git connection is repointed, the CLI is the
> only route to production.

| Action | Result |
| --- | --- |
| `git push origin main` | Updates the repository. **No deploy.** |
| `vercel deploy --prod` | Production deploy, aliased to `radias-murex.vercel.app` |
| `vercel deploy` | Preview deploy with its own URL |

Verified 2026-09-04: a CLI production deploy returns `200` on the production
alias with no login redirect. Raw `radius-<hash>-rbs-projects-…vercel.app`
deployment URLs *are* behind Vercel Authentication and will `302` to
`vercel.com/sso-api` — that protection applies to those, not to the production
alias.

Project details:

| | |
| --- | --- |
| Project name | `radius` — a typo for `radias`, but load-bearing; renaming changes URLs |
| Project ID | `prj_VhWqaMww86XyE54CsXXu89V7tvMT` |
| Owner / scope | Ursa Projects / `rbs-projects-051d48bf` |
| Production alias | `radias-murex.vercel.app` — note `radias`, not `radius` |

`vercel.json` declares the static configuration: no trailing slash, four
security response headers, and `Cache-Control: public, max-age=0,
must-revalidate` applied through a single catch-all `/(.*)` rule, so a new
version is picked up immediately. It does **not** set `cleanUrls` — that was
dropped in `6f5096a` because it rewrote `index.html` to `/index`, making an
`index.html`-specific cache rule unreachable.

`.vercelignore` keeps everything that is not the static site off the CDN:
`backend/`, `node_modules/`, and the local-only `.claude/`, `CLAUDE.md` and
`soul.md`.

## Shipping a new version

Versions are tracked as commits and tags against `index.html`, not as new
filenames.

```bash
# edit index.html, then
git add index.html
git commit -m "v63: <what changed>"
git tag -a v63 -m "Version 63"
git push origin main --follow-tags

# the push does not deploy — publish explicitly
vercel deploy --prod
```

Verify:

```bash
curl -sI https://radias-murex.vercel.app | head -1        # expect: HTTP/1.1 200 OK
curl -s https://radias-murex.vercel.app | wc -c           # expect: byte size of index.html
```

## Version history

| Version | Date | Note |
| --- | --- | --- |
| v62 | 2026-09-01 | First version committed to this repository |

`index.html` is unchanged since v62. It was published to production by CLI on
2026-09-04 (`dpl_H4Qfy99wtHiFJf3DGBamjGoB1TSv`), which is the first deploy this
repository can actually account for — earlier deployments came from the
mis-connected `URSA-Dev/radius` repo.

## Assessment services

`backend/` holds the Claude API integrations that sit behind the prototype. They
are **not** part of the static site and are excluded from every deploy.

| Act | Use case | What it does |
| --- | --- | --- |
| 2 | UC-C2 | Public-record extraction with citations — evidence bound to exact source passages |
| 3 | UC-C4 → UC-V2 | Application vs. record reconciliation, deterministic DVI scoring, verification question pack |

```bash
cd backend && npm install
npm run test:offline   # 42 checks, no API key needed
npm run act2           # needs ANTHROPIC_API_KEY or `ant auth login`
npm run act3
```

See `backend/README.md`. Both acts respect the platform's own AI boundary: the
model classifies and cites, a deterministic engine computes every published
figure.

## Repository layout

The directory tree below mirrors the `SSP-Vercel-Build` project so the two
repositories stay navigable in the same way. The folders were created **empty**,
without copying any of SSP's source files, tests, or configuration.

Most are still empty scaffolding. The exception is `backend/`, which now holds
real code — see [Assessment services](#assessment-services) above. `backend/src/services/scoring/`
was added there and has no SSP counterpart.

Every folder carries a `README.md` in one consistent shape:

```markdown
# <path/to/folder>

**Project:** RADIAS · **Mirrors:** SSP-Vercel-Build/<path/to/folder>

## Purpose

_Not yet populated._

## Contents

| Item | Type | Purpose |
| --- | --- | --- |
| _(empty)_ | — | — |
```

Fill in **Purpose** and **Contents** as each folder gains real content. The
per-folder README also serves a practical purpose: git does not track empty
directories, so the README is what keeps each folder in the repository.

`index.html` remains the live application. Nothing in this tree is wired into
the Vercel build — `backend/` is excluded by `.vercelignore`, and the placeholder
READMEs elsewhere are inert.

```
RADIAS/
    .claude/
        agents/
        commands/
        hooks/
        plans/
        rules/
        skills/
            ai-services/
            cloud-network-architect/
            code-reviewer/
            context-switch/
            infra-hardening/
            retrieval/
            security-check/
            test-writer/
        state/
    .github/
        workflows/
    backend/
        scripts/
        src/
            config/
            controllers/
            errors/
            middleware/
            models/
            queues/
            routes/
            schemas/
            services/
                ai/
                email/
            utils/
            workers/
        tests/
            access/
            auth/
            cases/
            documents/
            documents-library/
            me/
            metrics/
            middleware/
            policies/
            schemas/
            security/
            services/
            subjects/
            utils/
    database/
        migrations/
        seeds/
    docs/
        admin/
            screenshots/
        adr/
        ai/
        api/
        architecture/
        database/
        deployment/
        release/
        runbooks/
        skills/
        specs/
            _templates/
            admin-and-roles/
            auth-rbac-role-mapping/
            case-detail-batch-c/
            case-detail-failloud/
            d1-per-classification-authz/
            document-display-fix/
            document-upload-fix/
            email-ses/
            invite-link-delivery/
            invite-signup-approval/
            new-case-creation-fixes/
            service-failloud/
            user-profile/
            v1.1-hardening-framework/
            v1.2-row-edit/
            v1.3-virus-scanning/
            v1.4.0-app-shell-and-model-migration/
    frontend/
        public/
        src/
            components/
                Alert/
                Badge/
                BarChart/
                Button/
                Card/
                CaseAdvisory/
                ConfidenceBar/
                ConfirmDialog/
                DetailTable/
                EmptyState/
                ErrorBoundary/
                FormControls/
                KpiCard/
                Modal/
                modals/
                PreviewBanner/
                RoleBadge/
                Skeleton/
                Spinner/
                Table/
                Tabs/
                Timeline/
                Toast/
                UploadZone/
                WizardStrip/
            hooks/
            layouts/
            pages/
                AcceptInvite/
                AccessAdmin/
                    components/
                    tabs/
                AiExtract/
                AuditLog/
                CaseDetail/
                    tabs/
                Cases/
                ChangePassword/
                Dashboard/
                DocumentsLibrary/
                FclTracker/
                ForeignTravel/
                ForgotPassword/
                Login/
                Metrics/
                NewCase/
                    steps/
                Policies/
                Profile/
                QaQueue/
                Reports/
                ResetPassword/
                Settings/
                Violations/
                Workload/
            providers/
            services/
            styles/
            utils/
        tests/
            components/
            e2e/
            layouts/
            pages/
            services/
            utils/
    infrastructure/
        aws/
        modules/
            tags/
        mongo-init/
```

Directories **not** mirrored, because they hold build artifacts or local state
rather than project structure: `.git/`, `node_modules/`, `.terraform/`,
`dist/`, `.vercel/`, `.design-cache/`, `.playwright-mcp/`, `backend/uploads/`.
