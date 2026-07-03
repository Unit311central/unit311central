import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, Mail } from "lucide-react";

import ContactForm from "@/components/ui/ContactForm";
import { CONTACT } from "@/lib/site";

const CONTACT_BACKGROUND = "/images/hero-survey-background.png";

const CONTACT_POINTS = [
  {
    icon: Mail,
    label: "Email",
    value: CONTACT.infoEmail,
    href: `mailto:${CONTACT.infoEmail}`,
  },
  {
    icon: Clock3,
    label: "Response time",
    value: "Within one business day",
  },
  {
    icon: CalendarDays,
    label: "Prefer a call?",
    value: "Book a complimentary founder session",
    href: "/book",
  },
] as const;

export default function ContactPageContent() {
  return (
    <section className="relative min-h-screen overflow-x-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={CONTACT_BACKGROUND}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#020617]/88" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 15% 20%, rgba(37,99,235,0.18), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 80%, rgba(6,182,212,0.1), transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14 xl:gap-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-sm">
              Unit311 Central
            </p>

            <h1 className="mt-4 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[2.75rem]">
              Get in touch
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
              Tell us about your business idea, launch timeline, and what you need from the Unit311
              workspace. We&apos;ll come back with a clear next step.
            </p>

            <ul className="mt-8 space-y-4">
              {CONTACT_POINTS.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#93c5fd]">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-sm font-medium text-white/85">{item.value}</span>
                    </span>
                  </>
                );

                return (
                  <li key={item.label}>
                    {"href" in item && item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-[#3b82f6]/30 hover:bg-white/[0.06]"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-gradient-to-b from-white/[0.12] to-white/[0.05] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-5 lg:rounded-[32px] lg:p-6">
            <ContactForm variant="marketing" embedded />
          </div>
        </div>
      </div>
    </section>
  );
}
