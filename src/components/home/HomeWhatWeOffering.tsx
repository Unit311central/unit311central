import HomeExecutiveDemoVideo from "./HomeExecutiveDemoVideo";
import HomeSectionTitle from "./HomeSectionTitle";
import HomeWorkspaceExplorer from "./HomeWorkspaceExplorer";

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

        <div className="mx-auto mt-10 flex justify-center sm:mt-12">
          <HomeExecutiveDemoVideo />
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-[1760px] px-4 sm:mt-12 sm:px-6 lg:px-6 xl:px-8 2xl:px-10">
        <p className="mx-auto max-w-[900px] text-balance text-center text-sm leading-relaxed text-white/55 sm:text-[15px] md:text-[17px] md:leading-relaxed">
          Every major business function in one system — click through to see how each workspace works.
        </p>

        <div id="platform" className="scroll-mt-24 sm:scroll-mt-28">
          <HomeWorkspaceExplorer />
        </div>
      </div>
    </section>
  );
}
