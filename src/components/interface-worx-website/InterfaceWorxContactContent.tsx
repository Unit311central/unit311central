import {
  INTERFACE_WORX_EMAIL,
  INTERFACE_WORX_LINKEDIN_URL,
} from "@/lib/interface-worx-surface";

export default function InterfaceWorxContactContent() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Contact</h1>

      <p className="mt-4 text-lg font-semibold text-slate-900">Interface Worx</p>

      <dl className="mt-10 space-y-8">
        <div>
          <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Email</dt>
          <dd className="mt-2">
            <a
              href={`mailto:${INTERFACE_WORX_EMAIL}`}
              className="text-lg font-medium text-[#CC5500] hover:text-[#b34a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
            >
              {INTERFACE_WORX_EMAIL}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            LinkedIn
          </dt>
          <dd className="mt-2">
            <a
              href={INTERFACE_WORX_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-slate-800 hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
            >
              https://www.linkedin.com/company/interfaceworx
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-12 flex flex-wrap gap-4">
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
