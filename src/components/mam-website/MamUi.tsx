import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const mamColors = {
  bg: "#0c0e11",
  surface: "#14181f",
  border: "rgba(255,255,255,0.08)",
  muted: "#9aa3ad",
  accent: "#8fa4b8",
  accentHover: "#a8bac9",
} as const;

export function MamContainer({
  className,
  children,
  narrow,
}: {
  className?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-4xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MamSection({
  id,
  className,
  children,
  tone = "dark",
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  tone?: "dark" | "light" | "elevated";
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        tone === "dark" && "bg-[#0c0e11] text-white",
        tone === "light" && "bg-[#f4f5f6] text-[#0c0e11]",
        tone === "elevated" && "bg-[#14181f] text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MamEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fa4b8]">
      {children}
    </p>
  );
}

export function MamHeading({
  as: Tag = "h2",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "font-semibold tracking-tight text-white",
        Tag === "h1" && "text-4xl sm:text-5xl lg:text-6xl leading-[1.05]",
        Tag === "h2" && "text-3xl sm:text-4xl leading-tight",
        Tag === "h3" && "text-xl sm:text-2xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function MamLead({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn("max-w-2xl text-base leading-relaxed text-[#b8c0c8] sm:text-lg", className)}>
      {children}
    </p>
  );
}

type MamButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function MamButton({ href, children, variant = "primary", className }: MamButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fa4b8]",
        variant === "primary" &&
          "bg-[#8fa4b8] text-[#0c0e11] hover:bg-[#a8bac9]",
        variant === "secondary" &&
          "border border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/5",
        variant === "ghost" && "text-[#8fa4b8] hover:text-[#a8bac9] underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MamServiceCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col border border-white/10 bg-[#14181f]/80 p-6 sm:p-7">
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#b0b8c0]">{children}</p>
    </article>
  );
}

export function MamWhyItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-l-2 border-[#8fa4b8]/60 pl-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#b0b8c0]">{children}</p>
    </div>
  );
}

export function MamIndustryPill({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center border border-white/10 bg-[#14181f] px-4 py-6 text-center text-sm font-medium text-white/90">
      {label}
    </div>
  );
}

export function MamProcessStep({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-3 border border-white/10 bg-[#0c0e11] p-6">
      <span className="font-mono text-xs font-semibold tracking-widest text-[#8fa4b8]">{step}</span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-[#b0b8c0]">{children}</p>
    </div>
  );
}
