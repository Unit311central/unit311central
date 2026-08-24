import {
  INTERFACE_WORX_EMAIL,
  INTERFACE_WORX_LINKEDIN_URL,
  INTERFACE_WORX_MISSION,
} from "@/lib/interface-worx-surface";

export default function InterfaceWorxAboutContent() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        About Interface Worx
      </h1>

      <p className="mt-8 text-lg font-medium leading-relaxed text-slate-800">
        {INTERFACE_WORX_MISSION}
      </p>

      <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
        Interface Worx is a UK prosthetic interface technology company developing technologies
        intended to improve outcomes and widen access to essential care for people living with
        amputation worldwide.
      </p>

      <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
        As a prosthetic interface / socket liner company, Interface Worx focuses on the critical
        connection between limb and prosthesis — where fit, comfort, and reliability shape everyday
        experience for people who rely on prosthetic care.
      </p>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Future content areas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Additional sections — such as technology, products, clinical evidence, team, partners,
          manufacturing, and research — will be added here as verified information becomes
          available.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href={`mailto:${INTERFACE_WORX_EMAIL}`}
          className="inline-flex items-center justify-center rounded-md bg-[#CC5500] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b34a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
        >
          Email Interface Worx
        </a>
        <a
          href={INTERFACE_WORX_LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#CC5500] hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
        >
          Visit Interface Worx on LinkedIn
        </a>
      </div>
    </div>
  );
}
