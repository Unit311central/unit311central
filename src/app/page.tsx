import HomeHero from "@/components/home/HomeHero";
import HomeBusinessCase from "@/components/home/HomeBusinessCase";
import HomeCustomerProof from "@/components/home/HomeCustomerProof";
import HomeHeroOutcomes from "@/components/home/HomeHeroOutcomes";
import HowUnit311Works from "@/components/home/HowUnit311Works";
import HomeOfferPlatform from "@/components/home/HomeOfferPlatform";
import WhoWeWorkWith from "@/components/home/WhoWeWorkWith";
import HomePricing from "@/components/home/HomePricing";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <HomeHero />
      <HomeBusinessCase />
      <HomeHeroOutcomes />
      <HomeCustomerProof />
      <HowUnit311Works />
      <HomeOfferPlatform />
      <WhoWeWorkWith />
      <HomePricing />
    </div>
  );
}
