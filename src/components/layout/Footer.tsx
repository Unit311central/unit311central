"use client";

import Link from "next/link";

import { CONTACT, SITE_HERO_LINE, SITE_NAME } from "@/lib/site";
import Unit311CentralWordmark from "./Unit311CentralWordmark";

type FooterSection = {
  id: string;
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
};

const FOOTER_SECTIONS: FooterSection[] = [
  {
    id: "solutions",
    title: "Solutions",
    links: [
      { href: "/", label: "Home" },
      { href: "/#platform", label: "Platform" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
      { href: "/security", label: "Platform Security" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/termsandconditions", label: "Terms & Conditions" },
      { href: "/privacypolicy", label: "Privacy Policy" },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/book", label: "Book a demo" },
      { href: "/signup", label: "Sign up" },
      { href: "/login", label: "Sign in" },
      { href: `mailto:${CONTACT.infoEmail}`, label: CONTACT.infoEmail, external: true },
      { href: CONTACT.linkedin, label: "LinkedIn", external: true },
    ],
  },
];

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className = "block py-2 text-[13px] text-[#1a2b4a]/65 transition-colors hover:text-[#1a2b4a]";

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function FooterSectionBlock({ section }: { section: FooterSection }) {
  return (
    <div className="border-b border-black/[0.08] pb-5 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1a2b4a]">
        {section.title}
      </h3>
      <ul className="mt-2">
        {section.links.map((link) => (
          <li key={`${section.id}-${link.href}`}>
            <FooterLink href={link.href} label={link.label} external={link.external} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-white text-[#1a2b4a]">
      <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-6 sm:px-8 sm:pb-[32px] sm:pt-[56px]">
        <div className="mb-5 sm:mb-0">
          <Link href="/" aria-label={SITE_NAME} className="inline-flex shrink-0 items-center">
            <Unit311CentralWordmark variant="footer" />
          </Link>
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-[#1a2b4a]/65 sm:mt-[14px] sm:text-[13px] sm:whitespace-nowrap">
            {SITE_HERO_LINE}
          </p>
          <span className="mt-3 block h-[3px] w-[36px] bg-[#2563eb] sm:mt-[12px]" aria-hidden />
        </div>

        <div className="mt-5 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-8 lg:mt-[48px] lg:grid-cols-3 lg:gap-10">
          {FOOTER_SECTIONS.map((section) => (
            <FooterSectionBlock key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-6 border-t border-black/[0.08] pt-4 text-center sm:mt-[48px] sm:pt-[24px]">
          <p className="text-[11px] text-[#1a2b4a]/50 sm:text-[12px]">
            © {new Date().getFullYear()} Unit311Central. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
