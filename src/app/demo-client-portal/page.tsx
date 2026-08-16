import { redirect } from "next/navigation";

import { demoClientPortalPublicPath } from "@/lib/demo/demo-client-portal-routes";

export default function LegacyDemoClientPortalPage() {
  redirect(demoClientPortalPublicPath());
}
