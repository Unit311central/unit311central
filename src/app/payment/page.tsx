import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Payment",
  description: "Complete your Unit311 Central subscription payment by bank transfer.",
  path: "/payment",
});

export default function PaymentPage() {
  redirect("/payment-transfer");
}
