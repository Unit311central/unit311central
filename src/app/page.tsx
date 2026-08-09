import HomeHero from "@/components/home/HomeHero";
import HomeBusinessCase from "@/components/home/HomeBusinessCase";
import HomeCustomerProof from "@/components/home/HomeCustomerProof";
import HomeWhatWeOffering from "@/components/home/HomeWhatWeOffering";
import HomeOfferPlatform from "@/components/home/HomeOfferPlatform";
import WhoWeWorkWith from "@/components/home/WhoWeWorkWith";
import HomePricing from "@/components/home/HomePricing";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <HomeHero />
      <HomeWhatWeOffering />
      <HomeCustomerProof />
      <HomeBusinessCase />
      <HowUnit311Works />
      <HomeOfferPlatform />
      <WhoWeWorkWith />
      <HomePricing />
    </div>
  );
}
