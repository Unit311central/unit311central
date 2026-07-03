import type { Metadata } from "next";

import LegalPageContent from "@/components/legal/LegalPageContent";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for using Unit311 Central and related services.",
  path: "/termsandconditions",
});

export default function TermsAndConditionsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms & Conditions", path: "/termsandconditions" },
        ])}
      />
      <LegalPageContent
        title="Terms & Conditions"
        intro="These terms govern access to Unit311 Central and related professional services. This page is a placeholder while final legal copy is prepared."
      >
        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">1. Service overview</h2>
          <p className="mt-3">
            Unit311 Central provides a subscription workspace platform for business operations,
            including client management, projects, finance, files, email, messaging, and related
            modules. Professional services may be offered separately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">2. Subscriptions and billing</h2>
          <p className="mt-3">
            Subscription fees, billing intervals, and renewal terms are confirmed in your proposal
            and agreement. Unless otherwise stated, the initial commitment period is three months.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">3. Acceptable use</h2>
          <p className="mt-3">
            You agree to use the platform lawfully, keep account credentials secure, and not misuse
            shared inboxes, messaging, or file storage provided through the workspace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">4. Placeholder notice</h2>
          <p className="mt-3">
            This document will be replaced with full terms and conditions. Until then, please contact{" "}
            <a href="mailto:info@unit311central.com" className="text-[#2563eb] hover:underline">
              info@unit311central.com
            </a>{" "}
            for contractual questions.
          </p>
        </section>
      </LegalPageContent>
    </>
  );
}
