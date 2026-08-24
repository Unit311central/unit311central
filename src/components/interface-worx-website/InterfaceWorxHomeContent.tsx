import Link from "next/link";

import {
  INTERFACE_WORX_EMAIL,
  INTERFACE_WORX_HERO_IMAGE_SRC,
  INTERFACE_WORX_MISSION,
} from "@/lib/interface-worx-surface";

export default function InterfaceWorxHomeContent() {
  return (
    <>
      <section className="relative min-h-[min(88vh,720px)] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INTERFACE_WORX_HERO_IMAGE_SRC}
          alt="Healthcare professional supporting a patient during rehabilitation"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/72 to-slate-950/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 sm:hidden"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-6xl items-end px-4 pb-14 pt-28 sm:items-center sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Advancing prosthetic interface technology.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/90 sm:text-lg">
              {INTERFACE_WORX_MISSION}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-md bg-[#CC5500] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b34a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
              >
                Learn more
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Contact Interface Worx
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Prosthetic interface technology
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            Interface Worx is a UK prosthetic interface / socket liner company focused on
            developing technologies at the interface between limb and prosthesis — where comfort,
            fit, and performance matter most for people living with amputation.
          </p>
        </div>
      </section>

      <section className="bg-[#FCBD8F]/25 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Our purpose
          </h2>
          <p className="mt-6 text-lg font-medium leading-relaxed text-slate-800 sm:text-xl">
            {INTERFACE_WORX_MISSION}
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Prosthetic interface technologies
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            Interface Worx develops prosthetic interface technologies — the materials and systems
            that connect a prosthesis to the body. Our work is directed toward improving outcomes
            and widening access to essential care for people living with amputation worldwide.
          </p>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Human impact</h2>
          <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
            Every advancement in prosthetic interface technology has the potential to improve daily
            life for people living with amputation. Interface Worx exists to support that impact —
            through technologies intended to improve outcomes and widen access to essential care
            worldwide.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Talk to Interface Worx
          </h2>
          <p className="mt-4 text-base text-slate-600">
            For enquiries about Interface Worx, please contact us by email.
          </p>
          <a
            href={`mailto:${INTERFACE_WORX_EMAIL}`}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#CC5500] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b34a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
          >
            {INTERFACE_WORX_EMAIL}
          </a>
        </div>
      </section>
    </>
  );
}
