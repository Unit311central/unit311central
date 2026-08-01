import type { Metadata } from "next";

import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Partners",
  description: "Unit311 Central partners signup and portal.",
  path: "/partners",
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#050816]">{children}</div>;
}
