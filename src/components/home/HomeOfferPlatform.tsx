import HomeSectionTitle from "./HomeSectionTitle";
import HomeWorkspaceExplorer from "./HomeWorkspaceExplorer";
import HomeExecutiveDemoVideo from "./HomeExecutiveDemoVideo";

export default function HomeOfferPlatform() {
  return (
    <section
      id="services"
      className="relative scroll-mt-20 overflow-x-hidden bg-[#050816] pt-12 pb-6 sm:scroll-mt-28 sm:pt-20 sm:pb-8 lg:pt-24 lg:pb-10"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 18% 12%, rgba(56,189,248,0.07), transparent 55%), radial-gradient(ellipse 70% 50% at 88% 18%, rgba(59,130,246,0.08), transparent 58%), radial-gradient(ellipse 65% 45% at 50% 100%, rgba(37,99,235,0.06), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 75% 70% at 50% 40%, black 20%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 70% at 50% 40%, black 20%, transparent 78%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 0%, rgba(56,189,248,0.08) 42%, transparent 43%), linear-gradient(205deg, transparent 0%, rgba(59,130,246,0.06) 58%, transparent 59%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10">
        <HomeSectionTitle singleLine>Full platform depth</HomeSectionTitle>

        <div className="mx-auto mt-10 max-w-[900px] text-center sm:mt-12">
          <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.025em] text-white sm:text-[1.55rem] md:text-[1.75rem] md:leading-[1.25]">
            Built based on experience of building and growing SMEs.
          </h2>
          <p className="mx-auto mt-4 max-w-[860px] text-balance text-sm leading-relaxed text-white/58 sm:mt-5 sm:text-[15px] md:text-[17px] md:leading-relaxed">
            Senior technology executives and architects — 25+ years across enterprise, venture-backed
            startups and growing SMEs. The platform reflects that depth; explore every workspace below.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <HomeExecutiveDemoVideo />

          <p className="mx-auto mt-12 max-w-[900px] text-balance text-center text-sm leading-relaxed text-white/55 sm:mt-14 sm:text-[15px] md:mt-16 md:text-[17px] md:leading-relaxed">
            Every major business function in one system — click through to see how each workspace works.
          </p>
        </div>

        <div id="platform" className="scroll-mt-24 sm:scroll-mt-28">
          <HomeWorkspaceExplorer />
        </div>
      </div>
    </section>
  );
}
