import Link from "next/link";

type CTAProps = {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
};

export default function CTA({
  title = "Ready to mobilise aerial intelligence?",
  description = "Tell us about your site, timeline and deliverables. We respond within one business day.",
  primaryLabel = "Contact Us",
  primaryHref = "/contact",
}: CTAProps) {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="gradient-border relative overflow-hidden rounded-2xl bg-surface px-8 py-14 text-center sm:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              {description}
            </p>
            <Link
              href={primaryHref}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
