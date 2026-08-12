export const MARKETING_PATHS = [
  "/about",
  "/faq",
  "/contact",
  "/signup",
  "/login",
  "/security",
  "/termsandconditions",
  "/privacypolicy",
  "/book",
  "/module-review",
  "/payment",
  "/payment-transfer",
] as const;

export function isMarketingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return MARKETING_PATHS.includes(pathname as (typeof MARKETING_PATHS)[number]);
}

export const MARKETING_CONTENT_CLASS =
  "relative z-10 mx-auto w-full max-w-[1400px] px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(5.5rem,calc(2rem+env(safe-area-inset-bottom)+3.5rem))] sm:px-8 sm:py-16 lg:px-10 lg:py-20 lg:pb-[max(2rem,env(safe-area-inset-bottom))]";

export const marketingEyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd] sm:text-xs sm:tracking-[0.28em]";

export const marketingPageTitle =
  "text-[1.5rem] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem] sm:leading-[1.08] lg:text-[2.75rem]";

export const marketingPageIntro =
  "mt-5 text-[15px] leading-relaxed text-white/70 sm:text-[17px]";

export const marketingSectionTitle =
  "text-2xl font-bold tracking-tight text-white sm:text-3xl";

export const marketingCard =
  "rounded-2xl border border-white/12 bg-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-white/18";

export const marketingCardLarge =
  "rounded-[28px] border border-white/12 bg-white/[0.06] shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-md";

export const marketingFormShell =
  "rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.12] to-white/[0.05] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-md sm:rounded-[28px] sm:p-5 lg:rounded-[32px] lg:p-6";

export const marketingBtnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0b2d63] transition-colors hover:bg-white/90";

export const marketingBtnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10";

/** Dark-to-light green gradient surface for primary demo / conversion CTAs. */
export const marketingBtnGreenSurface =
  "bg-gradient-to-r from-[#0f4d28] via-[#15803d] to-[#22c55e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_14px_rgba(15,77,40,0.42)] transition-[filter,box-shadow] hover:brightness-[1.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_20px_rgba(34,197,94,0.32)] active:brightness-[0.98]";

export const marketingBtnGreen =
  `inline-flex h-11 items-center justify-center rounded-lg px-7 text-[15px] font-semibold ${marketingBtnGreenSurface}`;

export const marketingBtnGreenLg =
  `inline-flex min-h-14 w-full max-w-lg items-center justify-center rounded-xl px-6 text-base font-semibold sm:h-16 sm:w-auto sm:px-10 sm:text-lg ${marketingBtnGreenSurface}`;

export const marketingBtnSubmit =
  "inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-[#2563eb] px-6 py-3 text-base font-semibold text-white shadow-[0_0_32px_rgba(37,99,235,0.35)] transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

export const marketingInputLabel = "mb-1.5 block text-sm font-medium text-white/80";

export const marketingInput =
  "w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-60 sm:py-2.5 sm:text-sm";

export const marketingLegalH2 = "text-lg font-semibold text-white";

export const marketingLegalP = "mt-3 text-[15px] leading-relaxed text-white/72";

export const marketingLegalLink =
  "font-medium text-[#93c5fd] transition-colors hover:text-[#bfdbfe] hover:underline";

export const marketingFadeIn = "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both";
