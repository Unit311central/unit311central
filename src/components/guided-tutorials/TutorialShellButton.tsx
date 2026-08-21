"use client";

import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

import { useOptionalGuidedTutorial } from "./GuidedTutorialProvider";

type TutorialShellButtonProps = {
  className?: string;
};

export default function TutorialShellButton({ className }: TutorialShellButtonProps) {
  const guided = useOptionalGuidedTutorial();
  if (!guided) return null;

  const label = "Learn";
  const title = guided.isAvailable
    ? "Open tutorial for this screen"
    : guided.unavailableMessage ?? "No tutorial for this screen yet";

  return (
    <button
      type="button"
      data-tutorial-target="tutorial-shell-button"
      aria-label={title}
      title={title}
      onClick={() => {
        guided.openTutorial();
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold transition-colors",
        "border-violet-400/35 bg-violet-500/12 text-violet-100 hover:border-violet-300/45 hover:bg-violet-500/18",
        className,
      )}
    >
      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden max-w-[8rem] truncate sm:inline">{label}</span>
    </button>
  );
}
