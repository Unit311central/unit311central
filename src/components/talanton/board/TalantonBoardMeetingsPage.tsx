"use client";

import { useCallback, useMemo, useState, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Archive, Plus, Trash2 } from "lucide-react";

import { TalantonCreateBoardMeetingWizard } from "@/components/talanton/board/TalantonCreateBoardMeetingWizard";
import { TalantonMeetingEditor } from "@/components/talanton/governance/TalantonMeetingEditor";
import {
  TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW,
  boardDeckHrefForMeetingDate,
  boardMinutesHref,
  formatBoardMeetingLongDate,
  formatBoardMeetingMonthYear,
  partitionBoardMeetingsForLanding,
} from "@/lib/talanton/board-meetings-layout";
import {
  deleteMeeting,
  getTalantonGovernanceServerSnapshot,
  getTalantonGovernanceSnapshot,
  listMeetings,
  subscribeTalantonGovernanceStore,
  type GovernanceMeeting,
} from "@/lib/talanton/governance-store";
import { cn } from "@/lib/utils";

type LandingView = "main" | "archive";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 hover:bg-emerald-500/30";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/5";
const linkBtn =
  "text-xs font-semibold text-emerald-200/90 hover:text-emerald-100 underline-offset-2 hover:underline";

function useGovernanceMeetings() {
  return useSyncExternalStore(
    subscribeTalantonGovernanceStore,
    getTalantonGovernanceSnapshot,
    getTalantonGovernanceServerSnapshot,
  );
}

function meetingDisplayTitle(meeting: GovernanceMeeting): string {
  const trimmed = meeting.title.trim();
  if (trimmed.toLowerCase().startsWith("talanton")) return "Talanton Impact Board";
  return trimmed || "Talanton Impact Board";
}

function MeetingInviteLink({ meeting }: { meeting: GovernanceMeeting }) {
  const url = meeting.meetingInviteUrl?.trim();
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={linkBtn}>
        Meeting invite
      </a>
    );
  }
  return (
    <span className="text-xs text-white/40" title="Add a join link when editing the meeting">
      Meeting invite (not set)
    </span>
  );
}

function BoardMeetingCard({
  meeting,
  prominent,
  onEdit,
  onDelete,
}: {
  meeting: GovernanceMeeting;
  prominent?: boolean;
  onEdit: (m: GovernanceMeeting) => void;
  onDelete: (m: GovernanceMeeting) => void;
}) {
  const isDraft = meeting.status === "Draft";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        prominent && "border-emerald-400/25 bg-emerald-500/[0.04]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{meetingDisplayTitle(meeting)}</h3>
          <p className="mt-0.5 text-sm text-white/55">{formatBoardMeetingMonthYear(meeting.meetingDate)}</p>
          <p className="text-sm text-white/70">{formatBoardMeetingLongDate(meeting.meetingDate)}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            isDraft
              ? "border-amber-400/35 bg-amber-500/10 text-amber-100"
              : "border-white/15 text-white/60",
          )}
        >
          {meeting.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        <button type="button" className={linkBtn} onClick={() => onEdit(meeting)}>
          Open board meeting
        </button>
        <Link href={boardDeckHrefForMeetingDate(meeting.meetingDate)} className={linkBtn}>
          Board deck
        </Link>
        <Link href={boardMinutesHref(meeting.id)} className={linkBtn}>
          Minutes &amp; decisions
        </Link>
        <Link href="/board/risk" className={linkBtn}>
          Risk register
        </Link>
        <MeetingInviteLink meeting={meeting} />
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {isDraft ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">
            Draft
          </span>
        ) : null}
        <button type="button" className={secondaryBtn} onClick={() => onEdit(meeting)}>
          Edit
        </button>
        <button
          type="button"
          className={cn(secondaryBtn, "border-rose-400/25 text-rose-200/90")}
          onClick={() => onDelete(meeting)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

function NextMeetingPreviewCard({ onCreateFromPreview }: { onCreateFromPreview: () => void }) {
  const preview = TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW;
  return (
    <article
      className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-4 sm:p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
        Example layout — not a saved meeting
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{preview.title}</h3>
      <p className="mt-0.5 text-sm text-white/55">{preview.monthLabel}</p>
      <p className="text-sm text-white/70">{formatBoardMeetingLongDate(preview.meetingDate)}</p>
      <p className="mt-3 text-sm text-white/45">
        Schedule the next board meeting with <strong className="text-white/60">Create meeting</strong>.
        Links below show where materials will appear once a meeting record exists.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
        <span>Open board meeting</span>
        <Link href="/board/decks" className={linkBtn}>
          Board deck
        </Link>
        <Link href={boardMinutesHref()} className={linkBtn}>
          Minutes &amp; decisions
        </Link>
        <Link href="/board/risk" className={linkBtn}>
          Risk register
        </Link>
        <span>Meeting invite (not set)</span>
      </div>
      <button type="button" className={cn(primaryBtn, "mt-5")} onClick={onCreateFromPreview}>
        Create meeting for {formatBoardMeetingLongDate(preview.meetingDate)}
      </button>
    </article>
  );
}

function TalantonBoardMeetingsPageInner() {
  const searchParams = useSearchParams();
  const snap = useGovernanceMeetings();
  const [view, setView] = useState<LandingView>("main");
  const [editing, setEditing] = useState<GovernanceMeeting | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const wizardMeetingId = searchParams.get("createMeeting");
  const wizardStepParam = searchParams.get("wizardStep");
  const wizardStep =
    wizardStepParam === "2" ? 2 : wizardStepParam === "3" ? 3 : wizardStepParam === "1" ? 1 : undefined;
  const wizardOpen = createOpen || Boolean(wizardMeetingId);

  const boardMeetings = useMemo(
    () => listMeetings({ includeArchived: true }).filter((m) => m.meetingType === "Board Meeting"),
    [snap],
  );

  const partition = useMemo(
    () => partitionBoardMeetingsForLanding(boardMeetings),
    [boardMeetings],
  );

  const onCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const onCreateFromPreview = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const onDelete = useCallback((meeting: GovernanceMeeting) => {
    const ok = window.confirm(
      `Delete "${meeting.title}" on ${formatBoardMeetingLongDate(meeting.meetingDate)}? This cannot be undone.`,
    );
    if (!ok) return;
    void deleteMeeting(meeting.id).catch((error) => {
      console.error("[BoardMeetings delete]", error);
      window.alert(error instanceof Error ? error.message : "Failed to delete meeting.");
    });
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Schedule and manage Talanton Impact board meetings, open board materials, and access
            minutes and governance records for each meeting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView((v) => (v === "archive" ? "main" : "archive"))}
            className={cn(
              secondaryBtn,
              "px-3 py-2 text-xs uppercase tracking-wide",
              view === "archive" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
          <button type="button" onClick={onCreate} className={primaryBtn}>
            <Plus className="h-3.5 w-3.5" />
            Create meeting
          </button>
        </div>
      </header>

      {snap.status === "loading" ? (
        <p className="text-sm text-white/50">Loading board meetings…</p>
      ) : null}
      {snap.status === "error" ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {snap.error}
        </p>
      ) : null}

      {view === "archive" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Archive — older board meetings
            </h2>
            <button type="button" className={secondaryBtn} onClick={() => setView("main")}>
              Back to current cycle
            </button>
          </div>
          {partition.archiveMeetings.length === 0 ? (
            <p className="text-sm text-white/45">No archived or historical meetings yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {partition.archiveMeetings.map((m) => (
                <BoardMeetingCard
                  key={m.id}
                  meeting={m}
                  onEdit={setEditing}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Next board meeting
            </h2>
            {partition.nextMeeting ? (
              <BoardMeetingCard
                meeting={partition.nextMeeting}
                prominent
                onEdit={setEditing}
                onDelete={onDelete}
              />
            ) : partition.useNextMeetingPreview ? (
              <NextMeetingPreviewCard onCreateFromPreview={onCreateFromPreview} />
            ) : (
              <p className="text-sm text-white/45">No upcoming board meeting scheduled.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Previous board meetings
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {partition.previousSlots.map((slot) => (
                <div key={slot.quarterLabel} className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    {slot.quarterLabel}
                  </p>
                  {slot.meeting ? (
                    <BoardMeetingCard
                      meeting={slot.meeting}
                      onEdit={setEditing}
                      onDelete={onDelete}
                    />
                  ) : (
                    <div
                      className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm text-white/40"
                    >
                      No meeting in this slot for the current cycle.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {editing ? (
        <TalantonMeetingEditor
          meeting={editing}
          onClose={() => setEditing(null)}
          title={
            editing.status === "Draft" && !editing.minutes
              ? "Create board meeting"
              : "Edit board meeting"
          }
          saveLabel="Save meeting"
          lockMeetingType="Board Meeting"
        />
      ) : null}
      <TalantonCreateBoardMeetingWizard
        open={wizardOpen}
        onClose={() => setCreateOpen(false)}
        initialMeetingId={wizardMeetingId}
        initialStep={wizardStep}
      />
    </div>
  );
}

export function TalantonBoardMeetingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading board meetings…</p>}>
      <TalantonBoardMeetingsPageInner />
    </Suspense>
  );
}
