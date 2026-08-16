# Supabase migration history notes

## Duplicate numeric prefixes (117, 118, 121, 133, 137)

Production (`kkxtvzxqmbacjatkiupq`) applied multiple migrations that share the same
three-digit prefix (e.g. `117_internal_operators_multi_roles.sql` and
`117_messaging_message_actions.sql`). Supabase orders migrations by **full filename**,
not by prefix alone. These pairs are **intentionally retained** — do not renumber files
that are already applied in production.

## blog_posts foundation

`0739_blog_posts_legacy_foundation.sql` creates `public.blog_posts` when missing so
fresh local `supabase db reset` can replay through `076_workspace_id_phase1.sql`.
