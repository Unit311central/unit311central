"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import {
  marketingFadeIn,
  marketingPageIntro,
  marketingPageTitle,
  MARKETING_CONTENT_CLASS,
} from "@/lib/marketing-ui";
import { CONTACT } from "@/lib/site";

const FAQ_ITEMS = [
  {
    question: "Who is Unit311 Central designed for?",
    answer:
      "Unit311 Central is built for early-stage startups, growing startups, scaleups and SMEs that need one connected operating platform—especially teams replacing disconnected software, spreadsheets and point tools with a single source of truth.",
  },
  {
    question: "Can I start with one workspace?",
    answer:
      "Yes. Most organisations begin with the workspaces that create the most immediate value—such as Business Central, Clients & Projects, Financials or the AI Executive Assistant—then expand as teams adopt the platform.",
  },
  {
    question: "Can I connect existing software?",
    answer:
      "Yes. Business App Integrations connect common project management, accounting, CRM, communications and storage systems by business function, so you can keep specialist tools while Unit311 Central becomes the operating layer.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Timelines depend on how many workspaces you launch, data migration needs and how many teams go live first. Many organisations start with a focused pilot in weeks, then phase additional workspaces against clear milestones.",
  },
  {
    question: "Can external clients collaborate?",
    answer:
      "Yes. You can involve external clients and partners in the right places—such as project delivery, documents, meetings and support—while keeping internal finance, HR and corporate information appropriately controlled.",
  },
  {
    question: "Can the Executive Assistant perform business actions?",
    answer:
      "Yes. Beyond answering questions, the AI Executive Assistant can search across the business, generate reports and board packs, recommend next steps and help execute workflows where your organisation has enabled them.",
  },
  {
    question: "Can workflows be customised?",
    answer:
      "Yes. Approval workflows and operating processes can be tailored to how your business actually works—across areas such as projects, finance, HR and operations—so the platform fits your controls rather than forcing a generic process.",
  },
  {
    question: "How secure is my data?",
    answer:
      "Security is built into the platform: role-based access, encrypted transport, audit-friendly workflows and isolated organisation workspaces. Read more on our Platform Security page, or ask us about controls relevant to your industry.",
  },
  {
    question: "Can I add workspaces later?",
    answer:
      "Yes. Unit311 Central is modular by design. Start with what you need now and add Financials, HR, Operations, Corporate, Productivity or Integrations when the business is ready—without rebuilding your operating model.",
  },
] as const;

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 bg-white px-4 py-4 text-left transition-colors hover:bg-[#f8fafc] sm:gap-4 sm:px-6 sm:py-5"
      >
        <span className="min-w-0 flex-1 break-words text-[15px] font-semibold text-[#0b2d63] sm:text-[17px]">
          {question}
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-[#0b2d63] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-[#0b2d63]/10 bg-[#eef5ff] px-5 pb-5 pt-4 text-[15px] leading-relaxed text-[#0b2d63] sm:px-6">
            {answer}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function FaqPageContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MarketingPageShell
      contentClassName={`${MARKETING_CONTENT_CLASS} space-y-14 sm:space-y-16 lg:space-y-20`}
    >
      <div className={`max-w-3xl ${marketingFadeIn}`}>
        <h1 className={marketingPageTitle}>Frequently asked questions</h1>
        <p className={marketingPageIntro}>
          Practical answers for teams evaluating Unit311 Central—who it&apos;s for, how you start,
          what connects, and how the platform grows with your business.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4">
        {FAQ_ITEMS.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            open={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

      <div
        className={`rounded-[28px] border border-[#3b82f6]/20 bg-gradient-to-b from-[#1a4668] to-[#0f2f4d] px-6 py-10 text-center shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:px-10 ${marketingFadeIn}`}
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Still have questions?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80 sm:text-[17px]">
          Book a founder session or email{" "}
          <a
            href={`mailto:${CONTACT.infoEmail}`}
            className="font-medium text-[#93c5fd] hover:text-[#bfdbfe] hover:underline"
          >
            {CONTACT.infoEmail}
          </a>{" "}
          and we&apos;ll respond within one business day.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/book"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0b2d63] transition-colors hover:bg-white/90"
          >
            Book a session
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Contact us
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
