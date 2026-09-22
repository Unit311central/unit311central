export function formatSalesQuoteDisplayDate(iso: string | null | undefined): string {
  const trimmed = iso?.trim();
  if (!trimmed) return "—";
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return trimmed;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
