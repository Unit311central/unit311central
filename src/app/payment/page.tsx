import type { Metadata } from "next";

import PaymentPageContent from "@/components/payment/PaymentPageContent";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Payment",
    description: "Complete your Unit311 Central subscription payment.",
    path: "/payment",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentPage() {
  return <PaymentPageContent />;
}
