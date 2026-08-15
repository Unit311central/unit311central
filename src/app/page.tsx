import HomeHero from "@/components/home/HomeHero";
import HomeBusinessCase from "@/components/home/HomeBusinessCase";
import HomeCustomerProof from "@/components/home/HomeCustomerProof";
import HomeWhatWeOffering from "@/components/home/HomeWhatWeOffering";
import WhoWeWorkWith from "@/components/home/WhoWeWorkWith";
import HomePricing from "@/components/home/HomePricing";
import { UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC } from "@/lib/unit311-central-homepage-video";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden pb-[max(5rem,calc(3rem+env(safe-area-inset-bottom)))] lg:pb-0">
      <link
        rel="preload"
        href={UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC}
        as="video"
        type="video/mp4"
        fetchPriority="high"
      />
      <HomeHero />
      <HomeWhatWeOffering />
      <HomeCustomerProof />
      <HomeBusinessCase />
      <WhoWeWorkWith />
      <HomePricing />
    </div>
  );
}
