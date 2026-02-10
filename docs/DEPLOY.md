# Deploy Guide

## Primary: Vercel
1. Import this repository into Vercel.
2. Framework preset: `Other`.
3. Build command: leave empty.
4. Output directory: leave empty (static root).
5. Confirm `vercel.json` is detected.
6. Deploy and verify HTTPS is enabled.

## Backup: GitHub Pages
1. Push project to GitHub.
2. Enable Pages from branch `main` and root `/`.
3. Ensure SPA hash routes are used (`#/dashboard` etc.) so no server rewrite is required.

## Post-deploy checks
1. Open `/` and validate initial load.
2. Switch between `#/dashboard`, `#/assets`, `#/settings`.
3. Toggle language and demo mode.
4. Load demo data and restore pre-demo state.
5. Simulate offline mode in browser devtools and verify fallback banner.

## Rollback
1. Vercel: promote previous deployment from the deployment history.
2. GitHub Pages: redeploy previous commit.
