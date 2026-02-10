# Release Checklist

## Quality
- [ ] `npm run check:js`
- [ ] `npm run check:modules`
- [ ] `npm run check:i18n-literals`
- [ ] `npm run check:app-size`
- [ ] `npm run check:docs`
- [ ] `npm run test`
- [ ] `npm run test:unit`
- [ ] `npm run test:e2e:smoke`
- [ ] `npm run test:e2e:i18n-demo`
- [ ] `npm run test:e2e:confirm-flow`
- [ ] `npm run test:e2e:demo-restore`
- [ ] `npm run test:e2e:offline-mode`
- [ ] `npm run test:e2e:demo-audit`
- [ ] `npm run test:e2e:news-panel`
- [ ] `npm run test:e2e:news-fallback`
- [ ] `npm run test:e2e:news-i18n`
- [ ] `PUBLIC_BASE_URL=<prod-url> npm run release:verify`

## Docs & Assets
- [ ] README updated
- [ ] DEMO_GUIDE updated
- [ ] INTERVIEW_SCRIPT updated
- [ ] `docs/screenshots/*` present
- [ ] `docs/architecture.png` present
- [ ] `docs/perf-baseline.md` updated

## Deployment
- [ ] Vercel deploy healthy on HTTPS
- [ ] Route switching works
- [ ] `/open` bridge page works in WeChat in-app browser path
- [ ] `/open` bridge page works in Safari path
- [ ] `/open` bridge page works in desktop browser path
- [ ] `/api/health` returns 200/503 with structured JSON
- [ ] `/api/news-feed` returns structured JSON with quality/items
- [ ] `/status` page displays overall state and service summary
- [ ] Demo load + restore works
- [ ] Offline fallback verified
- [ ] Rollback path confirmed
