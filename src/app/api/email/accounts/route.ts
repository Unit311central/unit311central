import { NextResponse } from "next/server";

import { getPublicEmailAccounts, isAccountConfigured } from "@/lib/email/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await Promise.all(
    getPublicEmailAccounts().map(async (account) => ({
      ...account,
      configured: await isAccountConfigured(account.id),
    })),
  );

  return NextResponse.json(accounts);
}
