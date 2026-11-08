import type { Metadata } from "next";

import PlantationChallengeForm from "@/components/plantation/PlantationChallengeForm";
import { createPageMetadata } from "@/lib/metadata";
import { ensurePlantationChallengeSchema } from "@/lib/plantation/plantation-challenge-schema";

export const metadata: Metadata = createPageMetadata({
  title: "Plantation challenge",
  description: "Enter your estimates for the two outlined palm oil sections.",
  path: "/plantation",
  index: false,
  follow: false,
});

export const dynamic = "force-dynamic";

export default async function PlantationChallengePage() {
  await ensurePlantationChallengeSchema();
  return <PlantationChallengeForm />;
}
