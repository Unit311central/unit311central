import { Bot, LayoutDashboard, Plug, Wallet } from "lucide-react";
import HomeSectionTitle from "./HomeSectionTitle";

const OUTCOMES = [
  {
    icon: LayoutDashboard,
    title: "See the whole business",
    description:
      "One login for leadership, ops and teams — live dashboards, projects, clients and activity without jumping between apps.",
    accent: "#3b82f6",
  },
  {
    icon: Bot,
    title: "Answers without a ticket queue",
    description:
      "AI executive assistant across your data — board packs, summaries and operational questions in minutes, not days.",
    accent: "#f472b6",
  },
  {
    icon: Wallet,
    title: "Numbers the board trusts",
    description:
      "Financials, reporting and corporate records in the same system your operators use every day.",
    accent: "#10b981",
  },
  {
    icon: Plug,
    title: "Connect what stays",
    description:
      "Consolidate where it makes sense. Keep specialist tools — accounting, email, storage — wired into one layer.",
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
        <HomeSectionTitle>What you get in practice</HomeSectionTitle>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-white/55 sm:text-[15px]">
          Four outcomes growing companies care about — not a catalogue of modules.
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
