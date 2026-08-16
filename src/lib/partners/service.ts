import { createHash, randomBytes, randomInt } from "node:crypto";

import { CENTRAL_SITE_URL } from "@/lib/app-domains";
import { buildSupportEmail } from "@/lib/support-email-html";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import type { PartnerInvoice, PartnerInvoiceStatus, PartnerRecord } from "@/lib/partners/types";

type DbPartner = {
  id: string;
  workspace_id: string | null;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  email_verified_at: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  postcode: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  account_holder: string | null;
  bank_name: string | null;
  bank_address: string | null;
  account_number: string | null;
  sort_code: string | null;
  swift: string | null;
  iban: string | null;
  bic: string | null;
  routing: string | null;
  portal_token: string;
  portal_url: string | null;
  status: string;
  intake_step: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function requirePartnersSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function hashCode(code: string) {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function mapPartner(row: DbPartner): PartnerRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    district: row.district,
    country: row.country,
    postcode: row.postcode,
    phoneCountryCode: row.phone_country_code,
    phoneNumber: row.phone_number,
    accountHolder: row.account_holder,
    bankName: row.bank_name,
    bankAddress: row.bank_address,
    accountNumber: row.account_number,
    sortCode: row.sort_code,
    swift: row.swift,
    iban: row.iban,
    bic: row.bic,
    routing: row.routing,
    portalToken: row.portal_token,
    portalUrl: row.portal_url,
    status: row.status,
    intakeStep: (row.intake_step as PartnerRecord["intakeStep"]) || "identity",
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildPartnerPortalUrl(token: string, origin?: string) {
  const base = (origin || CENTRAL_SITE_URL).replace(/\/$/, "");
  return `${base}/partners/p/${encodeURIComponent(token)}`;
}

export async function ensurePartnersSchema(): Promise<boolean> {
  const supabase = requirePartnersSupabase();
  const probe = await supabase.from("partners").select("id").limit(1);
  if (!probe.error) return true;
  // Table missing — attempt raw SQL via management is out of band; callers should apply migration 125.
  return false;
}

export async function createAndSendPartnerOtp(input: {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
}): Promise<{ ok: true }> {
  const supabase = requirePartnersSupabase();
  const email = input.email.trim().toLowerCase();
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase
    .from("partner_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .is("consumed_at", null);

  const { error } = await supabase.from("partner_otp_codes").insert({
    email,
    code_hash: hashCode(code),
    expires_at: expiresAt,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    company_name: input.companyName.trim(),
  });
  if (error) throw new Error(error.message);

  const { sendMailboxEmail } = await import("@/lib/email/smtp");
  const emailBody = buildSupportEmail({
    title: "Your Unit311 Central verification code",
    intro: `Hi ${input.firstName.trim() || "there"},\n\nUse this one-time code to continue your Partners signup.`,
    body: `Your verification code is:\n\n${code}\n\nIt expires in 15 minutes.`,
    footer: "— Unit311 Central Partners",
  });

  await sendMailboxEmail({
    account: "info",
    to: email,
    subject: `${code} is your Unit311 Central Partners verification code`,
    text: emailBody.text,
    html: emailBody.html,
  });

  return { ok: true };
}

export async function verifyPartnerOtp(input: {
  email: string;
  code: string;
}): Promise<{
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
}> {
  const supabase = requirePartnersSupabase();
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("partner_otp_codes")
    .select("*")
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No active verification code. Please restart signup.");
  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    throw new Error("That code has expired. Please request a new one.");
  }
  if (Number(data.attempts || 0) >= 5) {
    throw new Error("Too many attempts. Please restart signup.");
  }

  const ok = hashCode(input.code) === String(data.code_hash);
  await supabase
    .from("partner_otp_codes")
    .update({
      attempts: Number(data.attempts || 0) + 1,
      consumed_at: ok ? new Date().toISOString() : null,
    })
    .eq("id", data.id);

  if (!ok) throw new Error("That code is incorrect. Please try again.");

  return {
    firstName: String(data.first_name || ""),
    lastName: String(data.last_name || ""),
    companyName: String(data.company_name || ""),
    email,
  };
}

export async function createPartnerAfterOtp(input: {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  origin?: string;
  workspaceId?: string | null;
}): Promise<PartnerRecord> {
  const supabase = requirePartnersSupabase();
  const email = input.email.trim().toLowerCase();
  const portalToken = randomBytes(24).toString("base64url");
  const portalUrl = buildPartnerPortalUrl(portalToken, input.origin);

  const existing = await supabase
    .from("partners")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing.data) {
    const { data, error } = await supabase
      .from("partners")
      .update({
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        company_name: input.companyName.trim(),
        email_verified_at: new Date().toISOString(),
        portal_token: existing.data.portal_token || portalToken,
        portal_url: existing.data.portal_url || portalUrl,
        intake_step: "address",
        status: "onboarding",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPartner(data as DbPartner);
  }

  const { data, error } = await supabase
    .from("partners")
    .insert({
      workspace_id: input.workspaceId || null,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      company_name: input.companyName.trim(),
      email,
      email_verified_at: new Date().toISOString(),
      portal_token: portalToken,
      portal_url: portalUrl,
      status: "onboarding",
      intake_step: "address",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPartner(data as DbPartner);
}

export async function updatePartner(
  partnerId: string,
  patch: Partial<{
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
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
    intakeStep: string;
    status: string;
    notes: string | null;
  }>,
): Promise<PartnerRecord> {
  const supabase = requirePartnersSupabase();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.firstName !== undefined) payload.first_name = patch.firstName;
  if (patch.lastName !== undefined) payload.last_name = patch.lastName;
  if (patch.companyName !== undefined) payload.company_name = patch.companyName;
  if (patch.addressLine1 !== undefined) payload.address_line1 = patch.addressLine1;
  if (patch.addressLine2 !== undefined) payload.address_line2 = patch.addressLine2;
  if (patch.city !== undefined) payload.city = patch.city;
  if (patch.district !== undefined) payload.district = patch.district;
  if (patch.country !== undefined) payload.country = patch.country;
  if (patch.postcode !== undefined) payload.postcode = patch.postcode;
  if (patch.phoneCountryCode !== undefined) payload.phone_country_code = patch.phoneCountryCode;
  if (patch.phoneNumber !== undefined) payload.phone_number = patch.phoneNumber;
  if (patch.accountHolder !== undefined) payload.account_holder = patch.accountHolder;
  if (patch.bankName !== undefined) payload.bank_name = patch.bankName;
  if (patch.bankAddress !== undefined) payload.bank_address = patch.bankAddress;
  if (patch.accountNumber !== undefined) payload.account_number = patch.accountNumber;
  if (patch.sortCode !== undefined) payload.sort_code = patch.sortCode;
  if (patch.swift !== undefined) payload.swift = patch.swift;
  if (patch.iban !== undefined) payload.iban = patch.iban;
  if (patch.bic !== undefined) payload.bic = patch.bic;
  if (patch.routing !== undefined) payload.routing = patch.routing;
  if (patch.intakeStep !== undefined) payload.intake_step = patch.intakeStep;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  const { data, error } = await supabase
    .from("partners")
    .update(payload)
    .eq("id", partnerId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPartner(data as DbPartner);
}

export async function getPartnerByPortalToken(token: string): Promise<PartnerRecord | null> {
  const supabase = requirePartnersSupabase();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("portal_token", token.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPartner(data as DbPartner) : null;
}

export async function getPartnerById(id: string): Promise<PartnerRecord | null> {
  const supabase = requirePartnersSupabase();
  const { data, error } = await supabase.from("partners").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPartner(data as DbPartner) : null;
}

export async function listPartners(workspaceId?: string | null): Promise<PartnerRecord[]> {
  const supabase = requirePartnersSupabase();
  let query = supabase.from("partners").select("*").order("created_at", { ascending: false });
  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapPartner(row as DbPartner));
}

export async function sendPartnerPortalLinkEmail(partner: PartnerRecord) {
  if (!partner.portalUrl) return false;
  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    const email = buildSupportEmail({
      title: "Your Unit311 Central Partners portal",
      intro: `Hi ${partner.firstName},\n\nThank you for completing your partner registration for ${partner.companyName}.`,
      body: "Use your unique portal link to update details and submit invoices.",
      ctaLabel: "Open Partners portal",
      ctaUrl: partner.portalUrl,
      footer: "— Unit311 Central Partners",
    });
    await sendMailboxEmail({
      account: "info",
      to: partner.email,
      subject: "Your Unit311 Central Partners portal link",
      text: email.text,
      html: email.html,
    });
    return true;
  } catch (error) {
    console.warn("[partners] portal email failed", error);
    return false;
  }
}

function mapInvoice(row: {
  id: string;
  partner_id: string;
  job_reference: string;
  description: string | null;
  amount: number | string | null;
  currency: string;
  status: string;
  file_name: string | null;
  file_url: string | null;
  mime_type: string | null;
  submitted_at: string;
  updated_at: string;
}): PartnerInvoice {
  return {
    id: row.id,
    partnerId: row.partner_id,
    jobReference: row.job_reference,
    description: row.description,
    amount: row.amount == null ? null : Number(row.amount),
    currency: row.currency,
    status: row.status as PartnerInvoiceStatus,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

export async function listPartnerInvoices(partnerId: string): Promise<PartnerInvoice[]> {
  const supabase = requirePartnersSupabase();
  const { data, error } = await supabase
    .from("partner_invoices")
    .select("*")
    .eq("partner_id", partnerId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapInvoice(row as Parameters<typeof mapInvoice>[0]));
}

export async function createPartnerInvoice(input: {
  partnerId: string;
  jobReference: string;
  description?: string | null;
  amount?: number | null;
  file?: File | null;
}): Promise<PartnerInvoice> {
  const supabase = requirePartnersSupabase();
  let fileName: string | null = null;
  let fileUrl: string | null = null;
  let mimeType: string | null = null;

  if (input.file && input.file.size > 0) {
    const { INTERNAL_FILES_BUCKET } = await import("@/lib/internal-files-data");
    const safe = input.file.name.replace(/[^\w.\-() ]+/g, "_");
    const path = `partners/${input.partnerId}/${Date.now()}-${safe}`;
    const buffer = Buffer.from(await input.file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(INTERNAL_FILES_BUCKET)
      .upload(path, buffer, {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) throw new Error(uploadError.message);
    const { data: signed } = await supabase.storage
      .from(INTERNAL_FILES_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    fileName = input.file.name;
    fileUrl = signed?.signedUrl || path;
    mimeType = input.file.type || "application/octet-stream";
  }

  const { data, error } = await supabase
    .from("partner_invoices")
    .insert({
      partner_id: input.partnerId,
      job_reference: input.jobReference.trim(),
      description: input.description?.trim() || null,
      amount: input.amount ?? null,
      status: "pending",
      file_name: fileName,
      file_url: fileUrl,
      mime_type: mimeType,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapInvoice(data as Parameters<typeof mapInvoice>[0]);
}
