import { NextResponse } from "next/server";

import { getPublicEmailAccounts, isAccountConfigured } from "@/lib/email/accounts";
import { ensureEmailInfrastructureTables } from "@/lib/internal-db-migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureEmailInfrastructureTables();
  const accounts = await Promise.all(
    getPublicEmailAccounts().map(async (account) => ({
      ...account,
      configured: await isAccountConfigured(account.id),
    })),
  );

  return NextResponse.json(accounts);
}
