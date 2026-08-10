"use client";

import { useState } from "react";
import HomeBusinessCaseLeftPanel from "./HomeBusinessCaseLeftPanel";
import { HomeBusinessCaseToolStackBar } from "./HomeBusinessCaseToolStackBar";

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

const FUNCTION_COL =
  "whitespace-nowrap py-1.5 pr-3 align-top font-medium text-white/75 sm:pr-4 lg:py-1.5";
const PRODUCT_COL =
  "break-words py-1.5 pr-3 align-top text-white/50 sm:pr-4 lg:py-1.5";
const COST_COL =
  "px-2 py-1.5 text-center font-medium tabular-nums text-white/70 sm:px-3 lg:py-1.5";
const COST_HEADER =
  "px-2 py-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-white/55 whitespace-nowrap sm:px-3 sm:text-[11px] lg:py-2.5 lg:text-xs lg:tracking-[0.08em]";
const PRODUCT_HEADER =
  "py-2 pr-3 text-left font-semibold uppercase tracking-[0.08em] text-white/55 sm:pr-4 lg:py-2.5";

export default function HomeBusinessCaseStackTable() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const mobileRows = mobileExpanded ? STACK_ROWS : STACK_ROWS.slice(0, MOBILE_PREVIEW_COUNT);
  const hiddenMobileCount = STACK_ROWS.length - MOBILE_PREVIEW_COUNT;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch lg:gap-10">
      <HomeBusinessCaseLeftPanel />

      <div className="hidden h-full flex-col md:flex">
        <div className="overflow-hidden rounded-xl border border-sky-300/20 bg-sky-400/[0.06] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(186,230,253,0.12)] sm:px-3.5">
          <table className="w-full table-fixed border-collapse text-left text-xs leading-snug lg:text-[13px]">
          <colgroup>
            <col className="w-[48%]" />
            <col className="w-[30%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/[0.08] bg-sky-400/[0.05]">
              <th className="py-2 pr-3 text-left font-semibold uppercase tracking-[0.08em] text-white/55 sm:pr-4 lg:py-2.5">
                Function
              </th>
              <th className={PRODUCT_HEADER}>Example Product</th>
              <th className={COST_HEADER}>Annual Cost (10 Users)</th>
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
                <td className={FUNCTION_COL}>{row.function}</td>
                <td className={PRODUCT_COL}>{row.product}</td>
                <td className={COST_COL}>{row.cost}</td>
              </tr>
            ))}
            <tr className="border-b border-sky-300/10 bg-sky-400/[0.04]">
              <td className={FUNCTION_COL}>Software research & selction</td>
              <td className={PRODUCT_COL} />
              <td className={`${COST_COL} text-white/75`}>$3,900</td>
            </tr>
            <tr className="border-b border-sky-300/10 bg-sky-400/[0.04]">
              <td className={`${FUNCTION_COL} pb-4 lg:pb-5`}>Implementation & Integration</td>
              <td className={`${PRODUCT_COL} pb-4 lg:pb-5`} />
              <td className={`${COST_COL} pb-4 text-white/75 lg:pb-5`}>$7,000</td>
            </tr>
          </tbody>
        </table>
        </div>
        <HomeBusinessCaseToolStackBar className="mt-4 px-3 sm:px-3.5" />
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
        <article className="rounded-xl border border-sky-300/20 bg-sky-400/[0.06] px-3 py-2.5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Implementation & Integration</p>
            <p className="shrink-0 text-xs font-medium tabular-nums text-white/70">$7,000</p>
          </div>
        </article>
        <HomeBusinessCaseToolStackBar className="px-1 pt-2" />
      </div>
    </div>
  );
}
