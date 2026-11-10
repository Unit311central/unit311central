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

  async function deactivate(employee: AttendanceEmployeeRecord) {
    setError("");
    const response = await fetch(`/api/attendance/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
        department: employee.department,
        jobTitle: employee.jobTitle,
        email: employee.email,
        active: false,
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error || "Unable to deactivate employee.");
      return;
    }
    await load();
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
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">{editingId ? "Edit employee" : "Add employee"}</h2>
        <p className="mt-1 text-sm text-white/50">Manual roster for the attendance demonstration.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void saveEmployee();
          }}
        >
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
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2">
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/85">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.08em] text-white/45">
              <tr>
                {["Number", "Name", "Department", "Job title", "Email", "Badge", "Status", ""].map((heading) => (
                  <th key={heading || "actions"} className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 font-medium text-white">{employee.employeeNumber}</td>
                  <td className="px-4 py-3">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-4 py-3">{employee.department || "—"}</td>
                  <td className="px-4 py-3">{employee.jobTitle || "—"}</td>
                  <td className="px-4 py-3">{employee.email || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{employee.nfcUid || "Unassigned"}</td>
                  <td className="px-4 py-3">{employee.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="text-sky-200" onClick={() => startEdit(employee)}>
                        Edit
                      </button>
                      {employee.active ? (
                        <button type="button" className="text-amber-200" onClick={() => void deactivate(employee)}>
                          Deactivate
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-white/80"
                        onClick={() => {
                          setBadgeFor(employee.id);
                          setNfcUid(employee.nfcUid ?? "");
                        }}
                      >
                        {employee.nfcUid ? "Replace badge" : "Assign badge"}
                      </button>
                      <button type="button" className="text-white/80" onClick={() => void openHistory(employee.id)}>
                        History
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
                          className="w-36 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white"
                        />
                        <button type="submit" className="text-xs text-sky-200">
                          Save
                        </button>
                      </form>
                    ) : null}
                    {historyFor === employee.id ? (
                      <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-white/60">
                        {history.length === 0 ? <li>No attendance events yet.</li> : null}
                        {history.map((event) => (
                          <li key={event.id}>
                            {event.eventType} · {formatLondonTime(event.eventTimestamp)} · {event.source}
                            {event.nfcUid ? ` · ${event.nfcUid}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

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
