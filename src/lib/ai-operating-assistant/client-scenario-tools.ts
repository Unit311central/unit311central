/**
 * Client shock scenarios — exposure from live clients, AR, and projects (never invented).
 */
import { listInvoices } from "@/lib/accounting/invoices-service";
import { isLiveInvoiceOverdue } from "@/lib/ai-operating-assistant/live-finance";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listProjects } from "@/lib/internal-projects-service";
import {
  asString,
  matchesQuery,
  toolError,
  toolOk,
  type AssistantToolExecutionContext,
} from "@/lib/ai-operating-assistant/tool-result";

export function extractClientNameFromScenario(question: string): string | null {
  const text = question.trim();
  const quoted = text.match(/client\s+["']([^"']+)["']/i) ?? text.match(/["']([^"']+)["']\s+(?:has|just)/i);
  if (quoted?.[1]) return quoted[1].trim();

  const named = text.match(
    /\bclient\s+([A-Z][A-Za-z0-9&.'\-\s]{1,60}?)(?:\s+has|\s+just|\s+went|\s+is|\s+filed|,|\.|$)/i,
  );
  if (named?.[1]) return named[1].trim();

  const customer = text.match(
    /\bcustomer\s+([A-Z][A-Za-z0-9&.'\-\s]{1,60}?)(?:\s+has|\s+just|\s+went|,|\.|$)/i,
  );
  if (customer?.[1]) return customer[1].trim();

  return null;
}

export async function analyzeClientScenarioTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const question = asString(args.question) || "";
  const clientQuery = asString(args.clientName) || extractClientNameFromScenario(question) || "";

  if (!clientQuery) {
    return toolError(
      "analyzeClientScenario",
      "Name the client or customer (e.g. “Client Acme Ltd has gone bankrupt”).",
    );
  }

  try {
    const [clients, invoices, projects] = await Promise.all([
      listInternalClients().catch(() => []),
      listInvoices().catch(() => []),
      listProjects().catch(() => []),
    ]);

    const matchedClients = clients.filter((client) =>
      matchesQuery(
        [client.companyName, client.primaryContact, client.email, client.industry].join(" "),
        clientQuery,
      ),
    );

    if (matchedClients.length === 0) {
      return toolOk("analyzeClientScenario", [], {
        source: ["supabase:internal_clients", "supabase:invoices", "supabase:projects"],
        summary: {
          clientQuery,
          matchedClients: 0,
          message: `No client directory match for “${clientQuery}”. Check spelling or search Clients.`,
        },
      });
    }

    const exposures = matchedClients.map((client) => {
      const clientInvoices = invoices.filter(
        (invoice) =>
          invoice.clientId === client.id ||
          (invoice.clientName &&
            matchesQuery(invoice.clientName, client.companyName)),
      );
      const openInvoices = clientInvoices.filter(
        (invoice) => invoice.status !== "paid" && invoice.status !== "cancelled",
      );
      const overdueInvoices = openInvoices.filter((invoice) => isLiveInvoiceOverdue(invoice));
      const arOutstanding = openInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
      const arOverdue = overdueInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

      const linkedProjects = projects.filter(
        (project) =>
          project.clientId === client.id ||
          matchesQuery(project.clientName ?? "", client.companyName),
      );
      const liveProjects = linkedProjects.filter((project) => project.phase === "live");

      return {
        clientId: client.id,
        companyName: client.companyName,
        accountStatus: client.accountStatus,
        industry: client.industry,
        region: client.region,
        activeProjects: client.activeProjects,
        arOutstanding,
        arOverdue,
        openInvoiceCount: openInvoices.length,
        overdueInvoiceCount: overdueInvoices.length,
        liveProjectCount: liveProjects.length,
        projectNames: linkedProjects.slice(0, 8).map((project) => project.name),
        scenario: question || `Client shock: ${client.companyName}`,
        recommendedActions: [
          arOverdue > 0 ? "Chase or provision overdue AR; consider write-off workflow." : null,
          liveProjects.length > 0 ? "Review live project delivery and contract termination clauses." : null,
          "Notify account owner and Finance; update CRM risk status.",
        ].filter(Boolean),
      };
    });

    return toolOk("analyzeClientScenario", exposures, {
      source: ["supabase:internal_clients", "supabase:invoices", "supabase:projects"],
      summary: {
        clientQuery,
        matchedClients: exposures.length,
        totalArOutstanding: exposures.reduce((sum, row) => sum + row.arOutstanding, 0),
        totalArOverdue: exposures.reduce((sum, row) => sum + row.arOverdue, 0),
        message: `Live exposure snapshot for ${exposures.length} matched client(s).`,
      },
    });
  } catch (error) {
    return toolError(
      "analyzeClientScenario",
      error instanceof Error ? error.message : "Client scenario analysis failed.",
    );
  }
}
