# Local env recovery (`.env.local`)

**Source of truth for secrets is Vercel — not GitHub, not a Supabase table.**

Never commit `.env`, `.env.local`, or other secret files to this repository.

## After a new laptop / wiped disk

### 1. Clone the repo

```bash
git clone https://github.com/Unit311central/unit311central.git
cd unit311central
npm install
```

### 2. Link Vercel (once per machine)

Install the Vercel CLI if needed, then link to the production project:

```bash
npm i -g vercel
vercel login
vercel link
```

When prompted, choose the **Unit311central** / **unit311central** project  
(`prj_lyDcefpA3tnfzWLiZ9Ui0xVk6nJD` — see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)).

### 3. Pull env into `.env.local`

```bash
vercel env pull .env.local
```

This writes a local `.env.local` from the Vercel project’s environment variables  
(Development by default when using `env pull` interactively / linked project).

Useful variants:

```bash
# Explicit development target
vercel env pull .env.local --environment=development

# Preview / production copies (only if you intentionally need those values locally)
vercel env pull .env.preview.local --environment=preview
vercel env pull .env.production.local --environment=production
```

### 4. Run locally

```bash
npm run dev
```

## What is safe online

| Store | Role |
| --- | --- |
| **Vercel project env** | Canonical secrets for deploy + local pull |
| **GitHub repo** | Code + non-secret docs only |
| **Supabase dashboard** | Database URL / service keys live there; copy into Vercel, don’t dump raw `.env` into tables |
| **Password manager** (optional) | Extra offline copy of critical keys |

## What not to do

- Do **not** commit `.env.local` to GitHub (private or public)
- Do **not** “real-time sync” plaintext secrets into the repo or a normal Supabase table
- Do **not** reuse `AUTH_SECRET` as `INTEGRATION_CREDENTIALS_SECRET`

## Related

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — Vercel project IDs, deploy / rollback
- [../backups/cursor-chat-history/](../backups/cursor-chat-history/) — Agent chat transcript backup (not secrets)
