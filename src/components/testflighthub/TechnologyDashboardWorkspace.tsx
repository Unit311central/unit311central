"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceDashboard } from "@/components/dashboard-framework";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import {
  ABHI_TECH_DEVICES,
  ABHI_UPCOMING_TECH_RENEWALS,
  buildAbhiTechSpendTrend,
  loadAbhiTelecoms,
  sumAbhiTelecomMonthlySpend,
} from "@/lib/abhi-tech-fake-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import {
  OA_TECH_DEVICES,
  OA_UPCOMING_TECH_RENEWALS,
  buildOaTechSpendTrend,
  loadOaTelecoms,
  sumOaTelecomMonthlySpend,
} from "@/lib/onwardair/tech-fake-data";
import { buildTechnologyManagementDashboardConfig } from "@/lib/technology-management-dashboard";

type SoftwareAssetRow = {
  id?: string;
  status?: string | null;
  nextRenewalDate?: string | null;
  currency?: string | null;
  annualCost?: number | null;
  monthlyCost?: number | null;
};

function daysUntil(iso: string | null | undefined) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

/**
 * Technology Management — Dashboard
 * Live Software & SaaS metrics; ABHI / OnwardAir add devices, telecom, and renewals.
 */
export default function TechnologyDashboardWorkspace() {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const isAbhi = isBrowserAbhiSurface();
  const isOa = isBrowserOnwardAirSurface();
  const hasEstate = isAbhi || isOa;
  const [assets, setAssets] = useState<SoftwareAssetRow[]>([]);
  const [summary, setSummary] = useState<{
    annualSpend?: number;
    monthlySpend?: number;
    currency?: string;
    renewalsDueIn30Days?: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [telecomMonthly, setTelecomMonthly] = useState(0);

  useEffect(() => {
    if (isAbhi) {
      setTelecomMonthly(sumAbhiTelecomMonthlySpend(loadAbhiTelecoms()));
    } else if (isOa) {
      setTelecomMonthly(sumOaTelecomMonthlySpend(loadOaTelecoms()));
    }
  }, [isAbhi, isOa]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/software-assets", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load software assets");
        const data = (await response.json()) as {
          assets?: SoftwareAssetRow[];
          summary?: {
            annualSpend?: number;
            monthlySpend?: number;
            currency?: string;
            renewalsDueIn30Days?: number;
          };
        };
        const rows = data.assets ?? [];
        if (!cancelled) {
          setAssets(Array.isArray(rows) ? rows : []);
          setSummary(data.summary ?? null);
        }
      } catch {
        if (!cancelled) {
          setAssets([]);
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    const activeCount = assets.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      return status === "active" || status === "trial" || !status;
    }).length;
    const renewingSoonCount =
      summary?.renewalsDueIn30Days ??
      assets.filter((row) => {
        const days = daysUntil(row.nextRenewalDate);
        return days != null && days >= 0 && days <= 60;
      }).length;
    const monthlySpend = summary?.monthlySpend ?? 0;

    const estate = isAbhi
      ? (() => {
          const trend = buildAbhiTechSpendTrend({
            softwareMonthlyGbp: monthlySpend,
            telecomMonthlyGbp: telecomMonthly,
          });
          return {
            brandLabel: "ABHI",
            devicesCount: ABHI_TECH_DEVICES.length,
            telecomMonthly,
            currency: "GBP",
            spendTrendMomPct: trend.momPct,
            spendTrendMom: trend.momGbp,
            spendTrendLabels: trend.labels,
            spendTrendValues: trend.values,
            upcomingRenewals: ABHI_UPCOMING_TECH_RENEWALS.map((row) => ({
              id: row.id,
              label: row.label,
              category: row.category,
              dueDate: row.dueDate,
              cost: row.costGbp,
            })),
          };
        })()
      : isOa
        ? (() => {
            const trend = buildOaTechSpendTrend({
              softwareMonthlyUsd: monthlySpend,
              telecomMonthlyUsd: telecomMonthly,
            });
            return {
              brandLabel: "OnwardAir",
              devicesCount: OA_TECH_DEVICES.length,
              telecomMonthly,
              currency: "USD",
              spendTrendMomPct: trend.momPct,
              spendTrendMom: trend.momUsd,
              spendTrendLabels: trend.labels,
              spendTrendValues: trend.values,
              upcomingRenewals: OA_UPCOMING_TECH_RENEWALS.map((row) => ({
                id: row.id,
                label: row.label,
                category: row.category,
                dueDate: row.dueDate,
                cost: row.costUsd,
              })),
            };
          })()
        : undefined;

    return buildTechnologyManagementDashboardConfig({
      softwareCount: assets.length,
      activeCount,
      renewingSoonCount,
      annualSpend: summary?.annualSpend,
      monthlySpend,
      currency: summary?.currency ?? (isOa ? "USD" : undefined),
      estate,
    });
  }, [assets, summary, isAbhi, isOa, telecomMonthly]);

  return (
    <div className="space-y-3">
      {!loaded ? (
        <p className="text-sm text-white/45">
          {hasEstate ? "Loading technology estate…" : "Loading software register…"}
        </p>
      ) : null}
      <WorkspaceDashboard
        config={config}
        audience={{ workspaceId: "technology", role: "standard-user" }}
        onAction={(action) => {
          if (action === "open-software") {
            router.push(getInternalNavHref("technology-software", basePath));
          }
          if (action === "open-devices") {
            router.push(getInternalNavHref("technology-devices", basePath));
          }
          if (action === "open-telecom") {
            router.push(getInternalNavHref("technology-telecommunications", basePath));
          }
        }}
      />
    </div>
  );
}
