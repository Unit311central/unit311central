import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requireInternalWiseWorkspace } from "@/lib/treasury/treasury-api-auth";
import {
  shouldUseDemoWiseSimulator,
  shouldUseOnwardAirBankSimulator,
} from "@/lib/treasury/bank-provider-server";
import { getWiseConnectionStatus, getWiseScaKeyDiagnostics } from "@/lib/wise-service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    try {
      const status = await getWiseConnectionStatus();
      return NextResponse.json({
        ...status,
        demoMode: true,
        scaPrivateKeyConfigured: false,
        scaKey: getWiseScaKeyDiagnostics(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to check Wise connection.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const gate = await requireInternalWiseWorkspace();
  if ("error" in gate) return gate.error;

  try {
    const status = await getWiseConnectionStatus();
    const sca = getWiseScaKeyDiagnostics();
    const demoMode =
      (await shouldUseDemoWiseSimulator()) || (await shouldUseOnwardAirBankSimulator());
    return NextResponse.json({
      ...status,
      demoMode,
      scaPrivateKeyConfigured: sca.parseable,
      scaKey: sca,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check Wise connection.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
