/**
 * CorpCentre financial fixtures — canonical AUD cash for dashboards / ledgers.
 * Keep this as the single product number for “current cash balance”.
 */

export const CORPCENTRE_WORKSPACE_SLUGS = new Set(["corpcentre", "corporatecentre"]);

/** Canonical current cash on hand for CorpCentre (AUD). */
export const CORPCENTRE_CASH_BALANCE_AUD = 2_000_000;

/**
 * Split across Sydney bank accounts (Corporate → Banks).
 * Totals must equal {@link CORPCENTRE_CASH_BALANCE_AUD}.
 */
export const CORPCENTRE_BANK_BALANCES_AUD = {
  cbaOperating: 1_200_000,
  westpacReceipts: 450_000,
  anzTreasury: 350_000,
} as const;

export function isCorpCentreWorkspaceSlug(slug: string | null | undefined): boolean {
  return CORPCENTRE_WORKSPACE_SLUGS.has(String(slug ?? "").trim().toLowerCase());
}

export function assertCorpCentreBankBalancesTotal(): void {
  const total =
    CORPCENTRE_BANK_BALANCES_AUD.cbaOperating +
    CORPCENTRE_BANK_BALANCES_AUD.westpacReceipts +
    CORPCENTRE_BANK_BALANCES_AUD.anzTreasury;
  if (total !== CORPCENTRE_CASH_BALANCE_AUD) {
    throw new Error(
      `CorpCentre bank balances (${total}) must equal CORPCENTRE_CASH_BALANCE_AUD (${CORPCENTRE_CASH_BALANCE_AUD})`,
    );
  }
}
