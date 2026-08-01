export type PartnerInvoiceStatus = "job_not_started" | "pending" | "paid";

export type PartnerIntakeStep =
  | "identity"
  | "otp"
  | "address"
  | "bank"
  | "complete";

export type PartnerRecord = {
  id: string;
  workspaceId: string | null;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  emailVerifiedAt: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  postcode: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  accountHolder: string | null;
  bankName: string | null;
  bankAddress: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  swift: string | null;
  iban: string | null;
  bic: string | null;
  routing: string | null;
  portalToken: string;
  portalUrl: string | null;
  status: string;
  intakeStep: PartnerIntakeStep;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerInvoice = {
  id: string;
  partnerId: string;
  jobReference: string;
  description: string | null;
  amount: number | null;
  currency: string;
  status: PartnerInvoiceStatus;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type PartnerChatStep =
  | "welcome"
  | "firstName"
  | "lastName"
  | "companyName"
  | "email"
  | "otp"
  | "address1"
  | "address2"
  | "city"
  | "district"
  | "country"
  | "postcode"
  | "phoneCode"
  | "phoneNumber"
  | "bankIntro"
  | "accountHolder"
  | "bankName"
  | "bankAddress"
  | "accountNumber"
  | "sortCode"
  | "swift"
  | "iban"
  | "bic"
  | "routing"
  | "done";
