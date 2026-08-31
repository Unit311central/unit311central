import type { AddressObject, Headers } from "mailparser";

import type { EmailManagedAddress } from "@/lib/email/types";

export type { EmailManagedAddressKind } from "@/lib/email/types";

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function parseAddressToken(value: string): string {
  const match = value.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  return normalizeEmail(match?.[1] ?? value);
}

function extractHeaderValues(headers: Headers | undefined, names: string[]): string[] {
  if (!headers) return [];
  const values: string[] = [];
  for (const name of names) {
    const raw = headers.get(name);
    if (!raw) continue;
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (typeof entry === "string") values.push(entry);
      }
    } else if (typeof raw === "string") {
      values.push(raw);
    }
  }
  return values;
}

function addressesFromField(field: AddressObject | AddressObject[] | undefined): string[] {
  const rows = Array.isArray(field) ? field : field ? [field] : [];
  const emails: string[] = [];
  for (const row of rows) {
    for (const entry of row.value ?? []) {
      const email = normalizeEmail(entry.address ?? "");
      if (email) emails.push(email);
    }
  }
  return emails;
}

function firstManagedMatch(candidates: string[], managedSet: Set<string>, fallback: string): string {
  for (const candidate of candidates) {
    const normalized = parseAddressToken(candidate);
    if (managedSet.has(normalized)) return normalized;
  }
  return fallback;
}

export function resolveReceivedByAddress(input: {
  headers: Headers | undefined;
  to: AddressObject | AddressObject[] | undefined;
  cc: AddressObject | AddressObject[] | undefined;
  managedAddresses: readonly EmailManagedAddress[];
  mailboxAuthEmail: string;
}): string {
  const managed = input.managedAddresses.map((entry) => normalizeEmail(entry.address)).filter(Boolean);
  const managedSet = new Set(managed);
  const primary =
    normalizeEmail(
      input.managedAddresses.find((entry) => entry.kind === "primary")?.address ??
        input.mailboxAuthEmail,
    ) || normalizeEmail(input.mailboxAuthEmail);

  if (managedSet.size === 0) {
    return primary;
  }

  const headerCandidates = extractHeaderValues(input.headers, [
    "delivered-to",
    "x-original-to",
    "envelope-to",
    "x-zoho-original-to",
    "x-received-for",
  ]).flatMap((value) => value.split(","));

  const toCandidates = addressesFromField(input.to);
  const ccCandidates = addressesFromField(input.cc);

  return firstManagedMatch(
    [...headerCandidates, ...toCandidates, ...ccCandidates],
    managedSet,
    primary,
  );
}

export function resolveSentFromAddress(input: {
  fromEmail: string;
  managedAddresses: readonly EmailManagedAddress[];
  mailboxAuthEmail: string;
}): string {
  const managedSet = new Set(
    input.managedAddresses.map((entry) => normalizeEmail(entry.address)).filter(Boolean),
  );
  const from = normalizeEmail(input.fromEmail);
  if (from && managedSet.has(from)) return from;
  const primary =
    input.managedAddresses.find((entry) => entry.kind === "primary")?.address ??
    input.mailboxAuthEmail;
  return normalizeEmail(primary) || normalizeEmail(input.mailboxAuthEmail);
}

export function isAllowedFromAddress(
  fromAddress: string | null | undefined,
  managedAddresses: readonly EmailManagedAddress[],
): boolean {
  const normalized = normalizeEmail(fromAddress);
  if (!normalized) return false;
  return managedAddresses.some((entry) => normalizeEmail(entry.address) === normalized);
}

export function primaryManagedAddress(
  managedAddresses: readonly EmailManagedAddress[],
  mailboxAuthEmail: string,
): string {
  return (
    normalizeEmail(
      managedAddresses.find((entry) => entry.kind === "primary")?.address ?? mailboxAuthEmail,
    ) || normalizeEmail(mailboxAuthEmail)
  );
}
