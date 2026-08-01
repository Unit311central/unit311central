/**
 * ABHI Billing — membership fees (£3,000) and website listing (£1,000 / year).
 */

import type { ManagedClient } from "@/lib/client-management-data";

export const ABHI_MEMBERSHIP_FEE_GBP = 3000;
export const ABHI_WEBSITE_LISTING_FEE_GBP = 1000;

export type AbhiBillingRowStatus = "Current" | "Due soon" | "Outstanding";

export type AbhiBillingRow = {
  id: string;
  name: string;
  lastPaymentDate: string;
  lastPaymentAmountGbp: number;
  nextPaymentDate: string;
  amountDueGbp: number;
  outstandingGbp: number;
  status: AbhiBillingRowStatus;
  billingCycle: "Annually";
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date.getTime());
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Stable anniversary billing schedule derived from member id. */
export function buildMemberBillingRow(
  client: Pick<ManagedClient, "id" | "companyName">,
  now = new Date(),
): AbhiBillingRow {
  const seed = hashSeed(client.id);
  const monthsAgo = 1 + (seed % 11);
  const dayOfMonth = 1 + (seed % 27);

  const last = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
  let next = addYears(last, 1);
  // Keep next payment in the forward window if anniversary already passed this cycle.
  while (startOfDay(next) < startOfDay(now)) {
    next = addYears(next, 1);
  }

  const daysUntilNext = Math.round(
    (startOfDay(next).getTime() - startOfDay(now).getTime()) / (24 * 60 * 60 * 1000),
  );
  const isOverdueCycle = (seed % 17) === 0;
  const outstandingGbp = isOverdueCycle ? ABHI_MEMBERSHIP_FEE_GBP : 0;
  const amountDueGbp =
    outstandingGbp > 0 || daysUntilNext <= 45 ? ABHI_MEMBERSHIP_FEE_GBP : 0;

  let status: AbhiBillingRowStatus = "Current";
  if (outstandingGbp > 0) status = "Outstanding";
  else if (daysUntilNext <= 45) status = "Due soon";

  return {
    id: client.id,
    name: client.companyName,
    lastPaymentDate: formatIsoDate(last),
    lastPaymentAmountGbp: ABHI_MEMBERSHIP_FEE_GBP,
    nextPaymentDate: formatIsoDate(isOverdueCycle ? addDays(now, -((seed % 40) + 5)) : next),
    amountDueGbp,
    outstandingGbp,
    status,
    billingCycle: "Annually",
  };
}

export function buildAbhiMemberBillingRows(
  clients: Pick<ManagedClient, "id" | "companyName">[],
  now = new Date(),
): AbhiBillingRow[] {
  return [...clients]
    .map((client) => buildMemberBillingRow(client, now))
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
}

export function buildAbhiWebsiteListingRow(now = new Date()): AbhiBillingRow {
  const last = new Date(now.getFullYear() - 1, 3, 1); // 1 Apr prior year
  const next = addYears(last, 1);
  const nextInFuture = startOfDay(next) < startOfDay(now) ? addYears(next, 1) : next;
  const daysUntilNext = Math.round(
    (startOfDay(nextInFuture).getTime() - startOfDay(now).getTime()) / (24 * 60 * 60 * 1000),
  );
  const amountDueGbp = daysUntilNext <= 60 ? ABHI_WEBSITE_LISTING_FEE_GBP : 0;

  return {
    id: "abhi-website-listing",
    name: "ABHI Website listing",
    lastPaymentDate: formatIsoDate(last),
    lastPaymentAmountGbp: ABHI_WEBSITE_LISTING_FEE_GBP,
    nextPaymentDate: formatIsoDate(nextInFuture),
    amountDueGbp,
    outstandingGbp: 0,
    status: amountDueGbp > 0 ? "Due soon" : "Current",
    billingCycle: "Annually",
  };
}

export function formatAbhiGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAbhiBillingDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
