# RADIAS

Professional Risk Intelligence · Treaty and facultative reinsurance

**Live:** https://radius-murex.vercel.app

## What this is

A single-file, self-contained HTML application. `index.html` holds all markup,
styles, and logic — there is no build step, no bundler, and no package manifest.

Two runtime dependencies are loaded from CDNs, so the page needs public internet
access to render fully:

- Chart.js 4.4.1 — `cdnjs.cloudflare.com`
- Inter + IBM Plex Mono — `fonts.googleapis.com`

## Deployment pipeline

```
local edit  →  git push origin main  →  Vercel builds  →  production
                git push origin <branch> / open PR  →  Vercel preview URL
```

Vercel project `radius` (team: Ursa Projects) is connected to this repository
through the Vercel GitHub App. Deploys are automatic:

| Trigger | Result |
| --- | --- |
| Push to `main` | Production deploy |
| Push to any other branch, or a PR | Preview deploy with its own URL |

No deploy tokens or GitHub Actions secrets are involved — the GitHub App handles
authentication.

`vercel.json` declares the static configuration: clean URLs, no trailing slash,
security response headers, and a no-cache policy on `index.html` so a new
version is picked up immediately.

## Shipping a new version

Versions are tracked as commits and tags against `index.html`, not as new
filenames.

```bash
# edit index.html, then
git add index.html
git commit -m "v63: <what changed>"
git tag -a v63 -m "Version 63"
git push origin main --follow-tags
```

Vercel deploys the push automatically. Verify with:

```bash
curl -sI https://radius-murex.vercel.app | head -1
```

## Version history

| Version | Date | Note |
| --- | --- | --- |
| v62 | 2026-09-01 | First version committed to this repository |

## Repository layout

The directory tree below mirrors the `SSP-Vercel-Build` project so the two
repositories stay navigable in the same way. The folders are **scaffolding only**
— they were created empty, without copying any of SSP's source files, tests, or
configuration.

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
the Vercel build yet.

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
