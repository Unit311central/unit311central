<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy live always

After implementing requested product/code changes: commit the relevant files and **push to `origin/main`** so Vercel production updates. Do not wait for a separate deploy request unless the user says not to push. Skip secrets, `.env`, and unrelated dirty trees.

**Before telling the user to check production:** poll/verify the Vercel deployment is live (HTTP check on the changed URL or asset). Report explicit status — commit SHA, verified URL, live vs still building — not just “refresh the page”.

## OnwardAir overview invite (client-frozen)

Production invite: `https://onwardair.unit311central.com/overview` (login required, no `?tune` for clients).

**Frozen Aug 2026** — do not change overview layout, defaults, or embed nav sizing without explicit owner request. See `.cursor/rules/overview-client-frozen.mdc`. Run `npm run prove:overview-client` before any overview deploy.

## Unit311 Central homepage hero (frozen)

Production homepage: `https://unit311central.com`

**Frozen Aug 2026** — hero background video must stay `/images/video.mp4` via `HeroVideoBackground` in `HomeHero.tsx`. Do not remove the video, swap assets, or replace with gradient-only hero without explicit owner request. See `.cursor/rules/homepage-hero-frozen.mdc`. Run `npm run prove:homepage-hero` before any homepage deploy.

## Talanton Executive Home (customer host)

Production: `https://talantonimpact.unit311central.com/dashboard` (Home view).

Impact KPIs come from `buildPortfolioImpactBriefing()` — **portal submissions win** when present; otherwise holdings use the **portfolio impact model** in `impact-holdings-estimates.ts` (same behaviour as pre–real-data Home). Never call `.toLocaleString()` on nullable summary fields without a guard; prefer `displayImpactCount()`. Talanton customer hosts must resolve via host slug before scoped whoami cache (`talanton-surface.ts`).

Run `npm run prove:talanton-home` before deploy when changing `executive-home-dashboard.ts`, `ExecutiveHomeDashboard.tsx`, or Talanton host routing. Run `npm run prove:talanton-intelligence-briefing` when changing `portfolio-intelligence.ts`, `CompanyImpactWorkspace.tsx`, board impact, or intelligence workspace packs. CI also runs `prove:talanton-ea` (includes both prove scripts plus EA routing/tests).
