/**
 * Marketing & Events schema (migration 141).
 *
 * Approved production apply path:
 *   POST /api/internal/apply-unit311central-pending-migrations
 *   (allowlist includes 141_marketing_events_module.sql)
 *
 * Runtime fallback (existing Unit311 pattern):
 *   ensureMarketingEventsTables() in internal-db-migrations.ts
 *   — invoked on first M&E write when tables are missing and DB credentials exist.
 */
export const MARKETING_EVENTS_MIGRATION_PATH =
  "supabase/migrations/141_marketing_events_module.sql";

export const MARKETING_TABLES = [
  "marketing_contacts",
  "marketing_newsletters",
  "marketing_campaigns",
  "marketing_external_events",
  "marketing_managed_events",
  "marketing_media_assets",
  "marketing_stories",
  "marketing_abhi_extensions",
] as const;
