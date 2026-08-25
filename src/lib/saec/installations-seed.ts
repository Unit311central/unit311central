import {
  SAEC_FICTIONAL_CUSTOMERS,
  SAEC_FICTIONAL_SITES,
  SAEC_INSTALLATION_CITY_COUNTS,
  SAEC_INSTALLATION_CITIES,
  citySlugForLabel,
} from "@/lib/saec/installations-cities";
import { SAEC_INSTALLATION_ENGINEERS } from "@/lib/saec/installations-engineers";
import type {
  SaecInstallationAsset,
  SaecInstallationAssetType,
  SaecMaintenanceRecord,
} from "@/lib/saec/installations-types";

const ELEVATOR_MODEL_PREFIX: Record<string, string> = {
  "KLH Goods Lift": "KLH",
  "KLK1 MRA Lift": "KLK1",
  "KLG Panorama Elevator": "KLG",
  "KLW MRL Lift": "KLW",
};

const ESCALATOR_MODEL_PREFIX: Record<string, string> = {
  "KLF Commercial": "KLF",
  "KRF/KLRP Moving Walk": "KRF",
};

const ELEVATOR_MODEL_WEIGHTS: Array<{ model: string; weight: number }> = [
  { model: "KLH Goods Lift", weight: 40 },
  { model: "KLK1 MRA Lift", weight: 40 },
  { model: "KLG Panorama Elevator", weight: 5 },
  { model: "KLW MRL Lift", weight: 15 },
];

function pad(n: number, size = 3) {
  return String(n).padStart(size, "0");
}

function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function buildExactElevatorModels(): string[] {
  return [
    ...Array.from({ length: 160 }, () => "KLH Goods Lift"),
    ...Array.from({ length: 160 }, () => "KLK1 MRA Lift"),
    ...Array.from({ length: 20 }, () => "KLG Panorama Elevator"),
    ...Array.from({ length: 60 }, () => "KLW MRL Lift"),
  ];
}

function buildExactEscalatorModels(): string[] {
  return [
    ...Array.from({ length: 200 }, () => "KLF Commercial"),
    ...Array.from({ length: 200 }, () => "KRF/KLRP Moving Walk"),
  ];
}

function siteSlug(siteName: string) {
  return siteName
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function buildSaecInstallationSeed(
  workspaceId: string,
): { assets: SaecInstallationAsset[]; maintenance: SaecMaintenanceRecord[] } {
  const now = new Date().toISOString();
  const assets: SaecInstallationAsset[] = [];
  const maintenance: SaecMaintenanceRecord[] = [];
  let globalIndex = 0;
  const elevatorModels = buildExactElevatorModels();
  const escalatorModels = buildExactEscalatorModels();

  for (const city of SAEC_INSTALLATION_CITIES) {
    const counts = SAEC_INSTALLATION_CITY_COUNTS[city.id];
    const sites = SAEC_FICTIONAL_SITES[city.id];

    for (const assetType of ["elevator", "escalator"] as SaecInstallationAssetType[]) {
      const typeCount = assetType === "elevator" ? counts.elevators : counts.escalators;
      const modelPool = assetType === "elevator" ? elevatorModels : escalatorModels;
      const prefixMap =
        assetType === "elevator" ? ELEVATOR_MODEL_PREFIX : ESCALATOR_MODEL_PREFIX;

      for (let i = 0; i < typeCount; i += 1) {
        globalIndex += 1;
        const model =
          modelPool.shift() ??
          (assetType === "elevator" ? "KLH Goods Lift" : "KLF Commercial");
        const modelPrefix = prefixMap[model] ?? "SAEC";
        const siteName = pick(sites, i);
        const customerName = pick(SAEC_FICTIONAL_CUSTOMERS, globalIndex);
        const levelLabel = `L${(i % 4) + 1}`;
        const citySlug = citySlugForLabel(city.label);
        const assetCode = `${modelPrefix}-${pad(globalIndex)}-${citySlug}-${siteSlug(siteName)}-${levelLabel}`;

        const engineer = pick(SAEC_INSTALLATION_ENGINEERS, globalIndex);
        const offline = globalIndex % 47 === 0;
        const maintenanceDue = globalIndex % 11 === 0;
        const overdue = globalIndex % 53 === 0;
        const status = offline ? "offline" : globalIndex % 19 === 0 ? "maintenance" : "online";
        const maintenanceStatus = overdue
          ? "overdue"
          : maintenanceDue
            ? "due"
            : globalIndex % 13 === 0
              ? "scheduled"
              : "ok";

        const assetId = `saec-inst-${assetType}-${globalIndex}`;
        const installedDate = isoDaysFromNow(-(400 + globalIndex * 3));

        const asset: SaecInstallationAsset = {
          id: assetId,
          workspaceId,
          assetType,
          assetCode,
          model,
          siteName,
          customerName,
          cityId: city.id,
          cityLabel: city.label,
          levelLabel,
          status,
          maintenanceStatus,
          contractStatus: globalIndex % 29 === 0 ? "pending" : "active",
          assignedEngineerId: engineer.id,
          assignedEngineerName: engineer.fullName,
          engineerFieldStatus:
            status === "offline" || maintenanceStatus !== "ok"
              ? engineer.defaultFieldStatus
              : "Available",
          nextMaintenanceDate: isoDaysFromNow(maintenanceDue ? 7 : 30 + (globalIndex % 45)),
          lastMaintenanceDate: isoDaysFromNow(-(30 + (globalIndex % 60))),
          maintenanceFrequencyMonths: assetType === "elevator" ? 3 : 2,
          installedDate,
          faults:
            status === "offline"
              ? [
                  {
                    id: `fault-${assetId}`,
                    reportedAt: isoDaysFromNow(-2),
                    summary: "Demo fault — communication timeout with controller.",
                    severity: "medium",
                    status: "open",
                  },
                ]
              : [],
          documents: [
            {
              id: `doc-${assetId}-1`,
              label: "Commissioning checklist (demo)",
              uploadedAt: installedDate,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        assets.push(asset);

        maintenance.push({
          id: `saec-maint-${assetId}-1`,
          workspaceId,
          assetId,
          date: asset.lastMaintenanceDate ?? installedDate,
          engineerName: engineer.fullName,
          maintenanceType: "Scheduled service",
          result: "Completed — all safety checks passed (demo).",
          notes: "Demonstration maintenance record.",
          createdAt: now,
        });

        if (globalIndex % 5 === 0) {
          maintenance.push({
            id: `saec-maint-${assetId}-2`,
            workspaceId,
            assetId,
            date: isoDaysFromNow(-120 - (globalIndex % 30)),
            engineerName: pick(SAEC_INSTALLATION_ENGINEERS, globalIndex + 2).fullName,
            maintenanceType: "Inspection",
            result: "Completed",
            notes: "Routine inspection — demo data.",
            createdAt: now,
          });
        }
      }
    }
  }

  return { assets, maintenance };
}

export function assertSaecSeedTotals(assets: SaecInstallationAsset[]) {
  const elevators = assets.filter((row) => row.assetType === "elevator");
  const escalators = assets.filter((row) => row.assetType === "escalator");
  if (elevators.length !== 400 || escalators.length !== 400) {
    throw new Error(
      `SAEC seed expected 400 elevators and 400 escalators; got ${elevators.length}/${escalators.length}`,
    );
  }

  const expectedElevator: Record<string, number> = {
    "KLH Goods Lift": 160,
    "KLK1 MRA Lift": 160,
    "KLG Panorama Elevator": 20,
    "KLW MRL Lift": 60,
  };
  for (const [model, expected] of Object.entries(expectedElevator)) {
    const count = elevators.filter((row) => row.model === model).length;
    if (count !== expected) {
      throw new Error(`Elevator model ${model} expected ${expected}, got ${count}`);
    }
  }

  const klf = escalators.filter((row) => row.model === "KLF Commercial").length;
  const krf = escalators.filter((row) => row.model === "KRF/KLRP Moving Walk").length;
  if (klf !== 200 || krf !== 200) {
    throw new Error(`Escalator split expected 200/200, got ${klf}/${krf}`);
  }
}
