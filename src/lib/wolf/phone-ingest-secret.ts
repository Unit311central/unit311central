/** Stable secret for GPSLogger HMAC tokens (prefer dedicated env over rotating service role). */
export function wolfPhoneIngestSecret(): string {
  const dedicated = process.env.WOLF_PHONE_INGEST_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}
