"use client";

import Link from "next/link";
import { CalendarDays, CreditCard, Users2 } from "lucide-react";

import {
  ABHI_MEMBERSHIP_FEE_GBP,
  buildMemberBillingRow,
  formatAbhiBillingDate,
  formatAbhiGbp,
} from "@/lib/abhi-billing";
import {
  ABHI_MEMBER_EVENTS,
  formatMemberPortalDate,
  memberPortalHref,
} from "@/lib/abhi/member-portal-data";
import { getAbhiMemberOrgProfile } from "@/lib/abhi/member-funding-profile";

type BaseProps = {
  companyPath: string;
  companyId: string;
  companyName: string;
};

export function AbhiMemberMembershipOverview({
  companyPath,
  companyId,
  companyName,
}: BaseProps) {
  const profile = getAbhiMemberOrgProfile(companyId, companyName);
  const billing = buildMemberBillingRow({ id: companyId, companyName });

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Membership
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Membership Overview</h1>
        <p className="mt-1 text-sm text-white/55">
          Your ABHI membership status, billing, and organisation profile.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#f4a6c4]" />
            <h2 className="text-sm font-semibold text-white">Membership status</h2>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Organisation" value={profile.organisationName} />
            <Row label="Status" value={profile.membershipStatus} />
            <Row label="Member since" value={profile.memberSince} />
            <Row label="Next renewal" value={formatMemberPortalDate(profile.nextRenewal)} />
            <Row
              label="Annual fee"
              value={formatAbhiGbp(ABHI_MEMBERSHIP_FEE_GBP)}
            />
            <Row label="Last payment" value={formatAbhiBillingDate(billing.lastPaymentDate)} />
            <Row label="Next payment" value={formatAbhiBillingDate(billing.nextPaymentDate)} />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Organisation profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Country" value={profile.country} />
            <Row label="Organisation type" value={profile.organisationType} />
            <Row label="Industry" value={profile.industry} />
            <Row label="Sector" value={profile.sector} />
            <Row label="University collaboration" value={profile.universityCollaboration ? "Yes" : "No"} />
            <Row label="NHS collaboration" value={profile.nhsCollaboration ? "Yes" : "No"} />
          </dl>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-white/40">Capabilities</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-white/75">
              {profile.capabilities.map((cap) => (
                <li key={cap}>{cap}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={memberPortalHref(companyPath, "/membership/events")}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
        >
          Events & Programmes
        </Link>
        <Link
          href={memberPortalHref(companyPath, "/membership/working-groups")}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
        >
          Working Groups
        </Link>
        <Link
          href={memberPortalHref(companyPath, "/funding")}
          className="rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-2 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
        >
          Funding & Opportunities
        </Link>
      </div>
    </div>
  );
}

export function AbhiMemberEventsPage({ companyName }: Pick<BaseProps, "companyName">) {
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#f4a6c4]" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Membership
            </p>
            <h1 className="text-2xl font-semibold text-white">Events & Programmes</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">
          Upcoming ABHI events available to {companyName}.
        </p>
      </header>

      <ul className="space-y-3">
        {ABHI_MEMBER_EVENTS.map((event) => (
          <li
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-white">{event.title}</p>
              <p className="text-xs text-white/45">{event.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#f4a6c4]">
                {formatMemberPortalDate(event.date)}
              </span>
              <button
                type="button"
                className="rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-1.5 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
              >
                Register
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AbhiMemberWorkingGroupsPage({
  companyName,
}: Pick<BaseProps, "companyName">) {
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-[#f4a6c4]" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Membership
            </p>
            <h1 className="text-2xl font-semibold text-white">Working Groups</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">
          Active working group membership for {companyName}.
        </p>
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <p className="text-base font-semibold text-white">Digital Health Working Group</p>
        <p className="mt-1 text-sm text-white/55">Next meeting · Thu 13 Aug · 14:00 BST</p>
        <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-white/70">
          <li>NHS digital adoption priorities</li>
          <li>WHX pavilion coordination</li>
          <li>Member spotlight opportunities</li>
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/8 pb-1.5">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-right text-white/85">{value}</dd>
    </div>
  );
}
