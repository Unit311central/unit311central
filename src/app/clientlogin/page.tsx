import type { Metadata } from "next";

import BcdLoginPage from "@/components/auth/BcdLoginPage";

export const metadata: Metadata = {
  title: "Client Login | BCN Drone Center",
  description: "Sign in to your BCN Drone Center client intelligence workspace.",
  robots: { index: false, follow: false },
};

export default function ClientLoginPage() {
  return <BcdLoginPage variant="client" />;
}
