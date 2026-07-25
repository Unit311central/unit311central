import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { isInternalDomainHost } from "@/lib/app-domains";
import {
  PLATFORM_BILLING_SEED_FALLBACK,
  summarizePlatformBilling,
  type PlatformBillingFrequency,
  type PlatformSubscriptionStatus,
} from "@/lib/platform-billing-data";
import {
  ensurePlatformCustomerSubscriptionsTable,
} from "@/lib/internal-db-migrations";
import {
  getPlatformCustomerSubscription,
  healProfessionalSubscriptionPricing,
  listPlatformCustomerSubscriptions,
  updatePlatformCustomerSubscription,
} from "@/lib/platform-billing-service";
import { requirePlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";

async function assertInternalPlatformBillingAccess() {
  await requirePlatformSession();
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "";
  const internalHeader = headerStore.get("x-unit311-internal");
  if (!isInternalDomainHost(host) && internalHeader !== "1") {
    return NextResponse.json(
      { error: "Platform Billing is only available on the Internal Unit311 host." },
      { status: 403 },
    );
  }
  return null;
}

function isMissingPlatformBillingTable(message: string) {
  return (
    message.includes("platform_customer_subscriptions") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

export async function GET(request: Request) {
  try {
    const denied = await assertInternalPlatformBillingAccess();
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    await ensurePlatformCustomerSubscriptionsTable();

    if (id) {
      try {
        const record = await getPlatformCustomerSubscription(id);
        if (!record) {
          const seed = PLATFORM_BILLING_SEED_FALLBACK.find((row) => row.id === id);
          if (seed) return NextResponse.json({ subscription: seed, source: "seed-fallback" });
          return NextResponse.json({ error: "Billing record not found." }, { status: 404 });
        }
        return NextResponse.json({ subscription: record, source: "database" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isMissingPlatformBillingTable(message)) {
          const seed = PLATFORM_BILLING_SEED_FALLBACK.find((row) => row.id === id);
          if (seed) return NextResponse.json({ subscription: seed, source: "seed-fallback" });
        }
        throw error;
      }
    }

    try {
      await healProfessionalSubscriptionPricing();
      const subscriptions = await listPlatformCustomerSubscriptions();
      const totals = summarizePlatformBilling(subscriptions);
      return NextResponse.json({
        subscriptions,
        totals,
        source: "database",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isMissingPlatformBillingTable(message)) throw error;

      // Table still missing after ensure — serve seed so Internal Billing is usable.
      const subscriptions = PLATFORM_BILLING_SEED_FALLBACK;
      return NextResponse.json({
        subscriptions,
        totals: summarizePlatformBilling(subscriptions),
        source: "seed-fallback",
        warning:
          "platform_customer_subscriptions is not in Supabase yet. Showing seed data. Apply migration 084 when SUPABASE_ACCESS_TOKEN can run DDL.",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load platform billing.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await assertInternalPlatformBillingAccess();
    if (denied) return denied;

    const body = (await request.json()) as {
      id?: string;
      mrrUsd?: number;
      arrUsd?: number;
      planName?: string;
      billingFrequency?: PlatformBillingFrequency;
      subscriptionStatus?: PlatformSubscriptionStatus;
      outstandingBalanceUsd?: number;
      nextInvoiceDate?: string | null;
      notes?: string | null;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    await ensurePlatformCustomerSubscriptionsTable();
    const subscription = await updatePlatformCustomerSubscription(id, {
      mrrUsd: body.mrrUsd,
      arrUsd: body.arrUsd,
      planName: body.planName,
      billingFrequency: body.billingFrequency,
      subscriptionStatus: body.subscriptionStatus,
      outstandingBalanceUsd: body.outstandingBalanceUsd,
      nextInvoiceDate: body.nextInvoiceDate,
      notes: body.notes,
    });

    if (!subscription) {
      return NextResponse.json({ error: "Billing record not found." }, { status: 404 });
    }

    return NextResponse.json({ subscription, source: "database" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update platform billing.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
