"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";

import {
  addAbhiBoardMember,
  listAbhiBoardMembers,
  removeAbhiBoardMember,
  subscribeAbhiBoardMembersStore,
  updateAbhiBoardMember,
  type AbhiBoardMemberInput,
} from "@/lib/abhi/board-members-store";
import type { AbhiBoardMember } from "@/lib/abhi/board-portal-data";
import { cn } from "@/lib/utils";

function useMembers() {
  return useSyncExternalStore(subscribeAbhiBoardMembersStore, listAbhiBoardMembers, () =>
    listAbhiBoardMembers(),
  );
}

type FormState = {
  id: string | null;
  name: string;
  role: string;
  email: string;
  committees: string;
};

function emptyForm(): FormState {
  return { id: null, name: "", role: "", email: "", committees: "" };
}

function formFromMember(member: AbhiBoardMember): FormState {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email,
    committees: member.committees.join(", "),
  };
}

function toInput(form: FormState): AbhiBoardMemberInput {
  return {
    name: form.name.trim(),
    role: form.role.trim(),
    email: form.email.trim(),
    committees: form.committees
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-white outline-none focus:border-[#C2185B]/50";
}

export default function AbhiBoardMembersWorkspace() {
  const members = useMembers();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.role, m.email, m.committees.join(" ")].join(" ").toLowerCase().includes(q),
    );
  }, [members, search]);

  function openCreate() {
    setForm(emptyForm());
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(member: AbhiBoardMember) {
    setForm(formFromMember(member));
    setFormOpen(true);
    setNotice(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const input = toInput(form);
    if (form.id) {
      updateAbhiBoardMember(form.id, input);
      setNotice("Board member updated.");
    } else {
      addAbhiBoardMember(input);
      setNotice("Board member added.");
    }
    setFormOpen(false);
  }

  function handleDelete(member: AbhiBoardMember) {
    if (!window.confirm(`Remove ${member.name} from the board roster?`)) return;
    removeAbhiBoardMember(member.id);
    setNotice(`${member.name} removed.`);
  }

  return (
    <div className="space-y-5 p-2 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9a8d4]/80">
            ABHI · Board
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Board Members
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Add, edit, or remove directors. Changes save in this browser.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full border border-[#C2185B]/40 bg-[#C2185B]/15 px-4 py-2 text-sm font-medium text-[#f9a8d4] hover:bg-[#C2185B]/25"
        >
          <Plus className="h-4 w-4" />
          Add member
        </button>
      </header>

      {notice ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, role, committee…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#C2185B]/50"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((member) => (
          <article
            key={member.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C2185B]/20 text-[#f9a8d4]">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="text-sm text-white/55">{member.role}</p>
                  <p className="mt-1 text-xs text-white/45">{member.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(member)}
                  className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label={`Edit ${member.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(member)}
                  className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {member.committees.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.committees.map((committee) => (
                  <span
                    key={committee}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50"
                  >
                    {committee}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-white/45">No board members match your search.</p>
      ) : null}

      {formOpen ? (
        <Modal
          title={form.id ? "Edit board member" : "Add board member"}
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass()}
              />
            </label>
            <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Role / title
              <input
                required
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={inputClass()}
              />
            </label>
            <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass()}
              />
            </label>
            <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Committees (comma-separated)
              <input
                value={form.committees}
                onChange={(e) => setForm((f) => ({ ...f, committees: e.target.value }))}
                placeholder="Finance, Strategy, Audit & Risk"
                className={inputClass()}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className={cn(
                  "rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5",
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full border border-[#C2185B]/40 bg-[#C2185B]/20 px-4 py-2 text-sm font-medium text-[#f9a8d4] hover:bg-[#C2185B]/30"
              >
                {form.id ? "Save changes" : "Add member"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
