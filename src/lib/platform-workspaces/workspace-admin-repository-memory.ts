import { randomUUID } from "node:crypto";

import {
  countEnabledModules,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  normalizeSlug,
  nowIso,
  workspacePrimaryUrl,
} from "@/lib/platform-workspaces/workspace-admin-mappers";
import type { WorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository";
import { resolveCustomerHostname } from "@/lib/platform-workspaces/workspace-hostname";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceAdminStatus,
  WorkspaceListFilters,
  WorkspaceProvisioningState,
} from "@/lib/platform-workspaces/types";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

function seedRecords(): WorkspaceAdminRecord[] {
  const createdAt = "2026-01-15T10:00:00.000Z";
  return [
    {
      workspaceId: "seed-unit311-internal",
      name: "Unit311 Central",
      slug: INTERNAL_WORKSPACE_SLUG,
      type: "Internal",
      status: "Active",
      companyName: "Unit311 Central Ltd",
      contact: { name: "Platform Operations", email: "ops@unit311central.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "GBP",
      description: "Internal Central operations workspace.",
      enabledModules: ["home", "executive-assistant", "business-central", "financials", "settings"],
      enabledSubModules: [],
      branding: {
        displayName: "Unit311 Central",
        logoUrl: null,
        primaryColour: "#0b2d63",
        secondaryColour: "#2563eb",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 24,
      enabledModuleCount: 5,
      primaryUrl: workspacePrimaryUrl(INTERNAL_WORKSPACE_SLUG, INTERNAL_WORKSPACE_SLUG),
      customerHostname: INTERNAL_WORKSPACE_SLUG,
      createdAt,
      createdBy: "system",
      updatedAt: createdAt,
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        overallStatus: "complete",
        lastMessage: "Live internal workspace.",
      },
    },
    {
      workspaceId: "seed-demo-workspace",
      name: "Unit311 Central Demo",
      slug: "demo",
      type: "Demo",
      status: "Active",
      companyName: "Northstar Demo Corp",
      contact: { name: "Demo Owner", email: "demo@unit311central.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "USD",
      description: "Permanent demo workspace for sales and training.",
      enabledModules: ["home", "executive-assistant", "business-central", "financials", "board"],
      enabledSubModules: [],
      branding: {
        displayName: "Northstar Demo",
        logoUrl: null,
        primaryColour: "#0F766E",
        secondaryColour: "#14B8A6",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 12,
      enabledModuleCount: 5,
      primaryUrl: workspacePrimaryUrl("demo", "demo"),
      customerHostname: "demo",
      createdAt: "2026-02-01T09:30:00.000Z",
      createdBy: "system",
      updatedAt: "2026-02-01T09:30:00.000Z",
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        overallStatus: "complete",
        lastMessage: "Demo workspace is live.",
      },
    },
    {
      workspaceId: "seed-onwardair-customer",
      name: "OnwardAir",
      slug: "onwardair",
      type: "Customer",
      status: "Active",
      companyName: "OnwardAir Ltd",
      contact: { name: "Operations Lead", email: "ops@onwardair.example.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "GBP",
      description: "Customer workspace for OnwardAir programme delivery.",
      enabledModules: [
        "home",
        "executive-assistant",
        "business-central",
        "engineering",
        "fundraising",
        "board",
      ],
      enabledSubModules: [],
      branding: {
        displayName: "OnwardAir",
        logoUrl: null,
        primaryColour: "#0369A1",
        secondaryColour: "#38BDF8",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 18,
      enabledModuleCount: 6,
      primaryUrl: workspacePrimaryUrl("onwardair", "onwardair"),
      customerHostname: "onwardair",
      createdAt: "2026-03-10T14:20:00.000Z",
      createdBy: "admin",
      updatedAt: "2026-03-10T14:20:00.000Z",
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        overallStatus: "complete",
        lastMessage: "Customer workspace provisioned and live.",
      },
    },
  ];
}

function applyListFilters(
  records: WorkspaceAdminRecord[],
  filters: WorkspaceListFilters = {},
): WorkspaceAdminRecord[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  return records.filter((record) => {
    if (filters.type && filters.type !== "all" && record.type !== filters.type) return false;
    if (filters.status && filters.status !== "all" && record.status !== filters.status) return false;
    if (!query) return true;
    return (
      record.name.toLowerCase().includes(query) ||
      record.slug.toLowerCase().includes(query) ||
      record.companyName.toLowerCase().includes(query) ||
      record.contact.email.toLowerCase().includes(query)
    );
  });
}

export function createMemoryWorkspaceAdminRepository(
  initial: WorkspaceAdminRecord[] = seedRecords(),
): WorkspaceAdminRepository {
  let records = initial.map((record) => ({ ...record }));

  return {
    kind: "memory",

    async list(filters = {}) {
      return applyListFilters(
        [...records].sort((a, b) => a.name.localeCompare(b.name)),
        filters,
      );
    },

    async getById(workspaceId) {
      return records.find((record) => record.workspaceId === workspaceId) ?? null;
    },

    async isSlugAvailable(slug) {
      const normalized = normalizeSlug(slug);
      if (!normalized) return false;
      return !records.some((record) => record.slug === normalized);
    },

    async create(input, createdBy) {
      const slug = normalizeSlug(input.slug);
      if (!slug) throw new Error("Workspace slug is required.");
      if (!(await this.isSlugAvailable(slug))) {
        throw new Error(`Workspace slug "${slug}" is already in use.`);
      }
      if (!input.name.trim()) throw new Error("Workspace name is required.");
      if (!input.companyName.trim()) throw new Error("Company name is required.");
      if (!input.contactEmail.trim()) throw new Error("Primary contact email is required.");

      const customerHostname = resolveCustomerHostname(slug, input.customerHostname);
      const provisioning: WorkspaceProvisioningState = {
        databaseStatus: "complete",
        authenticationStatus:
          input.employees.length > 0 || input.contactEmail.trim() ? "complete" : "skipped",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        overallStatus: "complete",
        lastMessage: "In-memory test repository — Phase 3 provisioning simulated.",
      };

      const timestamp = nowIso();
      const status: WorkspaceAdminStatus = input.type === "Demo" ? "Active" : "Active";
      const record: WorkspaceAdminRecord = {
        workspaceId: randomUUID(),
        name: input.name.trim(),
        slug,
        type: input.type,
        status,
        companyName: input.companyName.trim(),
        contact: {
          name: input.contactName.trim(),
          email: input.contactEmail.trim().toLowerCase(),
        },
        country: input.country.trim(),
        timezone: input.timezone,
        currency: input.currency,
        description: input.description.trim(),
        enabledModules: [...input.enabledModules],
        enabledSubModules: [...input.enabledSubModules],
        branding: { ...input.branding },
        pendingEmployees: [...input.employees],
        pendingClients: [...input.clients],
        userCount: input.employees.length > 0 ? input.employees.length : 1,
        enabledModuleCount: countEnabledModules(input.enabledModules, input.enabledSubModules),
        primaryUrl: workspacePrimaryUrl(slug, customerHostname),
        customerHostname,
        createdAt: timestamp,
        createdBy,
        updatedAt: timestamp,
        provisioning,
      };

      records.push(record);
      return record;
    },

    async provision(workspaceId) {
      const existing = await this.getById(workspaceId);
      if (!existing) throw new Error("Workspace not found.");
      if (existing.provisioning.overallStatus === "complete") {
        return existing;
      }
      const next: WorkspaceAdminRecord = {
        ...existing,
        status: "Active",
        provisioning: {
          ...existing.provisioning,
          databaseStatus: "complete",
          authenticationStatus: existing.pendingEmployees.length > 0 ? "complete" : "skipped",
          infrastructureStatus: "complete",
          deploymentStatus: "complete",
          workspaceRecordStatus: "complete",
          overallStatus: "complete",
          lastMessage: "In-memory test repository — Phase 3 provisioning simulated.",
        },
        updatedAt: nowIso(),
      };
      records = records.map((record) => (record.workspaceId === workspaceId ? next : record));
      return next;
    },

    async update(workspaceId, patch) {
      const existing = await this.getById(workspaceId);
      if (!existing) throw new Error("Workspace not found.");

      const next: WorkspaceAdminRecord = {
        ...existing,
        ...patch,
        contact: patch.contact ? { ...existing.contact, ...patch.contact } : existing.contact,
        branding: patch.branding ? { ...existing.branding, ...patch.branding } : existing.branding,
        enabledModules: patch.enabledModules ? [...patch.enabledModules] : existing.enabledModules,
        enabledSubModules: patch.enabledSubModules
          ? [...patch.enabledSubModules]
          : existing.enabledSubModules,
        pendingEmployees: patch.pendingEmployees
          ? [...patch.pendingEmployees]
          : existing.pendingEmployees,
        pendingClients: patch.pendingClients ? [...patch.pendingClients] : existing.pendingClients,
        updatedAt: nowIso(),
        enabledModuleCount: countEnabledModules(
          patch.enabledModules ?? existing.enabledModules,
          patch.enabledSubModules ?? existing.enabledSubModules,
        ),
      };

      records = records.map((record) => (record.workspaceId === workspaceId ? next : record));
      return next;
    },

    async archive(workspaceId) {
      return this.update(workspaceId, { status: "Archived" });
    },
  };
}

/** @internal Test-only helper to inspect the in-memory repository state. */
export function resetMemoryWorkspaceAdminRepository(
  initial: WorkspaceAdminRecord[] = seedRecords(),
): WorkspaceAdminRepository {
  return createMemoryWorkspaceAdminRepository(initial);
}
