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
