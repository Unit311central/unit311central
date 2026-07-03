"use client";

import { FormEvent, useState } from "react";
import { Building2, CreditCard } from "lucide-react";

const PAYMENT_AMOUNT = "US$2,985";
const PAYMENT_PERIOD = "3 months";

const WISE_DETAILS = {
  accountHolder: "Unit311 Central Ltd",
  bankName: "Wise Payments Ltd",
  accountNumber: "83124695",
  sortCode: "23-14-70",
  iban: "GB68 TRWI 2314 7083 1246 95",
  swift: "TRWIGB2LXXX",
  reference: "Unit311 quarterly subscription",
} as const;

function AmountBanner() {
  return (
    <div className="rounded-xl border border-[#3b82f6]/25 bg-[#2563eb]/10 px-4 py-3 text-center">
      <p className="text-sm font-medium text-white/70">Amount due now</p>
      <p className="mt-1 text-2xl font-bold text-white">{PAYMENT_AMOUNT}</p>
      <p className="mt-1 text-sm text-[#93c5fd]">Payable now for {PAYMENT_PERIOD}</p>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-60"
      />
    </div>
  );
}

export default function PaymentPageContent() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUsername(String(formData.get("username") ?? "").trim() || "Customer");
    setAuthenticated(true);
  }

  return (
    <section className="min-h-screen bg-[#020617] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-sm">
            Unit311 Central
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Payment</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
            Complete your quarterly subscription payment for Unit311 Professional.
          </p>
        </div>

        {!authenticated ? (
          <div className="mx-auto mt-10 max-w-md rounded-[28px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
            <h2 className="text-lg font-semibold text-white">Sign in to continue</h2>
            <p className="mt-2 text-sm text-white/60">
              Enter your workspace username and password to access payment options.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <Field id="username" label="Username" placeholder="Your username" />
              <Field id="password" label="Password" type="password" placeholder="Your password" />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Continue to payment
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            <p className="text-center text-sm text-white/60">
              Signed in as <span className="font-medium text-white">{username}</span>
            </p>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[28px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563eb]/20 text-[#93c5fd]">
                    <CreditCard className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Pay by card</h2>
                    <p className="text-sm text-white/55">Secure card payment via Stripe</p>
                  </div>
                </div>

                <div className="mt-6">
                  <AmountBanner />
                </div>

                <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                  <Field id="cardName" label="Name on card" placeholder="Full name" />
                  <Field id="cardNumber" label="Card number" placeholder="4242 4242 4242 4242" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="expiry" label="Expiry" placeholder="MM / YY" />
                    <Field id="cvc" label="CVC" placeholder="123" />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#0b2d63] transition-colors hover:bg-white/90"
                  >
                    Pay {PAYMENT_AMOUNT} now
                  </button>
                  <p className="text-center text-xs text-white/40">
                    Demo only — no payment will be processed.
                  </p>
                </form>
              </article>

              <article className="rounded-[28px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/20 text-[#6ee7b7]">
                    <Building2 className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Pay by bank transfer</h2>
                    <p className="text-sm text-white/55">Transfer via Wise</p>
                  </div>
                </div>

                <div className="mt-6">
                  <AmountBanner />
                </div>

                <dl className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#07111f]/70 p-5 text-sm">
                  <div>
                    <dt className="text-white/45">Account holder</dt>
                    <dd className="mt-1 font-medium text-white">{WISE_DETAILS.accountHolder}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Bank</dt>
                    <dd className="mt-1 font-medium text-white">{WISE_DETAILS.bankName}</dd>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-white/45">Account number</dt>
                      <dd className="mt-1 font-medium text-white">{WISE_DETAILS.accountNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Sort code</dt>
                      <dd className="mt-1 font-medium text-white">{WISE_DETAILS.sortCode}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-white/45">IBAN</dt>
                    <dd className="mt-1 font-medium text-white">{WISE_DETAILS.iban}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">SWIFT / BIC</dt>
                    <dd className="mt-1 font-medium text-white">{WISE_DETAILS.swift}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Payment reference</dt>
                    <dd className="mt-1 font-medium text-white">{WISE_DETAILS.reference}</dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs leading-relaxed text-white/45">
                  Demo bank details for preview only. Email{" "}
                  <a href="mailto:info@unit311central.com" className="text-[#93c5fd] hover:underline">
                    info@unit311central.com
                  </a>{" "}
                  once your transfer is sent.
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
