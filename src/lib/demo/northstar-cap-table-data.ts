/**
 * Northstar Demo — cap table single source of truth (GBP, UK Companies Act ordinary shares).
 *
 * Ownership: Paul Fotheringham 60% · pre-seed investors 33% · employee option pool 7% (FD 100%).
 * Pre-seed (£1M): lead £500k + four investors at £125k each.
 */

export const NORTHSTAR_COMPANY_NAME = "Northstar Industrial Technologies Ltd";
export const NORTHSTAR_AUTHORISED_SHARES = 10_000_000;
export const NORTHSTAR_NOMINAL_PER_SHARE_GBP = 0.1;

export type NorthstarShareClass = "Ordinary shares" | "Preference shares" | "Options";
export type NorthstarShareType = "Equity" | "Options";

export type NorthstarCapTableRow = {
  id: string;
  holder: string;
  role: string;
  shareClass: NorthstarShareClass;
  shareType: NorthstarShareType;
  shares: number;
  ownershipPct: number;
  investmentGbp: number | null;
  pricePerShareGbp: number | null;
  issueDate: string;
  notes: string;
};

export type NorthstarOptionGrant = {
  id: string;
  employee: string;
  role: string;
  options: number;
  grantDate: string;
  vesting: string;
  status: "Active" | "Exercised" | "Cancelled";
};

export type NorthstarCapTableSnapshot = {
  shareholders: NorthstarCapTableRow[];
  optionGrants: NorthstarOptionGrant[];
  optionPool: {
    authorisedPct: number;
    authorisedShares: number;
    issuedShares: number;
    reservedShares: number;
    lastUpdated: string;
  };
  capital: {
    authorisedShareCapitalGbp: string;
    issuedShareCapitalGbp: string;
    currency: "GBP";
  };
};

const PAUL_SHARES = 6_000_000;
const LEAD_SHARES = 1_650_000;
const MINOR_INVESTOR_SHARES = 412_500;
const OPTION_POOL_SHARES = 700_000;
const OPTIONS_PER_EMPLOYEE = 10_000;

export const NORTHSTAR_PRE_SEED_LEAD_GBP = 500_000;
export const NORTHSTAR_PRE_SEED_MINOR_GBP = 125_000;

export function buildNorthstarCapTableSnapshot(): NorthstarCapTableSnapshot {
  const shareholders: NorthstarCapTableRow[] = [
    {
      id: "cap-paul",
      holder: "Paul Fotheringham",
      role: "Founder · CEO",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: PAUL_SHARES,
      ownershipPct: 60,
      investmentGbp: null,
      pricePerShareGbp: null,
      issueDate: "2023-04-01",
      notes: "Founder ordinary equity",
    },
    {
      id: "cap-ntv",
      holder: "Northern Tech Ventures",
      role: "Pre-seed lead investor",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: LEAD_SHARES,
      ownershipPct: 16.5,
      investmentGbp: NORTHSTAR_PRE_SEED_LEAD_GBP,
      pricePerShareGbp: 0.303,
      issueDate: "2023-06-15",
      notes: "Lead · UK VC · pre-seed round",
    },
    {
      id: "cap-hfc",
      holder: "Harwood Family Capital",
      role: "Pre-seed investor",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: MINOR_INVESTOR_SHARES,
      ownershipPct: 4.125,
      investmentGbp: NORTHSTAR_PRE_SEED_MINOR_GBP,
      pricePerShareGbp: 0.303,
      issueDate: "2023-06-15",
      notes: "UK family office",
    },
    {
      id: "cap-selby",
      holder: "Selby Private Investments",
      role: "Pre-seed investor",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: MINOR_INVESTOR_SHARES,
      ownershipPct: 4.125,
      investmentGbp: NORTHSTAR_PRE_SEED_MINOR_GBP,
      pricePerShareGbp: 0.303,
      issueDate: "2023-06-20",
      notes: "UK family office",
    },
    {
      id: "cap-hart-angel",
      holder: "Elena Hart",
      role: "Pre-seed angel",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: MINOR_INVESTOR_SHARES,
      ownershipPct: 4.125,
      investmentGbp: NORTHSTAR_PRE_SEED_MINOR_GBP,
      pricePerShareGbp: 0.303,
      issueDate: "2023-06-22",
      notes: "UK angel · non-founder",
    },
    {
      id: "cap-aip",
      holder: "Austin Industrial Partners",
      role: "Pre-seed investor",
      shareClass: "Ordinary shares",
      shareType: "Equity",
      shares: MINOR_INVESTOR_SHARES,
      ownershipPct: 4.125,
      investmentGbp: NORTHSTAR_PRE_SEED_MINOR_GBP,
      pricePerShareGbp: 0.303,
      issueDate: "2023-07-01",
      notes: "US angel syndicate",
    },
    {
      id: "cap-esop",
      holder: "Employee option pool",
      role: "ESOP reserve (50,000 issued · 650,000 unallocated)",
      shareClass: "Options",
      shareType: "Options",
      shares: OPTION_POOL_SHARES,
      ownershipPct: 7,
      investmentGbp: null,
      pricePerShareGbp: null,
      issueDate: "2023-08-01",
      notes: "Full 7% FD pool · grants tracked below",
    },
  ];

  const optionGrants: NorthstarOptionGrant[] = [
    {
      id: "opt-1",
      employee: "James Okonkwo",
      role: "CTO",
      options: OPTIONS_PER_EMPLOYEE,
      grantDate: "2024-03-01",
      vesting: "4 yr · 1 yr cliff",
      status: "Active",
    },
    {
      id: "opt-2",
      employee: "Priya Shah",
      role: "CFO",
      options: OPTIONS_PER_EMPLOYEE,
      grantDate: "2024-03-01",
      vesting: "4 yr · 1 yr cliff",
      status: "Active",
    },
    {
      id: "opt-3",
      employee: "Marcus Reed",
      role: "US General Manager",
      options: OPTIONS_PER_EMPLOYEE,
      grantDate: "2025-01-15",
      vesting: "4 yr · 1 yr cliff",
      status: "Active",
    },
    {
      id: "opt-4",
      employee: "Elena Hart",
      role: "Managing Director",
      options: OPTIONS_PER_EMPLOYEE,
      grantDate: "2024-06-01",
      vesting: "4 yr · 1 yr cliff",
      status: "Active",
    },
    {
      id: "opt-5",
      employee: "Amira Hassan",
      role: "Head of Delivery",
      options: OPTIONS_PER_EMPLOYEE,
      grantDate: "2025-04-01",
      vesting: "4 yr · 1 yr cliff",
      status: "Active",
    },
  ];

  const issuedShares = shareholders.reduce((sum, row) => sum + row.shares, 0);
  const issuedOptions = optionGrants.reduce((sum, row) => sum + row.options, 0);

  return {
    shareholders,
    optionGrants,
    optionPool: {
      authorisedPct: 7,
      authorisedShares: OPTION_POOL_SHARES,
      issuedShares: issuedOptions,
      reservedShares: OPTION_POOL_SHARES - issuedOptions,
      lastUpdated: "2026-08-10",
    },
    capital: {
      authorisedShareCapitalGbp: `£${(NORTHSTAR_AUTHORISED_SHARES * NORTHSTAR_NOMINAL_PER_SHARE_GBP).toLocaleString("en-GB")}`,
      issuedShareCapitalGbp: `£${(issuedShares * NORTHSTAR_NOMINAL_PER_SHARE_GBP).toLocaleString("en-GB")}`,
      currency: "GBP",
    },
  };
}
