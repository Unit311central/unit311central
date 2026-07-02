import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support flow demo · WhatsApp",
  description: "Progressive four-panel support ticketing flow demo",
};

export default function WhatsAppSupportFlowLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-hidden bg-[#07111F]">{children}</div>;
}
