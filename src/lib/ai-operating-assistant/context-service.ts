import { resolveExecutiveAssistantContext } from "@/lib/executive-assistant-ui";
import { getOrganisationForUser } from "@/lib/organisation-service";
import type { PlatformSession } from "@/lib/platform-auth";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { InternalRoleView } from "@/lib/internal-role-views";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isInternalOperationsView } from "@/lib/internal-operations-data";

import {
  clampActiveViewToGrants,
  entitlementsFromOperator,
} from "./operator-entitlements";
import type { AssistantBusinessContext, AssistantPageSelection } from "./types";

function asRoleView(value: string | null | undefined): InternalRoleView {
  if (value === "admin" || value === "c-suite" || value === "manager" || value === "staff") {
    return value;
  }
  return "c-suite";
}

export type BuildBusinessContextInput = {
  session: PlatformSession;
  activeView?: string | null;
  pathname?: string | null;
  selection?: AssistantPageSelection;
  roleView?: string | null;
  workspaceId?: string | null;
  workspaceName?: string | null;
  workspaceSlug?: string | null;
};

/**
 * Assembles authoritative runtime context for every assistant turn.
 * Operator entitlements (roles / departments / allowedViews) are resolved server-side.
 */
export async function buildBusinessContext(
  input: BuildBusinessContextInput,
): Promise<AssistantBusinessContext> {
  const requestedView = input.activeView?.trim() || "home";
  const clientRoleView = asRoleView(input.roleView);

  let entitlements = entitlementsFromOperator(null, clientRoleView);

  if (input.session.userType === "internal" && isSupabaseConfigured()) {
    try {
      const operator = await getInternalOperatorByUsername(input.session.username);
      entitlements = entitlementsFromOperator(operator, clientRoleView);
    } catch {
      // Fall back to client roleView / unrestricted when operator lookup fails.
    }
  }

  const activeView = clampActiveViewToGrants(requestedView, entitlements.allowedViews);
  const pageMeta = resolveExecutiveAssistantContext(activeView, "internal");

  let organisationId: string | null = null;
  let organisationName: string | null = null;

  try {
    const org = await getOrganisationForUser(input.session.sub);
    if (org) {
      organisationId = org.id;
      organisationName = org.name;
    }
  } catch {
    // Organisation lookup is optional until onboarding tables are live.
  }

  const context: AssistantBusinessContext = {
    user: {
      id: input.session.sub,
      username: input.session.username,
      displayName: input.session.displayName,
      userType: input.session.userType,
    },
    organisation: {
      id: organisationId,
      name: organisationName,
    },
    workspace: {
      // Never use organisationId as workspace id — platform_organisations ≠ workspaces.
      id: input.workspaceId ?? input.session.workspaceId ?? null,
      name:
        input.workspaceName ??
        input.session.workspaceName ??
        organisationName ??
        "Workspace",
      slug: input.workspaceSlug ?? input.session.workspaceSlug ?? null,
    },
    page: {
      activeView,
      label: pageMeta.label,
      pathname: input.pathname ?? null,
    },
    selection: {
      clientId: input.selection?.clientId ?? null,
      clientName: input.selection?.clientName ?? null,
      projectId: input.selection?.projectId ?? null,
      projectName: input.selection?.projectName ?? null,
      employeeId: input.selection?.employeeId ?? null,
      employeeName: input.selection?.employeeName ?? null,
      contractId: input.selection?.contractId ?? null,
      contractName: input.selection?.contractName ?? null,
      fileId: input.selection?.fileId ?? null,
      fileName: input.selection?.fileName ?? null,
    },
    permissions: {
      roleView: entitlements.roleView,
      canAccessFinancials: entitlements.canAccessFinancials,
      canAccessUsers: entitlements.canAccessUsers,
      canAccessStrategy: entitlements.canAccessStrategy,
      canAccessHr: entitlements.canAccessHr,
      roles: entitlements.roles,
      departments: entitlements.departments,
      allowedViews: entitlements.allowedViews,
      readOnlyMode: input.session.userType === "external",
    },
    generatedAt: new Date().toISOString(),
  };

  // Overlay host-resolved workspace when available (authoritative tenancy).
  if (!input.workspaceId) {
    try {
      const { requireCurrentWorkspace } = await import("@/lib/workspace-context");
      const workspace = await requireCurrentWorkspace();
      context.workspace.id = workspace.id;
      context.workspace.name = workspace.name;
      context.workspace.slug = workspace.slug;
    } catch {
      // Keep session claim when host resolution is unavailable.
    }
  }

  return context;
}

export function describeSelection(selection: AssistantPageSelection) {
  const parts: string[] = [];
  if (selection.clientName) parts.push(`Client: ${selection.clientName}`);
  if (selection.projectName) parts.push(`Project: ${selection.projectName}`);
  if (selection.employeeName) parts.push(`Employee: ${selection.employeeName}`);
  if (selection.contractName) parts.push(`Contract: ${selection.contractName}`);
  if (selection.fileName) parts.push(`File: ${selection.fileName}`);
  return parts.join(" · ");
}

export function isKnownInternalView(view: string): view is InternalOperationsView {
  return isInternalOperationsView(view);
}
