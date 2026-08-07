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
