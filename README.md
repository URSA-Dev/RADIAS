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
local edit  →  git push origin main  →  Vercel builds  →  production
                git push origin <branch> / open PR  →  Vercel preview URL
```

Vercel project `radius` (team: Ursa Projects) is connected to this repository
through the Vercel GitHub App. Deploys are automatic:

| Trigger | Result |
| --- | --- |
| Push to `main` | Production deploy, aliased to `radias-murex.vercel.app` |
| Push to any other branch, or a PR | Preview deploy with its own URL |

Verified 2026-09-04: a push to `main` produced a production deployment in ~15
seconds, and GitHub reports two successful Vercel contexts against the commit
(`Vercel`, `Vercel Deployments – Ursa Projects`).

`vercel deploy --prod` still works and remains useful for publishing without a
commit, but it is no longer required.

Project details:

| | |
| --- | --- |
| Project name | `radius` — a typo for `radias`, but load-bearing; renaming changes URLs |
| Project ID | `prj_VhWqaMww86XyE54CsXXu89V7tvMT` |
| Owner / scope | Ursa Projects (Hobby) / `rbs-projects-051d48bf` |
| Production alias | `radias-murex.vercel.app` — note `radias`, not `radius` |

> **History worth keeping:** the project was originally connected to
> `URSA-Dev/radius` — a private throwaway repo auto-created alongside the
> project, one character away from this one. Pushes here produced no builds
> because Vercel was watching that repo instead. If deploys ever stop firing,
> check the connected repository name first. `URSA-Dev/radius` is a candidate
> for deletion.

`vercel.json` declares the static configuration: no trailing slash, four
security response headers, and `Cache-Control: public, max-age=0,
must-revalidate` applied through a single catch-all `/(.*)` rule. It does **not**
set `cleanUrls` — dropped in `6f5096a` because it rewrote `index.html` to
`/index`, making an `index.html`-scoped cache rule unreachable.

`.vercelignore` keeps everything that is not the static site off the CDN:
`backend/`, `node_modules/`, and the local-only `.claude/`, `CLAUDE.md` and
`soul.md`.

## Access control

The app is behind a real gate. `middleware.js` runs at the edge before the CDN
cache and rewrites any request without a valid session cookie to `/login.html`,
so **`index.html` is never served to an unauthenticated visitor**. Fetching
`/index.html` directly returns the login page, not the app.

```
request  →  middleware.js  ──no valid cookie──▶  login.html
                  │
            valid cookie
                  ▼
             index.html
```

| Piece | Role |
| --- | --- |
| `middleware.js` | The gate. Verifies the signed cookie, rewrites to the login page otherwise. Fails closed if `AUTH_SECRET` is unset. |
| `api/login.js` | `POST {email,password}` → compares against env vars → sets the cookie |
| `api/logout.js` | `POST` → expires the cookie |
| `api/_session.js` | HMAC-SHA256 token sign/verify, constant-time compare, cookie helpers |
| `login.html` | Standalone branded sign-in page |

**Credentials** (ask the owner — they are not in this repo):

```
testuser1@radias.com
```

The password lives only in the `AUTH_PASSWORD` environment variable.

### Environment variables

Set on Vercel for Production, Preview and Development:

| Name | Purpose |
| --- | --- |
| `AUTH_EMAIL` | Permitted sign-in address |
| `AUTH_PASSWORD` | Password, compared server-side. Never sent to the browser. |
| `AUTH_SECRET` | 32-byte hex key that signs the session cookie |

### How the session works

The cookie is `<expiry>.<hmac>`, signed with `AUTH_SECRET` and valid for 8 hours.
Nothing is stored server-side. It is `HttpOnly`, `Secure`, `SameSite=Strict`, so
page scripts cannot read it — verified. A second cookie, `radias_user`, is
deliberately *not* `HttpOnly` and carries only the email for display in the
topbar; it grants nothing.

Wrong email and wrong password return the **same** message and status, so
neither field is disclosed. Both are compared on every attempt, in constant
time.

### What this does not do

There is no rate limiting. Vercel Functions are stateless, so throttling would
need a datastore. For a single shared demo credential behind a link that is not
published, that is an accepted gap — not an oversight. Add Upstash Redis or
Vercel Firewall rate limiting if the URL is ever circulated widely.

## Shipping a new version

Versions are tracked as commits and tags against `index.html`, not as new
filenames.

```bash
# edit index.html, then
git add index.html
git commit -m "v63: <what changed>"
git tag -a v63 -m "Version 63"
git push origin main --follow-tags   # this deploys automatically
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

`index.html` gained a demo sign-in gate on 2026-09-04 (see **Demo sign-in**
above); the assessment content is unchanged since v62. Automatic deploys from
`main` began working the same day, once the project was repointed from
`URSA-Dev/radius` to this repository.

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
