/** Client-safe Wise error helpers (no Node / server imports). */

export function isWiseStatementAccessError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    ((message.includes("(403)") || message.includes("403")) &&
      lower.includes("balance-statement")) ||
    lower.includes("statement_access_denied")
  );
}
