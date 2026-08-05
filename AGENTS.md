<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy live always

After implementing requested product/code changes: commit the relevant files and **push to `origin/main`** so Vercel production updates. Do not wait for a separate deploy request unless the user says not to push. Skip secrets, `.env`, and unrelated dirty trees.
