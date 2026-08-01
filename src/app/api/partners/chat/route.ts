import { NextRequest, NextResponse } from "next/server";

import { PARTNER_COUNTRIES, PARTNER_COUNTRY_NAMES } from "@/lib/partners/countries";
import {
  createAndSendPartnerOtp,
  createPartnerAfterOtp,
  getPartnerById,
  sendPartnerPortalLinkEmail,
  updatePartner,
  verifyPartnerOtp,
} from "@/lib/partners/service";
import type { PartnerChatStep } from "@/lib/partners/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatState = {
  step: PartnerChatStep;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  partnerId?: string;
  phoneCountryCode?: string;
};

function nextPrompt(step: PartnerChatStep, state: ChatState): {
  reply: string;
  inputType?: "text" | "email" | "otp" | "country" | "phoneCode" | "none";
  options?: string[];
} {
  switch (step) {
    case "welcome":
      return {
        reply:
          "Welcome to the Unit311 Central Partners signup. This page is for distributors and representatives.\n\nWhat is your first name?",
        inputType: "text",
      };
    case "firstName":
      return { reply: "Thanks. What is your last name?", inputType: "text" };
    case "lastName":
      return { reply: "What is your full company name?", inputType: "text" };
    case "companyName":
      return { reply: "What is your email address?", inputType: "email" };
    case "email":
      return {
        reply:
          "Please check your email for a one-time verification code, then enter that code here.",
        inputType: "otp",
      };
    case "otp":
      return {
        reply: `Thank you for verifying. Let's securely continue creating your record in our system.\n\nHello ${state.firstName}, let's continue and capture some information about ${state.companyName}.\n\nWhat is the 1st line of your company registered address?`,
        inputType: "text",
      };
    case "address1":
      return {
        reply:
          "If you have a 2nd line of address, please enter it now (optional), or type none to continue.",
        inputType: "text",
      };
    case "address2":
      return { reply: "Which city?", inputType: "text" };
    case "city":
      return { reply: "Which district/suburb?", inputType: "text" };
    case "district":
      return {
        reply: "Which country? Choose from the list below.",
        inputType: "country",
        options: PARTNER_COUNTRY_NAMES,
      };
    case "country":
      return { reply: "Enter your postcode or zip code.", inputType: "text" };
    case "postcode":
      return {
        reply: "Select your phone country code first.",
        inputType: "phoneCode",
        options: PARTNER_COUNTRIES.map((row) => `${row.name} ${row.dialCode}`),
      };
    case "phoneCode":
      return { reply: "Enter your phone number (digits only).", inputType: "text" };
    case "phoneNumber":
      return {
        reply:
          "Thank you. Let's securely save your bank details for payment.\n\nPlease note we will need an invoice from you to be able to pay.\n\nName of account holder / company?",
        inputType: "text",
      };
    case "bankIntro":
    case "accountHolder":
      return { reply: "Bank name?", inputType: "text" };
    case "bankName":
      return { reply: "Full bank address?", inputType: "text" };
    case "bankAddress":
      return { reply: "Account number?", inputType: "text" };
    case "accountNumber":
      return { reply: "Sort code? (or type none if not applicable)", inputType: "text" };
    case "sortCode":
      return { reply: "SWIFT? (or type none if not applicable)", inputType: "text" };
    case "swift":
      return { reply: "IBAN? (or type none if not applicable)", inputType: "text" };
    case "iban":
      return { reply: "BIC? (or type none if not applicable)", inputType: "text" };
    case "bic":
      return { reply: "Routing number? (or type none if not applicable)", inputType: "text" };
    case "routing":
    case "done":
      return {
        reply: state.partnerId
          ? "Thanks — your partner record is saved. We've emailed your unique portal link so you can update details and submit invoices anytime."
          : "Thanks — your partner record is saved.",
        inputType: "none",
      };
    default:
      return { reply: "Let's continue.", inputType: "text" };
  }
}

export async function GET() {
  const prompt = nextPrompt("welcome", { step: "welcome" });
  return NextResponse.json({
    state: { step: "welcome" } satisfies ChatState,
    ...prompt,
    countries: PARTNER_COUNTRY_NAMES,
    phoneCodes: PARTNER_COUNTRIES.map((row) => `${row.name} ${row.dialCode}`),
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      state?: ChatState;
      message?: string;
    };
    const state: ChatState = { step: "welcome", ...(body.state || {}) };
    const message = String(body.message || "").trim();
    if (!message && state.step !== "welcome") {
      return NextResponse.json({ error: "Please enter a reply." }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    let replyExtra = "";

    const optional = (value: string) => {
      const v = value.trim();
      if (!v || /^none$/i.test(v)) return null;
      return v;
    };

    switch (state.step) {
      case "welcome": {
        state.firstName = message;
        state.step = "firstName";
        break;
      }
      case "firstName": {
        state.lastName = message;
        state.step = "lastName";
        break;
      }
      case "lastName": {
        state.companyName = message;
        state.step = "companyName";
        break;
      }
      case "companyName": {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message)) {
          return NextResponse.json({
            state,
            reply: "Please enter a valid email address.",
            inputType: "email",
          });
        }
        state.email = message.toLowerCase();
        await createAndSendPartnerOtp({
          email: state.email,
          firstName: state.firstName || "",
          lastName: state.lastName || "",
          companyName: state.companyName || "",
        });
        state.step = "email";
        break;
      }
      case "email": {
        const verified = await verifyPartnerOtp({
          email: state.email || "",
          code: message,
        });
        const partner = await createPartnerAfterOtp({
          ...verified,
          origin,
        });
        state.partnerId = partner.id;
        state.firstName = partner.firstName;
        state.companyName = partner.companyName;
        state.step = "otp";
        replyExtra =
          "Thank you for verifying. Let's securely continue with creating your record in our system.";
        break;
      }
      case "otp": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { addressLine1: message, intakeStep: "address" });
        state.step = "address1";
        break;
      }
      case "address1": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { addressLine2: optional(message) });
        state.step = "address2";
        break;
      }
      case "address2": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { city: message });
        state.step = "city";
        break;
      }
      case "city": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { district: message });
        state.step = "district";
        break;
      }
      case "district": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        if (!PARTNER_COUNTRY_NAMES.includes(message)) {
          return NextResponse.json({
            state,
            reply: "Please choose a country from the dropdown list.",
            inputType: "country",
            options: PARTNER_COUNTRY_NAMES,
          });
        }
        await updatePartner(state.partnerId, { country: message });
        state.step = "country";
        break;
      }
      case "country": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { postcode: message });
        state.step = "postcode";
        break;
      }
      case "postcode": {
        const match = PARTNER_COUNTRIES.find(
          (row) => `${row.name} ${row.dialCode}` === message || row.dialCode === message,
        );
        if (!match) {
          return NextResponse.json({
            state,
            reply: "Please choose a phone country code from the list.",
            inputType: "phoneCode",
            options: PARTNER_COUNTRIES.map((row) => `${row.name} ${row.dialCode}`),
          });
        }
        state.phoneCountryCode = match.dialCode;
        if (state.partnerId) {
          await updatePartner(state.partnerId, { phoneCountryCode: match.dialCode });
        }
        state.step = "phoneCode";
        break;
      }
      case "phoneCode": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, {
          phoneNumber: message.replace(/[^\d+]/g, ""),
          intakeStep: "bank",
        });
        state.step = "phoneNumber";
        break;
      }
      case "phoneNumber": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { accountHolder: message });
        state.step = "accountHolder";
        break;
      }
      case "accountHolder": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { bankName: message });
        state.step = "bankName";
        break;
      }
      case "bankName": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { bankAddress: message });
        state.step = "bankAddress";
        break;
      }
      case "bankAddress": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { accountNumber: message });
        state.step = "accountNumber";
        break;
      }
      case "accountNumber": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { sortCode: optional(message) });
        state.step = "sortCode";
        break;
      }
      case "sortCode": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { swift: optional(message) });
        state.step = "swift";
        break;
      }
      case "swift": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { iban: optional(message) });
        state.step = "iban";
        break;
      }
      case "iban": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        await updatePartner(state.partnerId, { bic: optional(message) });
        state.step = "bic";
        break;
      }
      case "bic": {
        if (!state.partnerId) throw new Error("Partner record missing.");
        const partner = await updatePartner(state.partnerId, {
          routing: optional(message),
          intakeStep: "complete",
          status: "active",
        });
        await sendPartnerPortalLinkEmail(partner);
        state.step = "done";
        break;
      }
      default:
        break;
    }

    // After processing current step, prompt for the NEXT question.
    // Mapping: after answering X we set step to X's completed marker; nextPrompt uses that marker.
    const promptStep: PartnerChatStep =
      state.step === "firstName"
        ? "firstName"
        : state.step === "lastName"
          ? "lastName"
          : state.step === "companyName"
            ? "companyName"
            : state.step === "email"
              ? "email"
              : state.step === "otp"
                ? "otp"
                : state.step === "address1"
                  ? "address1"
                  : state.step === "address2"
                    ? "address2"
                    : state.step === "city"
                      ? "city"
                      : state.step === "district"
                        ? "district"
                        : state.step === "country"
                          ? "country"
                          : state.step === "postcode"
                            ? "postcode"
                            : state.step === "phoneCode"
                              ? "phoneCode"
                              : state.step === "phoneNumber"
                                ? "phoneNumber"
                                : state.step === "accountHolder"
                                  ? "accountHolder"
                                  : state.step === "bankName"
                                    ? "bankName"
                                    : state.step === "bankAddress"
                                      ? "bankAddress"
                                      : state.step === "accountNumber"
                                        ? "accountNumber"
                                        : state.step === "sortCode"
                                          ? "sortCode"
                                          : state.step === "swift"
                                            ? "swift"
                                            : state.step === "iban"
                                              ? "iban"
                                              : state.step === "bic"
                                                ? "bic"
                                                : state.step === "done"
                                                  ? "done"
                                                  : "welcome";

    const prompt = nextPrompt(promptStep, state);
    let reply = prompt.reply;
    if (state.step === "otp" && replyExtra) {
      // otp case already embeds thank-you in nextPrompt("otp")
      reply = nextPrompt("otp", state).reply;
    }
    if (state.step === "done") {
      const partner = state.partnerId ? await getPartnerById(state.partnerId) : null;
      reply = [
        "Confirmation thanks — your partner record is updated.",
        partner?.portalUrl ? `Your unique portal URL:\n${partner.portalUrl}` : null,
        "We've also emailed this link to you.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    return NextResponse.json({
      state,
      reply,
      inputType: prompt.inputType,
      options: prompt.options,
      partnerId: state.partnerId || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Partners chat failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
