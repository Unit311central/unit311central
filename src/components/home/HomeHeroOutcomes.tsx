import { Bot, LayoutDashboard, Plug, SlidersHorizontal } from "lucide-react";
import HomeSectionTitle from "./HomeSectionTitle";

const OUTCOMES = [
  {
    icon: SlidersHorizontal,
    title: "Configured for how you run",
    description:
      "Every business is different. Your workspace is shaped around your teams, workflows and systems — not a one-size-fits-all software bundle.",
    accent: "#818cf8",
  },
  {
    icon: LayoutDashboard,
    title: "One place to work",
    description:
      "Leadership and employees operate from a single layer instead of logging into disconnected apps to find answers.",
    accent: "#3b82f6",
  },
  {
    icon: Bot,
    title: "Answers on your data",
    description:
      "AI executive assistant across the information already in your business — summaries, reports and operational questions in minutes.",
    accent: "#f472b6",
  },
  {
    icon: Plug,
    title: "Connect what stays",
    description:
      "Consolidate where it makes sense. Keep the specialist tools you rely on — wired into the same operating layer.",
    accent: "#38bdf8",
  },
] as const;

export default function HomeHeroOutcomes() {
  return (
    <section
      id="outcomes"
      className="relative scroll-mt-20 overflow-x-hidden bg-[#050816] py-12 sm:scroll-mt-28 sm:py-16 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.1), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
        <HomeSectionTitle>What Unit311 Central is</HomeSectionTitle>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-white/55 sm:text-[15px] md:text-[16px]">
          Every business is different. Unit311 Central is one intelligent operating layer — configured
          around how your company actually works, with AI across your data and your existing tools
          connected where they still belong. Not a fixed catalogue of modules; the scope you need,
          wired together.
        </p>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:gap-5">
          {OUTCOMES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.25)] sm:p-6"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${item.accent}33, ${item.accent}14)`,
                }}
              >
                <item.icon className="h-5 w-5" style={{ color: item.accent }} strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
