import { Bot, Headset, Layers, Plug } from "lucide-react";
import HomeSectionTitle from "./HomeSectionTitle";

const OFFERINGS = [
  {
    icon: Layers,
    title: "Configured business platform",
    description:
      "Unit311 Central — workspaces shaped to your company: leadership dashboards, clients & projects, operations, people, finance and corporate records. Scope set in your proposal, not a rigid off-the-shelf bundle.",
    accent: "#3b82f6",
  },
  {
    icon: Bot,
    title: "AI executive assistant",
    description:
      "Intelligence across your live business data — briefings, search, operating reports, board packs and actions without waiting on IT or rebuilding spreadsheets.",
    accent: "#f472b6",
  },
  {
    icon: Plug,
    title: "Business app integrations",
    description:
      "Connect accounting, email, storage and the specialist tools you already use into one operating layer — consolidate where it makes sense, connect what stays.",
    accent: "#38bdf8",
  },
  {
    icon: Headset,
    title: "Implementation, support & customization",
    description:
      "Fixed-scope launch — configuration, permissions, migration, training and go-live — plus high-touch support and a monthly allowance to request changes as your business evolves.",
    accent: "#10b981",
  },
] as const;

export default function HomeWhatWeOffering() {
  return (
    <section
      id="offering"
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
        <HomeSectionTitle>What we are offering</HomeSectionTitle>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-white/55 sm:text-[15px] md:text-[16px]">
          A complete business operating package for funded startups and growing SMEs — platform, AI
          intelligence, integrations, and hands-on launch and support. Every business is different;
          what we deliver is scoped to how yours runs.
        </p>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:gap-5">
          {OFFERINGS.map((item) => (
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
