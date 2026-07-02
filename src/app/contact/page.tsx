import type { Metadata } from "next";
import ContactPageContent from "@/components/contact/ContactPageContent";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact DroneCatalyst for drone inspection, surveying and commercial imaging enquiries. We respond within one business day.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <ContactPageContent />
    </>
  );
}
