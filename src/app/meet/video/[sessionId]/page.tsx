import { Video } from "lucide-react";

import CalendarMeetRoom from "@/components/calendar/CalendarMeetRoom";
import MessagingCallRoom from "@/components/messaging/MessagingCallRoom";
import { getCalendarEventById } from "@/lib/calendar-meeting-service";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getMessagingCallRoom } from "@/lib/messaging-call-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = createNoIndexMetadata({
  title: "Video meeting",
  description: "Private workspace video meeting room.",
  path: "/meet/video",
});

type MeetVideoPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ guest?: string }>;
};

function NotFoundMeetStub({ sessionId }: { sessionId: string }) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#020617] px-5 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#07111f] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              Meeting
            </p>
            <h1 className="text-xl font-semibold text-white">Meeting not found</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/65">
          This video link is inactive or unknown. Ask the host for a fresh Instant Meeting link from
          Communications, or open a Calendar meeting while signed in.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center">
          <p className="text-sm font-medium text-white/80">Session ID: {sessionId}</p>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Need help? Contact the meeting organiser for a new link.
        </p>
      </div>
    </section>
  );
}

export default async function MeetVideoPage({ params, searchParams }: MeetVideoPageProps) {
  const { sessionId } = await params;
  const { guest } = await searchParams;
  const guestToken = guest?.trim() || null;

  if (isSupabaseConfigured()) {
    try {
      const room = await getMessagingCallRoom(sessionId);
      if (room && !room.endedAt && room.callType === "video") {
        return (
          <MessagingCallRoom
            sessionId={room.sessionId}
            expectedMode="video"
            guestToken={guestToken}
          />
        );
      }
    } catch {
      // Continue resolving calendar / unknown sessions.
    }

    try {
      const event = await getCalendarEventById(sessionId);
      if (event) {
        return <CalendarMeetRoom eventId={event.id} />;
      }
    } catch {
      // Fall through to not-found UI.
    }
  }

  return <NotFoundMeetStub sessionId={sessionId} />;
}
