"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  PoundSterling,
  Sparkles,
  Users2,
} from "lucide-react";

import {
  ABHI_MEMBER_EVENTS,
  formatMemberPortalDate,
  memberPortalHref,
} from "@/lib/abhi/member-portal-data";
import {
  buildAbhiFundingDashboard,
  formatFundingGbp,
} from "@/lib/abhi/member-funding-data";
import { getAbhiMemberOrgProfile } from "@/lib/abhi/member-funding-profile";

type Props = {
  companyPath: string;
  companyId: string;
  companyName: string;
};

export function AbhiMemberHomeDashboard({
  companyPath,
  companyId,
  companyName,
}: Props) {
  const profile = getAbhiMemberOrgProfile(companyId, companyName);
  const funding = buildAbhiFundingDashboard(companyId, companyName);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#C2185B]/25 via-[#0d1b2e] to-[#07111f] p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f4a6c4]/90">
          Welcome back
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {companyName}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            Membership Status: {profile.membershipStatus}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75">
            Member Since: {profile.memberSince}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75">
            Next Renewal: {formatMemberPortalDate(profile.nextRenewal)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Funding Opportunities"
            value={String(funding.openCount)}
            accent
          />
          <StatTile label="Upcoming Events" value={String(ABHI_MEMBER_EVENTS.length)} />
          <StatTile label="Working Groups" value={String(profile.workingGroupCount)} />
        </div>
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Quick actions</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href={memberPortalHref(companyPath, "/funding")}
            icon={<PoundSterling className="h-4 w-4" />}
            label="View Funding Opportunities"
          />
          <QuickAction
            href={memberPortalHref(companyPath, "/membership/events")}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Register For Events"
          />
          <QuickAction
            href="mailto:membership@abhi.org.uk"
            icon={<MessageCircle className="h-4 w-4" />}
            label="Contact ABHI"
            external
          />
          <QuickAction
            href={memberPortalHref(companyPath, "/assistant")}
            icon={<Sparkles className="h-4 w-4" />}
            label="Ask Member Assistant"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#C2185B]/25 bg-gradient-to-br from-[#C2185B]/12 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
              Opportunity highlights
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Top Funding Opportunities For {companyName.replace(/ Ltd$/i, "")}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Personalised matches · refreshed {funding.refreshedAt} ·{" "}
              {formatFundingGbp(funding.potentialFundingGbp)} potential
            </p>
          </div>
          <Link
            href={memberPortalHref(companyPath, "/funding")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-2 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {funding.topHighlights.map((opp) => (
            <Link
              key={opp.id}
              href={memberPortalHref(companyPath, "/funding")}
              className="rounded-xl border border-white/12 bg-[#0b1524]/70 p-4 transition hover:border-[#C2185B]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{opp.programme}</p>
                <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                  Match {opp.matchScore}%
                </span>
              </div>
              <p className="mt-1 text-xs text-white/45">{opp.awardingBody}</p>
              <p className="mt-3 text-xs text-white/65 line-clamp-2">{opp.challengeSummary}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#f4a6c4]" />
            <h2 className="text-sm font-semibold text-white">Upcoming events</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {ABHI_MEMBER_EVENTS.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{event.title}</p>
                  <p className="text-xs text-white/40">{event.location}</p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[#f4a6c4]">
                  {formatMemberPortalDate(event.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-[#f4a6c4]" />
            <h2 className="text-sm font-semibold text-white">Working groups</h2>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-sm font-semibold text-white">Digital Health Working Group</p>
            <p className="mt-1 text-sm text-white/55">Next meeting · Thu 13 Aug · 14:00 BST</p>
            <p className="mt-3 text-xs text-white/40">
              NHS digital adoption · WHX pavilion · Member spotlight
            </p>
            <Link
              href={memberPortalHref(companyPath, "/membership/working-groups")}
              className="mt-3 inline-flex text-xs font-semibold text-[#f4a6c4] hover:underline"
            >
              Open working groups
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-xl border border-[#C2185B]/35 bg-[#C2185B]/15 px-4 py-3"
          : "rounded-xl border border-white/12 bg-black/25 px-4 py-3"
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/25 px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:border-[#C2185B]/40 hover:bg-[#C2185B]/10";
  if (external) {
    return (
      <a href={href} className={className}>
        <span className="text-[#f4a6c4]">{icon}</span>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span className="text-[#f4a6c4]">{icon}</span>
      {label}
    </Link>
  );
}
