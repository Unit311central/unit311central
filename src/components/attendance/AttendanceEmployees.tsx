"use client";

import { useCallback, useEffect, useState } from "react";

import type { AttendanceEmployeeRecord, AttendanceHistoryEvent } from "@/lib/attendance/service";
import { formatLondonTime } from "@/lib/attendance/time";

type Draft = {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  jobTitle: string;
  email: string;
  active: boolean;
};

const EMPTY_DRAFT: Draft = {
  firstName: "",
  lastName: "",
  employeeNumber: "",
  department: "",
  jobTitle: "",
  email: "",
  active: true,
};

export default function AttendanceEmployees() {
  const [employees, setEmployees] = useState<AttendanceEmployeeRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [badgeFor, setBadgeFor] = useState<string | null>(null);
  const [nfcUid, setNfcUid] = useState("");
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryEvent[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/attendance/employees", { cache: "no-store" });
    const body = (await response.json()) as { employees?: AttendanceEmployeeRecord[]; error?: string };
    if (!response.ok) throw new Error(body.error || "Unable to load employees.");
    setEmployees(body.employees ?? []);
  }, []);

  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Unable to load employees."),
    );
  }, [load]);

  function startEdit(employee: AttendanceEmployeeRecord) {
    setEditingId(employee.id);
    setDraft({
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeNumber: employee.employeeNumber,
      department: employee.department,
      jobTitle: employee.jobTitle,
      email: employee.email,
      active: employee.active,
    });
  }

  async function saveEmployee() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/attendance/employees/${editingId}` : "/api/attendance/employees",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save employee.");
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEmployee(employee: AttendanceEmployeeRecord) {
    const name = `${employee.firstName} ${employee.lastName}`.trim();
    if (!window.confirm(`Remove ${name} from the attendance roster?`)) return;
    setRemovingId(employee.id);
    setError("");
    try {
      const response = await fetch(`/api/attendance/employees/${employee.id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to remove employee.");
      if (editingId === employee.id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }
      if (historyFor === employee.id) setHistoryFor(null);
      if (badgeFor === employee.id) setBadgeFor(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove employee.");
    } finally {
      setRemovingId(null);
    }
  }

  async function assignBadge(employeeId: string) {
    setError("");
    const response = await fetch(`/api/attendance/employees/${employeeId}/badge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nfcUid }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error || "Unable to assign badge.");
      return;
    }
    setBadgeFor(null);
    setNfcUid("");
    await load();
  }

  async function openHistory(employeeId: string) {
    if (historyFor === employeeId) {
      setHistoryFor(null);
      return;
    }
    setHistoryFor(employeeId);
    setHistory([]);
    const response = await fetch(`/api/attendance/employees/${employeeId}/history`, { cache: "no-store" });
    const body = (await response.json()) as { events?: AttendanceHistoryEvent[]; error?: string };
    if (!response.ok) {
      setError(body.error || "Unable to load history.");
      return;
    }
    setHistory(body.events ?? []);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">{editingId ? "Edit employee" : "Add employee"}</h2>
        <p className="mt-1 text-sm text-white/50">Manual roster for the attendance demonstration.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveEmployee();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="First name" value={draft.firstName} onChange={(firstName) => setDraft({ ...draft, firstName })} />
            <Field label="Last name" value={draft.lastName} onChange={(lastName) => setDraft({ ...draft, lastName })} />
            <Field
              label="Employee number"
              value={draft.employeeNumber}
              onChange={(employeeNumber) => setDraft({ ...draft, employeeNumber })}
            />
            <Field label="Department" value={draft.department} onChange={(department) => setDraft({ ...draft, department })} />
            <Field label="Job title" value={draft.jobTitle} onChange={(jobTitle) => setDraft({ ...draft, jobTitle })} />
            <Field label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Active
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add employee"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80"
                onClick={() => {
                  setEditingId(null);
                  setDraft(EMPTY_DRAFT);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Employees</h2>
          <p className="text-xs text-white/40">{employees.length} records</p>
        </div>
        <ul>
          {employees.map((employee) => {
            const name = `${employee.firstName} ${employee.lastName}`.trim();
            const detail = [employee.department, employee.jobTitle, employee.email, employee.nfcUid || "No badge"]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={employee.id} className="border-t border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-xs text-white/45">{employee.employeeNumber}</span>
                      <span className="font-medium text-white">{name}</span>
                      <span className={`text-xs ${employee.active ? "text-emerald-200/80" : "text-white/35"}`}>
                        {employee.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-white/50">{detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(employee)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={removingId === employee.id}
                      onClick={() => void removeEmployee(employee)}
                      className="rounded-lg border border-rose-300/30 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-400/10 disabled:opacity-60"
                    >
                      {removingId === employee.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    className="text-sky-200/90"
                    onClick={() => {
                      setBadgeFor(badgeFor === employee.id ? null : employee.id);
                      setNfcUid(employee.nfcUid ?? "");
                    }}
                  >
                    {employee.nfcUid ? "Replace badge" : "Assign badge"}
                  </button>
                  <button type="button" className="text-white/55" onClick={() => void openHistory(employee.id)}>
                    {historyFor === employee.id ? "Hide history" : "History"}
                  </button>
                </div>
                {badgeFor === employee.id ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void assignBadge(employee.id);
                    }}
                  >
                    <input
                      value={nfcUid}
                      onChange={(event) => setNfcUid(event.target.value)}
                      placeholder="NFC UID"
                      className="w-44 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs text-white"
                    />
                    <button type="submit" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">
                      Save badge
                    </button>
                  </form>
                ) : null}
                {historyFor === employee.id ? (
                  <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-xs text-white/60">
                    {history.length === 0 ? <li>No attendance events yet.</li> : null}
                    {history.map((event) => (
                      <li key={event.id}>
                        {event.eventType} · {formatLondonTime(event.eventTimestamp)} · {event.source}
                        {event.nfcUid ? ` · ${event.nfcUid}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
          {employees.length === 0 ? (
            <li className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/40">
              No employees yet.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-white/55">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
