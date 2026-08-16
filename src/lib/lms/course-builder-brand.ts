import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";

export type CourseBuilderBrand = {
  orgName: string;
  generatorLabel: string;
  accentText: string;
  accentBorder: string;
  accentGradient: string;
  description: string;
  codePrefix: string;
};

export function resolveCourseBuilderBrand(): CourseBuilderBrand {
  if (typeof window !== "undefined" && isBrowserTalantonImpactSurface()) {
    return {
      orgName: "Talanton Impact",
      generatorLabel: "Talanton Impact AI Course Generator",
      accentText: "text-emerald-300",
      accentBorder: "border-emerald-400/25",
      accentGradient: "from-emerald-500/15 via-transparent to-transparent",
      description:
        "PDF or Word (policies, handbooks, ESG, investment process, portfolio SOPs). AI builds modules, scenarios, assessments, and certificate settings for review.",
      codePrefix: "TI",
    };
  }
  if (typeof window !== "undefined" && isBrowserAbhiSurface()) {
    return {
      orgName: "ABHI",
      generatorLabel: "ABHI AI Course Generator",
      accentText: "text-[#f9a8d4]",
      accentBorder: "border-[#C2185B]/25",
      accentGradient: "from-[#C2185B]/15 via-transparent to-transparent",
      description:
        "PDF or Word (Anti-Bribery, GDPR, handbook, MHRA, SOPs, exhibitor guides). AI builds modules, scenarios, assessments, and certificate settings for review.",
      codePrefix: "ABHI",
    };
  }
  if (typeof window !== "undefined" && isBrowserOnwardAirSurface()) {
    return {
      orgName: "OnwardAir",
      generatorLabel: "OnwardAir AI Course Generator",
      accentText: "text-amber-300",
      accentBorder: "border-amber-400/25",
      accentGradient: "from-amber-500/15 via-transparent to-transparent",
      description:
        "PDF or Word (SOPs, flight-test procedures, hangar safety, handbooks). AI builds modules, scenarios, assessments, and certificate settings for review.",
      codePrefix: "OA",
    };
  }
  if (typeof window !== "undefined" && isBrowserDemoSurface()) {
    return {
      orgName: "Northstar Industrial Technologies",
      generatorLabel: "Northstar AI Course Generator",
      accentText: "text-sky-300",
      accentBorder: "border-sky-400/25",
      accentGradient: "from-sky-500/15 via-transparent to-transparent",
      description:
        "PDF or Word (edge deployment SOPs, ISO procedures, safety handbooks, client onboarding packs). AI builds modules, scenarios, assessments, and certificate settings for review.",
      codePrefix: "NST",
    };
  }
  return {
    orgName: "Workspace",
    generatorLabel: "AI Course Generator",
    accentText: "text-violet-300",
    accentBorder: "border-violet-400/25",
    accentGradient: "from-violet-500/15 via-transparent to-transparent",
    description:
      "PDF or Word (policies, SOPs, handbooks). AI builds modules, scenarios, assessments, and certificate settings for review.",
    codePrefix: "TRN",
  };
}
