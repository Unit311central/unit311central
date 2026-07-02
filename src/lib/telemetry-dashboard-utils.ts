import type { TelemetryRow } from "@/lib/telemetry";

export type TelemetryStatusFilter = "ALL" | "IN FLIGHT" | "STOPPED" | "STANDBY" | "MAINTENANCE";

export type TelemetryStats = {
  totalRecords: number;
  activeDrones: number;
  latestUpdate: string | null;
  averageBattery: number;
};

export function formatTelemetryTimestamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatNumber(value: number | null, decimals = 2) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(decimals);
}

export function telemetryStatusBadgeClass(status: string | null) {
  switch (status) {
    case "IN FLIGHT":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "STOPPED":
      return "border-white/20 bg-white/10 text-white/60";
    case "STANDBY":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "MAINTENANCE":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

export function computeTelemetryStats(
  records: TelemetryRow[],
  totalRecords: number,
): TelemetryStats {
  const latestByDrone = new Map<string, TelemetryRow>();

  for (const record of records) {
    const existing = latestByDrone.get(record.drone_id);
    if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
      latestByDrone.set(record.drone_id, record);
    }
  }

  const latestRecords = [...latestByDrone.values()];
  const activeDrones = latestRecords.filter((record) => record.status === "IN FLIGHT").length;
  const latestUpdate = records[0]?.timestamp ?? null;
  const averageBattery =
    latestRecords.length === 0
      ? 0
      : latestRecords.reduce((sum, record) => sum + (record.battery ?? 0), 0) /
        latestRecords.length;

  return {
    totalRecords,
    activeDrones,
    latestUpdate,
    averageBattery,
  };
}

export function filterTelemetryRecords(
  records: TelemetryRow[],
  searchQuery: string,
  statusFilter: TelemetryStatusFilter,
) {
  const query = searchQuery.trim().toLowerCase();

  return records.filter((record) => {
    const matchesSearch =
      query.length === 0 || record.drone_id.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "ALL" || (record.status ?? "").toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function exportTelemetryCsv(records: TelemetryRow[]) {
  const headers = [
    "Timestamp",
    "Drone ID",
    "Status",
    "Latitude",
    "Longitude",
    "Altitude",
    "Speed",
    "Battery",
  ];

  const rows = records.map((record) => [
    record.timestamp,
    record.drone_id,
    record.status ?? "",
    record.latitude,
    record.longitude,
    record.altitude ?? "",
    record.speed ?? "",
    record.battery ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `telemetry-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
