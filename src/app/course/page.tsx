import type { Metadata } from "next";

import MalaysianLandSurveyForm from "@/components/course/MalaysianLandSurveyForm";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Malaysian Land Surveying Course",
  description:
    "Pre-course questionnaire for the Malaysian land surveying course. Tell BCN Drone Center about your sites, equipment, software and challenges.",
  path: "/course",
  index: false,
  follow: false,
});

export const dynamic = "force-dynamic";

export default function MalaysianLandSurveyCoursePage() {
  return <MalaysianLandSurveyForm />;
}
