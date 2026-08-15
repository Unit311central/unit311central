"use client";

import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Mail,
  Plus,
  Send,
  Trash2,
  Underline,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ABHI_LINKEDIN_URL, ABHI_X_URL } from "@/lib/abhi-surface";
import { CentralMarketingShell } from "@/components/marketing/workspaces/CentralMarketingShell";
import {
  deleteNewsletter,
  scheduleNewsletter,
  sendNewsletterNow,
  upsertNewsletter,
  type AbhiNewsletter,
  type AbhiRecipientMode,
} from "@/lib/abhi-marketing-store";
import { cn } from "@/lib/utils";
import { useAbhiMarketingStore } from "./useAbhiMarketingStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type FormState = {
  id: string | null;
  title: string;
  subject: string;
  htmlBody: string;
  recipientMode: AbhiRecipientMode;
  recipientMemberIds: string[];
  manualEmailsText: string;
  channels: { email: boolean; linkedin: boolean; twitter: boolean };
  imageDataUrls: string[];
  scheduleMode: "now" | "schedule";
  scheduledAt: string;
};

function emptyForm(): FormState {
  return {
    id: null,
    title: "",
    subject: "",
    htmlBody: "",
    recipientMode: "all",
    recipientMemberIds: [],
    manualEmailsText: "",
    channels: { email: true, linkedin: false, twitter: false },
    imageDataUrls: [],
    scheduleMode: "now",
    scheduledAt: "",
  };
}

function formFromNewsletter(item: AbhiNewsletter): FormState {
  return {
    id: item.id,
    title: item.title,
    subject: item.subject,
    htmlBody: item.htmlBody,
    recipientMode: item.recipientMode,
    recipientMemberIds: item.recipientMemberIds,
    manualEmailsText: item.manualEmails.join("\n"),
    channels: item.channels,
    imageDataUrls: item.imageDataUrls,
    scheduleMode: item.status === "scheduled" ? "schedule" : "now",
    scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0, 16) : "",
  };
}

function statusPillClass(status: AbhiNewsletter["status"]) {
  if (status === "sent") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "scheduled") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/[0.04] text-white/55";
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function RichTextEditor({
  html,
  onChange,
  onImageInserted,
}: {
  html: string;
  onChange: (html: string) => void;
  onImageInserted: (dataUrl: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastExternalHtml = useRef<string>(html);

  useEffect(() => {
    if (editorRef.current && html !== lastExternalHtml.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
    lastExternalHtml.current = html;
  }, [html]);

  function emitChange() {
    const next = editorRef.current?.innerHTML ?? "";
    lastExternalHtml.current = next;
    onChange(next);
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  }

  function handleLink() {
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  }

  function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        exec("insertImage", reader.result);
        onImageInserted(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-white/[0.03] px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <ToolbarButton label="Insert link" onClick={handleLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        className="min-h-[200px] px-3.5 py-3 text-sm leading-relaxed text-white/90 outline-none [&_a]:text-sky-300 [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

export default function AbhiNewsletterWorkspace() {
  const store = useAbhiMarketingStore();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...store.newsletters].sort((a, b) => {
        const rank = (item: AbhiNewsletter) => (item.status === "sent" ? 1 : 0);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }),
    [store.newsletters],
  );
  const sentHistory = useMemo(
    () =>
      [...store.newsletters]
        .filter((item) => item.status === "sent")
        .sort((a, b) => Date.parse(b.sentAt ?? "") - Date.parse(a.sentAt ?? "")),
    [store.newsletters],
  );

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function loadNewsletter(item: AbhiNewsletter) {
    setForm(formFromNewsletter(item));
    setNotice(null);
  }

  function startNew() {
    setForm(emptyForm());
    setNotice(null);
  }

  function toggleRecipientMember(memberId: string) {
    patchForm({
      recipientMemberIds: form.recipientMemberIds.includes(memberId)
        ? form.recipientMemberIds.filter((id) => id !== memberId)
        : [...form.recipientMemberIds, memberId],
    });
  }

  function buildPayload() {
    const manualEmails = form.manualEmailsText
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);
    return {
      id: form.id ?? undefined,
      title: form.title.trim() || "Untitled newsletter",
      subject: form.subject.trim(),
      htmlBody: form.htmlBody,
      recipientMode: form.recipientMode,
      recipientMemberIds: form.recipientMode === "selected" ? form.recipientMemberIds : [],
      manualEmails: form.recipientMode === "manual" ? manualEmails : [],
      channels: form.channels,
      imageDataUrls: form.imageDataUrls,
    };
  }

  function handleSaveDraft() {
    const saved = upsertNewsletter({ ...buildPayload(), status: "draft" });
    setForm((current) => ({ ...current, id: saved.id }));
    setNotice("Draft saved.");
  }

  function handleSend() {
    const saved = upsertNewsletter({ ...buildPayload() });
    if (form.scheduleMode === "schedule" && form.scheduledAt) {
      scheduleNewsletter(saved.id, new Date(form.scheduledAt).toISOString());
      setNotice(`Newsletter scheduled for ${formatWhen(new Date(form.scheduledAt).toISOString())}.`);
    } else {
      sendNewsletterNow(saved.id);
      setNotice("Newsletter sent.");
    }
    setForm((current) => ({ ...current, id: saved.id }));
  }

  function handleDelete(id: string) {
    deleteNewsletter(id);
    if (form.id === id) startNew();
  }

  const canSend = form.subject.trim().length > 0 && form.htmlBody.trim().length > 0;

  return (
    <CentralMarketingShell
      brandLabel="ABHI"
      moduleLabel="Marketing & Events"
      title="Digital newsletter"
      description="Member-facing newsletter campaigns with email and social channel options."
    >
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <TqmsSection
          title="Newsletters"
          subtitle="Drafts, scheduled sends, and history."
          actions={
            <button type="button" onClick={startNew} className={tqmsPrimaryButtonClass()}>
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          }
          className="h-fit"
        >
          {sorted.length === 0 ? (
            <TqmsEmpty message="No newsletters yet." />
          ) : (
            <ul className="space-y-2">
              {sorted.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => loadNewsletter(item)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      form.id === item.id
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-white">{item.title}</p>
                      <TqmsStatusPill className={statusPillClass(item.status)}>{item.status}</TqmsStatusPill>
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">
                      {item.status === "sent"
                        ? `Sent ${formatWhen(item.sentAt)}`
                        : item.status === "scheduled"
                          ? `Scheduled ${formatWhen(item.scheduledAt)}`
                          : `Updated ${formatWhen(item.updatedAt)}`}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        <div className="space-y-4">
          <TqmsSection title={form.id ? "Edit newsletter" : "Compose newsletter"}>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={tqmsLabelClass()}>Title (internal)</span>
                  <input
                    value={form.title}
                    onChange={(e) => patchForm({ title: e.target.value })}
                    placeholder="e.g. July digest"
                    className={tqmsInputClass()}
                  />
                </label>
                <label className="block">
                  <span className={tqmsLabelClass()}>Email subject</span>
                  <input
                    value={form.subject}
                    onChange={(e) => patchForm({ subject: e.target.value })}
                    placeholder="Subject line"
                    className={tqmsInputClass()}
                  />
                </label>
              </div>

              <div>
                <span className={tqmsLabelClass()}>Content</span>
                <div className="mt-1.5">
                  <RichTextEditor
                    html={form.htmlBody}
                    onChange={(htmlBody) => patchForm({ htmlBody })}
                    onImageInserted={(dataUrl) =>
                      patchForm({ imageDataUrls: [...form.imageDataUrls, dataUrl] })
                    }
                  />
                </div>
              </div>
            </div>
          </TqmsSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <TqmsSection title="Recipients">
              <div className="space-y-2.5">
                {(
                  [
                    ["all", "All members"],
                    ["selected", "Selected members"],
                    ["manual", "Manual email list"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-white/75">
                    <input
                      type="radio"
                      name="recipientMode"
                      checked={form.recipientMode === value}
                      onChange={() => patchForm({ recipientMode: value })}
                      className="h-3.5 w-3.5 border-white/30 bg-transparent"
                    />
                    {label}
                  </label>
                ))}

                {form.recipientMode === "selected" ? (
                  <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2 pr-1">
                    {store.members.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-white/65 hover:bg-white/[0.04]"
                      >
                        <input
                          type="checkbox"
                          checked={form.recipientMemberIds.includes(member.id)}
                          onChange={() => toggleRecipientMember(member.id)}
                          className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                        />
                        {member.companyName}
                      </label>
                    ))}
                  </div>
                ) : null}

                {form.recipientMode === "manual" ? (
                  <textarea
                    value={form.manualEmailsText}
                    onChange={(e) => patchForm({ manualEmailsText: e.target.value })}
                    rows={4}
                    placeholder={"one email per line\ncontact@example.com"}
                    className={cn(tqmsInputClass(), "resize-none")}
                  />
                ) : null}
              </div>
            </TqmsSection>

            <TqmsSection title="Channels & send">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={form.channels.email}
                    onChange={(e) =>
                      patchForm({ channels: { ...form.channels, email: e.target.checked } })
                    }
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                  />
                  <Mail className="h-3.5 w-3.5 text-white/40" />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={form.channels.linkedin}
                    onChange={(e) =>
                      patchForm({ channels: { ...form.channels, linkedin: e.target.checked } })
                    }
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                  />
                  LinkedIn ·{" "}
                  <a
                    href={ABHI_LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300/90 hover:text-sky-200"
                  >
                    @abhi
                  </a>
                </label>
                <label className="flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={form.channels.twitter}
                    onChange={(e) =>
                      patchForm({ channels: { ...form.channels, twitter: e.target.checked } })
                    }
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                  />
                  X (Twitter) ·{" "}
                  <a
                    href={ABHI_X_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300/90 hover:text-sky-200"
                  >
                    @UK_ABHI
                  </a>
                </label>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-white/75">
                      <input
                        type="radio"
                        name="scheduleMode"
                        checked={form.scheduleMode === "now"}
                        onChange={() => patchForm({ scheduleMode: "now" })}
                        className="h-3.5 w-3.5 border-white/30 bg-transparent"
                      />
                      Send now
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/75">
                      <input
                        type="radio"
                        name="scheduleMode"
                        checked={form.scheduleMode === "schedule"}
                        onChange={() => patchForm({ scheduleMode: "schedule" })}
                        className="h-3.5 w-3.5 border-white/30 bg-transparent"
                      />
                      Schedule
                    </label>
                  </div>
                  {form.scheduleMode === "schedule" ? (
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => patchForm({ scheduledAt: e.target.value })}
                      className={cn(tqmsInputClass(), "mt-2")}
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={handleSaveDraft} className={tqmsSecondaryButtonClass()}>
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className={tqmsPrimaryButtonClass(!canSend)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {form.scheduleMode === "schedule" ? "Schedule" : "Send now"}
                  </button>
                  {form.id ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(form.id!)}
                      className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-medium text-white/40 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </TqmsSection>
          </div>

          <TqmsSection title="Live preview">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
              <div className="border-b border-black/5 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Subject</p>
                <p className="text-sm font-semibold text-slate-800">
                  {form.subject.trim() || "(no subject)"}
                </p>
              </div>
              <div
                className="prose prose-sm max-w-none px-4 py-4 text-slate-700"
                dangerouslySetInnerHTML={{
                  __html: form.htmlBody.trim() || "<p class=\"text-slate-400\">Your newsletter content will appear here…</p>",
                }}
              />
            </div>
          </TqmsSection>
        </div>
      </div>

      <TqmsSection title="Send history" subtitle="Performance for previously sent newsletters.">
        {sentHistory.length === 0 ? (
          <TqmsEmpty message="No newsletters sent yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sentHistory.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-white/40">Sent {formatWhen(item.sentAt)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Open rate</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{item.metrics.openRate}%</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Click rate</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{item.metrics.clickRate}%</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Response rate</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{item.metrics.responseRate}%</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Clients acquired</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-300">{item.metrics.clientsAcquired}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TqmsSection>
    </div>
    </CentralMarketingShell>
  );
}
