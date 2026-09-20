import {
  composeLegacyRegion,
  resolveClientLocation,
  type ManagedClient,
} from "@/lib/client-management-data";

export function buildCreateClientRequestBody(draft: ManagedClient) {
  const location = resolveClientLocation(draft);
  return {
    companyName: draft.companyName.trim(),
    industry: draft.industry,
    primaryContact: draft.primaryContact,
    email: draft.email,
    phone: draft.phone,
    region: composeLegacyRegion(location.country, location.city),
    companyCountry: location.country,
    companyCity: location.city,
    companyPostcode: draft.companyPostcode,
    companyAddress: draft.companyAddress,
    contractType: draft.contractType,
    taxId: draft.taxId,
    billingAddress: draft.billingAddress,
    notes: draft.notes,
    platformUrl: draft.platformUrl,
    jobTitle: draft.jobTitle,
    accountsPayableEmail: draft.accountsPayableEmail ?? draft.invoiceEmail,
    billingSameAsCompany: draft.billingSameAsCompany,
    primaryContactFirstName: draft.primaryContactFirstName,
    primaryContactSurname: draft.primaryContactSurname,
  };
}

export async function createClientFromDraftRequest(
  draft: ManagedClient,
): Promise<ManagedClient> {
  const companyName = draft.companyName.trim();
  if (!companyName) {
    throw new Error("Company name is required.");
  }

  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildCreateClientRequestBody({ ...draft, companyName })),
  });

  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  const data = JSON.parse(text) as { client?: ManagedClient; error?: string };
  if (!response.ok || !data.client) {
    throw new Error(data.error ?? "Failed to create client");
  }
  return data.client;
}
