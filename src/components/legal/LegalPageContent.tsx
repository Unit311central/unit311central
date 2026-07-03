import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageContentProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export default function LegalPageContent({ title, intro, children }: LegalPageContentProps) {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
          Unit311 Central
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1a2b4a] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-[#1a2b4a]/70 sm:text-[17px]">
          {intro}
        </p>

        <div className="prose-legal mt-10 space-y-6 text-[15px] leading-relaxed text-[#1a2b4a]/80">
          {children}
        </div>

        <p className="mt-12 text-sm text-[#1a2b4a]/55">
          Questions?{" "}
          <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
