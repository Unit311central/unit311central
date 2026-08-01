"use client";

import { useMemo, useState } from "react";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type VideoContent = Extract<LessonContent, { type: "video" }>;

type Props = {
  lesson: LmsLesson;
  content: VideoContent;
  onComplete: () => void;
};

function youtubeEmbed(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.replace("/", "")}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoEmbed(src: string): string | null {
  try {
    const url = new URL(src);
    if (!url.hostname.includes("vimeo.com")) return null;
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

export default function VideoLesson({ lesson, content, onComplete }: Props) {
  const [watched, setWatched] = useState(false);
  const provider = content.provider ?? "file";

  const embedUrl = useMemo(() => {
    if (provider === "youtube") return youtubeEmbed(content.src);
    if (provider === "vimeo") return vimeoEmbed(content.src);
    return null;
  }, [content.src, provider]);

  return (
    <ImmersiveLessonShell
      eyebrow="Video"
      title={lesson.title}
      subtitle={content.caption}
      imageUrl={content.poster}
      sceneText={`${lesson.title} ${content.caption ?? ""}`}
      primaryLabel="Next"
      primaryDisabled={!watched}
      onPrimary={onComplete}
      footer={!watched ? "Start the video to unlock Next" : "Ready to continue"}
      wide
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {embedUrl ? (
          <iframe
            title={lesson.title}
            src={embedUrl}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setWatched(true)}
          />
        ) : (
          <video
            className="aspect-video w-full"
            controls
            poster={content.poster}
            src={content.src}
            onEnded={() => setWatched(true)}
            onPlay={() => setWatched(true)}
          >
            <track kind="captions" />
          </video>
        )}
      </div>
      {embedUrl ? (
        <button
          type="button"
          onClick={() => setWatched(true)}
          className="mt-3 text-xs text-emerald-300/80 underline-offset-2 hover:underline"
        >
          I finished watching
        </button>
      ) : null}
    </ImmersiveLessonShell>
  );
}
