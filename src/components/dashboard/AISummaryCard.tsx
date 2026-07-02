"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useDashboardData } from "./dashboard-data-context";

export default function AISummaryCard() {
  const { aiSummary } = useDashboardData();

  return (
    <Card className="relative overflow-hidden">
      <Image
        src={aiSummary.meshImage}
        alt=""
        fill
        className="object-cover opacity-[0.07]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(139,92,246,0.1),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

      <CardHeader className="relative pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
            {aiSummary.title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6 px-7 pb-8 pt-6 lg:px-9 lg:pb-10 lg:pt-8">
        {aiSummary.paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-4xl text-base leading-[1.85] text-white/70 lg:text-lg lg:leading-[1.9]"
          >
            {paragraph}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
