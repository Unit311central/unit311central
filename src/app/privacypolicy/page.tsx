import type { Metadata } from "next";

import LegalPageContent from "@/components/legal/LegalPageContent";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Unit311 Central website, platform, and communications.",
  path: "/privacypolicy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacypolicy" },
        ])}
      />
      <LegalPageContent
        title="Privacy Policy"
        intro="This privacy policy explains how Unit311 Central handles personal data. This page is a placeholder while final legal copy is prepared."
      >
        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">1. Information we collect</h2>
          <p className="mt-3">
            We may collect contact details, company information, account credentials, usage data,
            support communications, and billing information when you enquire about, subscribe to, or
            use Unit311 Central.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">2. How we use information</h2>
          <p className="mt-3">
            Personal data is used to provide the platform, respond to enquiries, manage subscriptions,
            deliver support, improve services, and meet legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">3. Sharing and retention</h2>
          <p className="mt-3">
            Data may be processed by infrastructure, email, payment, and support providers acting on
            our behalf. We retain information only as long as needed for the purposes described above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1a2b4a]">4. Placeholder notice</h2>
          <p className="mt-3">
            This document will be replaced with a full privacy policy. For privacy requests, contact{" "}
            <a href="mailto:info@unit311central.com" className="text-[#2563eb] hover:underline">
              info@unit311central.com
            </a>
            .
          </p>
        </section>
      </LegalPageContent>
    </>
  );
}
