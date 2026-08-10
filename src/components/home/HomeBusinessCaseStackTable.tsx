"use client";

import { useState } from "react";

const STACK_ROWS = [
  { function: "Customer Management", product: "Pipedrive Premium", cost: "$8,160" },
  { function: "AI Intelligence", product: "Tableau", cost: "$8,000" },
  { function: "Project Management", product: "Airtable", cost: "$6,480" },
  { function: "Board Management", product: "Onboard", cost: "$2,500" },
  { function: "Marketing & Events", product: "Hubspot Starter", cost: "$2,400" },
  { function: "Human Resources", product: "PeopleHR Pro", cost: "$1,300" },
  { function: "Social Management", product: "Buffer Essentials", cost: "$600" },
  { function: "Finances & Accounting", product: "Xero", cost: "$1,500" },
  { function: "Cap Table Management", product: "Carta", cost: "$1,500" },
  {
    function: "Assets, Inventory & Procurement",
    product: "Sortly Premium",
    cost: "$1,788",
  },
  {
    function: "Info Repository & Communication",
    product: "Sharepoint, Teams Essentials",
    cost: "$1,480",
  },
  { function: "Support Desk", product: "Zoho support", cost: "$480" },
] as const;

const MOBILE_PREVIEW_COUNT = 4;

function ProductCostCells({
  product,
  cost,
  productClass = "text-white/50",
  costClass = "font-medium text-white/70",
}: {
  product?: string;
  cost: string;
  productClass?: string;
  costClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 sm:gap-8">
      <span className={`min-w-0 break-words ${product ? productClass : ""}`}>{product ?? ""}</span>
      <span className={`shrink-0 tabular-nums ${costClass}`}>{cost}</span>
    </div>
  );
}

export default function HomeBusinessCaseStackTable() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const mobileRows = mobileExpanded ? STACK_ROWS : STACK_ROWS.slice(0, MOBILE_PREVIEW_COUNT);
  const hiddenMobileCount = STACK_ROWS.length - MOBILE_PREVIEW_COUNT;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 sm:mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/90 sm:text-[13px] sm:tracking-[0.12em] lg:leading-snug">
          The Hidden Cost of Multiple Business Applications
        </h3>
        <p className="mt-2 text-[11px] leading-relaxed text-white/45 sm:text-xs">
          Most growing businesses gradually accumulate software to solve individual problems. The
          result is higher subscription costs, duplicated data, disconnected workflows and more time
          spent managing systems instead of running the business.
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-sky-300/20 bg-sky-400/[0.06] shadow-[inset_0_1px_0_rgba(186,230,253,0.12)] md:block">
        <table className="w-full table-fixed border-collapse text-left text-xs leading-snug lg:text-[13px]">
          <colgroup>
            <col className="w-[34%] sm:w-[36%] lg:w-[38%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-white/[0.08] bg-sky-400/[0.05]">
              <th className="px-3 py-2.5 font-semibold uppercase tracking-[0.08em] text-white/55 lg:px-4 lg:py-2.5">
                Function
              </th>
              <th className="px-3 py-2.5 lg:px-4 lg:py-2.5">
                <div className="flex items-start justify-between gap-6 font-semibold uppercase tracking-[0.08em] text-white/55 sm:gap-8">
                  <span>Example Product</span>
                  <span className="shrink-0 text-right">Annual Cost (10 Users)</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {STACK_ROWS.map((row, index) => (
              <tr
                key={row.function}
                className={
                  index % 2 === 0
                    ? "border-b border-sky-300/10 bg-transparent"
                    : "border-b border-sky-300/10 bg-sky-400/[0.04]"
                }
              >
                <td className="break-words px-3 py-1.5 align-top font-medium text-white/75 lg:px-4 lg:py-1.5">
                  {row.function}
                </td>
                <td className="px-3 py-1.5 align-top lg:px-4 lg:py-1.5">
                  <ProductCostCells product={row.product} cost={row.cost} />
                </td>
              </tr>
            ))}
            <tr className="border-b border-sky-300/10 bg-sky-400/[0.04]">
              <td className="px-3 py-1.5 font-medium text-white/75 lg:px-4 lg:py-1.5">
                Software research & selction
              </td>
              <td className="px-3 py-1.5 lg:px-4 lg:py-1.5">
                <div className="flex justify-end">
                  <span className="font-medium tabular-nums text-white/75">$3,900</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-sky-300/10 bg-sky-400/[0.04]">
              <td className="px-3 py-1.5 font-medium text-white/75 lg:px-4 lg:py-1.5">
                Implementation & Integration
              </td>
              <td className="px-3 py-1.5 lg:px-4 lg:py-1.5">
                <div className="flex justify-end">
                  <span className="font-medium tabular-nums text-white/75">$7,000</span>
                </div>
              </td>
            </tr>
            <tr className="border-t border-[#3b82f6]/30 bg-gradient-to-r from-[#2563eb]/[0.18] via-[#1d4ed8]/[0.12] to-[#2563eb]/[0.06]">
              <td className="px-3 py-2.5 lg:px-4 lg:py-3" />
              <td className="px-3 py-2.5 lg:px-4 lg:py-3">
                <div className="flex items-center justify-between gap-6 sm:gap-8">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bfdbfe] lg:text-[13px]">
                    TOTAL
                  </span>
                  <span className="text-xs font-bold tabular-nums text-white lg:text-sm">$45,788</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {mobileRows.map((row) => (
          <article
            key={row.function}
            className="rounded-xl border border-sky-300/20 bg-sky-400/[0.06] px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold text-white/80">{row.function}</p>
              <p className="shrink-0 text-xs font-medium tabular-nums text-white/70">{row.cost}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{row.product}</p>
          </article>
        ))}
        {hiddenMobileCount > 0 ? (
          <button
            type="button"
            onClick={() => setMobileExpanded((current) => !current)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-300/25 bg-sky-400/[0.08] px-3 py-3 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-400/[0.14]"
          >
            {mobileExpanded ? "Show fewer line items" : `Show ${hiddenMobileCount} more line items`}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className={mobileExpanded ? "rotate-180" : ""}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        ) : null}
        <article className="rounded-xl border border-sky-300/20 bg-sky-400/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Software research & selction</p>
            <p className="shrink-0 text-xs font-medium tabular-nums text-white/70">$3,900</p>
          </div>
        </article>
        <article className="rounded-xl border border-sky-300/20 bg-sky-400/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Implementation & Integration</p>
            <p className="shrink-0 text-xs font-medium tabular-nums text-white/70">$7,000</p>
          </div>
        </article>
        <article className="rounded-xl border border-[#3b82f6]/30 bg-gradient-to-r from-[#2563eb]/[0.18] to-[#2563eb]/[0.06] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#bfdbfe]">TOTAL</p>
            <p className="shrink-0 text-sm font-bold tabular-nums text-white">$45,788</p>
          </div>
        </article>
      </div>
    </div>
  );
}
