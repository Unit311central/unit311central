import type { CreateWorkspaceInput } from "@/lib/platform-workspaces/types";

export function workspaceCreateFixture(
  overrides: Partial<CreateWorkspaceInput> = {},
): CreateWorkspaceInput {
  return {
    type: "Customer",
    name: "Acme Manufacturing Ltd",
    slug: "acme-manufacturing-ltd",
    companyName: "Acme Manufacturing Ltd",
    contactName: "Primary Owner",
    contactEmail: "owner@acme.example.com",
    country: "United Kingdom",
    timezone: "Europe/London",
    currency: "USD",
    description: "Test workspace",
    enabledModules: ["home", "settings"],
    enabledSubModules: [],
    branding: {
      displayName: "Acme Manufacturing Ltd",
      logoUrl: null,
      primaryColour: "#0b2d63",
      secondaryColour: "#2563eb",
    },
    employees: [],
    clients: [],
    loginPage: {
      title: "Acme Manufacturing Ltd",
      logoDataUrl: null,
      backgroundDataUrl: null,
    },
    initialAdministrator: {
      firstName: "Alex",
      lastName: "Admin",
      email: "admin@acme.example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
    },
    ...overrides,
  };
}
