import { INTERNAL_SITE_HOST } from "@/lib/app-domains";
import type { InternalNavChildItem, InternalNavSection } from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";

/** Preview-only Sales Management tab — not part of production SALES_MANAGEMENT_TABS registry. */
export const TARGET_CLIENTS_PREVIEW_TAB = "target-clients-preview" as const;

export function isInternalUnit311CentralHost(hostname: string | null | undefined): boolean {
  const normalized = String(hostname ?? "")
    .trim()
    .toLowerCase();
  return normalized === INTERNAL_SITE_HOST || normalized === "internal.localhost";
}

export function isTargetClientsPreviewTab(value: string | null | undefined): boolean {
  return value === TARGET_CLIENTS_PREVIEW_TAB;
}

const TARGET_CLIENTS_NAV_ITEM: InternalNavChildItem = {
  label: "Target Clients",
  view: "sales-management",
  query: { tab: TARGET_CLIENTS_PREVIEW_TAB },
};

/** Inserts Target Clients before Opportunities in the Sales Management → Sales group (internal preview only). */
export function withTargetClientsPreviewNav(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections.map((section) => {
    if (section.label !== SALES_MANAGEMENT_MODULE_LABEL) {
      return section as InternalNavSection;
    }

    const items = section.items.map((item) => {
      if (item.label !== "Sales" || !item.children?.length) {
        return item;
      }

      const alreadyPresent = item.children.some(
        (child) => child.query?.tab === TARGET_CLIENTS_PREVIEW_TAB,
      );
      if (alreadyPresent) return item;

      const nextChildren: InternalNavChildItem[] = [];
      for (const child of item.children) {
        if (child.label === "Opportunities") {
          nextChildren.push(TARGET_CLIENTS_NAV_ITEM);
        }
        nextChildren.push(child);
      }

      return { ...item, children: nextChildren };
    });

    return { ...section, items };
  });
}

export type TargetClientPreviewRow = {
  id: string;
  companyName: string;
  website: string;
  sector: string;
  contactName: string;
  contactPosition: string;
  email: string;
  contacted: boolean;
};

/** Fictional sample rows for layout review only. */
export const TARGET_CLIENTS_PREVIEW_ROWS: readonly TargetClientPreviewRow[] = [
  {
    id: "tc-mock-1",
    companyName: "Northwind Fixtures Ltd",
    website: "northwind-fixtures.example",
    sector: "Manufacturing",
    contactName: "Alex Mercer",
    contactPosition: "Head of Procurement",
    email: "alex.m@northwind-fixtures.example",
    contacted: true,
  },
  {
    id: "tc-mock-2",
    companyName: "Harborline Analytics",
    website: "harborline-analytics.example",
    sector: "Technology",
    contactName: "Priya Nair",
    contactPosition: "VP Commercial",
    email: "priya.nair@harborline-analytics.example",
    contacted: false,
  },
  {
    id: "tc-mock-3",
    companyName: "Summit Civic Partners",
    website: "summit-civic.example",
    sector: "Public sector",
    contactName: "Jordan Ellis",
    contactPosition: "Programme Director",
    email: "j.ellis@summit-civic.example",
    contacted: true,
  },
  {
    id: "tc-mock-4",
    companyName: "Bluecrest Logistics",
    website: "bluecrest-logistics.example",
    sector: "Transport",
    contactName: "Morgan Lee",
    contactPosition: "Operations Lead",
    email: "morgan.lee@bluecrest-logistics.example",
    contacted: false,
  },
  {
    id: "tc-mock-5",
    companyName: "Greenfield Bio Labs",
    website: "greenfield-bio.example",
    sector: "Life sciences",
    contactName: "Samira Okonkwo",
    contactPosition: "Chief of Staff",
    email: "samira.o@greenfield-bio.example",
    contacted: false,
  },
  {
    id: "tc-mock-6",
    companyName: "Atlas Retail Collective",
    website: "atlas-retail.example",
    sector: "Retail",
    contactName: "Chris Dalton",
    contactPosition: "Commercial Manager",
    email: "chris.dalton@atlas-retail.example",
    contacted: true,
  },
] as const;
