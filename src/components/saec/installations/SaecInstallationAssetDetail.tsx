"use client";

import { useState } from "react";
import { Pencil, Wrench } from "lucide-react";

import type { SaecInstallationEngineer } from "@/lib/saec/installations-engineers";
import type {
  SaecInstallationAsset,
  SaecMaintenanceRecord,
} from "@/lib/saec/installations-types";

type SaecInstallationAssetDetailProps = {
  asset: SaecInstallationAsset;
  maintenance: SaecMaintenanceRecord[];
  engineers: SaecInstallationEngineer[];
  onEdit: () => void;
  onMaintenanceCreated: () => void;
};

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export default function SaecInstallationAssetDetail({
  asset,
  maintenance,
  engineers,
  onEdit,
  onMaintenanceCreated,
}: SaecInstallationAssetDetailProps) {
  const [tab, setTab] = useState<"overview" | "maintenance" | "engineer" | "faults">("overview");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDate, setAssignDate] = useState("");
  const [assignType, setAssignType] = useState("Scheduled service");
  const [assignEngineer, setAssignEngineer] = useState(asset.assignedEngineerName ?? "");
  const [busy, setBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  async function createAssignment() {
    setBusy(true);
    setAssignError(null);
    try {
      const response = await fetch("/api/saec/installations/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          date: assignDate,
          engineerName: assignEngineer,
          maintenanceType: assignType,
          result: "Scheduled",
          notes: "Demo maintenance assignment",
        }),
      });
      const payload = await readJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Failed to create assignment");
      setAssignOpen(false);
      onMaintenanceCreated();
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : "Failed to create assignment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-sky-300">{asset.assetCode}</p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            {asset.siteName} — {asset.levelLabel}
          </h3>
          <p className="mt-1 text-xs text-white/45">{asset.customerName} (demo)</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>

      <div className="mt-4 flex gap-1 rounded-lg border border-white/8 bg-[#0b1524] p-1">
        {(["overview", "maintenance", "engineer", "faults"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              tab === key ? "bg-sky-500/20 text-sky-100" : "text-white/45"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <dl className="mt-4 space-y-2 text-xs">
          <Row label="Asset type" value={asset.assetType === "elevator" ? "Elevator" : "Escalator"} />
          <Row label="Model" value={asset.model} />
          <Row label="Status" value={asset.status} />
          <Row label="City" value={asset.cityLabel} />
          <Row label="Installed" value={asset.installedDate} />
          <Row label="Contract" value={asset.contractStatus} />
          <Row label="Maintenance status" value={asset.maintenanceStatus} />
          <Row label="Next maintenance" value={asset.nextMaintenanceDate ?? "—"} />
          <Row label="Last maintenance" value={asset.lastMaintenanceDate ?? "—"} />
          <Row label="Frequency" value={`Every ${asset.maintenanceFrequencyMonths} months`} />
        </dl>
      )}

      {tab === "maintenance" && (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-400/25 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100"
          >
            <Wrench className="h-3 w-3" />
            Create Maintenance Assignment
          </button>
          <ul className="space-y-2">
            {maintenance.map((row) => (
              <li key={row.id} className="rounded-lg border border-white/8 bg-[#0b1524]/50 px-3 py-2">
                <p className="text-xs font-medium text-white">{row.date} · {row.maintenanceType}</p>
                <p className="text-[11px] text-white/45">{row.engineerName} — {row.result}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "engineer" && (
        <div className="mt-4 space-y-2 text-xs text-white/70">
          <Row label="Assigned engineer" value={asset.assignedEngineerName ?? "—"} />
          <Row label="Field status" value={asset.engineerFieldStatus ?? "—"} />
          <Row label="Current assignment" value={asset.assetCode} />
          <Row label="Location" value={asset.cityLabel} />
          <p className="text-[11px] text-white/35">
            Linked to SAEC HR / Engineering roster (demo employees).
          </p>
        </div>
      )}

      {tab === "faults" && (
        <ul className="mt-4 space-y-2">
          {asset.faults.length === 0 ? (
            <li className="text-xs text-white/40">No open faults on this demo asset.</li>
          ) : (
            asset.faults.map((fault) => (
              <li key={fault.id} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs">
                <p className="font-medium text-amber-100">{fault.summary}</p>
                <p className="text-amber-100/60">{fault.reportedAt} · {fault.status}</p>
              </li>
            ))
          )}
        </ul>
      )}

      {assignOpen && (
        <div className="mt-4 rounded-xl border border-white/10 bg-[#071018] p-3">
          <p className="text-xs font-semibold text-white">New maintenance assignment</p>
          <div className="mt-2 grid gap-2">
            <input
              type="date"
              value={assignDate}
              onChange={(event) => setAssignDate(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white"
            />
            <input
              value={assignType}
              onChange={(event) => setAssignType(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white"
            />
            <select
              value={assignEngineer}
              onChange={(event) => setAssignEngineer(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white"
            >
              {engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.fullName}>{engineer.fullName}</option>
              ))}
            </select>
          </div>
          {assignError && <p className="mt-2 text-[11px] text-red-300">{assignError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy || !assignDate}
              onClick={() => void createAssignment()}
              className="rounded-lg bg-sky-500/20 px-2 py-1 text-[11px] text-sky-100 disabled:opacity-50"
            >
              Save assignment
            </button>
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="text-[11px] text-white/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 pb-1">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-right text-white/80">{value}</dd>
    </div>
  );
}
