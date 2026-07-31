import type { Metadata } from "next";

import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Support Lounge",
  description: "AI support lounge for client ticket intake.",
  path: "/s",
});

export default function SupportLoungeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
