import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getWhatsAppNotifyPhone } from "@/lib/whatsapp/client";

export type WhatsAppSupportSessionStep =
  | "awaiting_name"
  | "awaiting_organisation"
  | "awaiting_priority"
  | "awaiting_description"
  | "awaiting_assignment";

export type WhatsAppSupportSession = {
  phone: string;
  ticketId: string;
  step: WhatsAppSupportSessionStep;
  updatedAt: string;
};

type DbSession = {
  phone: string;
  ticket_id: string;
  step: WhatsAppSupportSessionStep;
  updated_at: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

function mapSession(row: DbSession): WhatsAppSupportSession {
  return {
    phone: row.phone,
    ticketId: row.ticket_id,
    step: row.step,
    updatedAt: row.updated_at,
  };
}

export function resolveWhatsAppSessionPhone(phone?: string | null) {
  return (phone ?? getWhatsAppNotifyPhone()).replace(/\D/g, "") || getWhatsAppNotifyPhone();
}

export async function getWhatsAppSupportSession(
  phone?: string | null,
): Promise<WhatsAppSupportSession | null> {
  const supabase = requireSupabase();
  const normalizedPhone = resolveWhatsAppSessionPhone(phone);

  const { data, error } = await supabase
    .from("whatsapp_support_sessions")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data as DbSession) : null;
}

export async function upsertWhatsAppSupportSession(input: {
  phone?: string | null;
  ticketId: string;
  step: WhatsAppSupportSessionStep;
}) {
  const supabase = requireSupabase();
  const normalizedPhone = resolveWhatsAppSessionPhone(input.phone);

  const { data, error } = await supabase
    .from("whatsapp_support_sessions")
    .upsert(
      {
        phone: normalizedPhone,
        ticket_id: input.ticketId,
        step: input.step,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data as DbSession);
}

export async function clearWhatsAppSupportSession(phone?: string | null) {
  const supabase = requireSupabase();
  const normalizedPhone = resolveWhatsAppSessionPhone(phone);

  const { error } = await supabase
    .from("whatsapp_support_sessions")
    .delete()
    .eq("phone", normalizedPhone);

  if (error) throw new Error(error.message);
}
