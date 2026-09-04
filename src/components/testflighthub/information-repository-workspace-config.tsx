"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
  UNIT311_DETAILS_REPOSITORY_PROFILE,
  type InformationRepositoryProfile,
} from "@/lib/information-repository-profile";

export type InformationRepositoryWorkspaceConfig = {
  profile: InformationRepositoryProfile;
  apiBasePath: string;
  loadErrorLabel: string;
  selectPrompt: string;
  emptyStateTitle: string;
  emptyStateBody: string;
  addSectionPlaceholder: string;
  features: {
    docPacks: boolean;
    architectureHub: boolean;
    architectureDiagrams: boolean;
    builtinIntegrations: boolean;
    recordAttachments: boolean;
  };
};

export const UNIT311_DETAILS_WORKSPACE_CONFIG: InformationRepositoryWorkspaceConfig = {
  profile: UNIT311_DETAILS_REPOSITORY_PROFILE,
  apiBasePath: "/api/unit311-details",
  loadErrorLabel: "Unit311 details",
  selectPrompt: "Select a category above to view documentation and architecture.",
  emptyStateTitle: "",
  emptyStateBody: "",
  addSectionPlaceholder: "Section name, e.g. AWS, Stripe, Domain registrar…",
  features: {
    docPacks: true,
    architectureHub: true,
    architectureDiagrams: false,
    builtinIntegrations: true,
    recordAttachments: false,
  },
};

export const INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG: InformationRepositoryWorkspaceConfig =
  {
    profile: INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
    apiBasePath: "/api/information-repository",
    loadErrorLabel: "Information Repository",
    selectPrompt: "Select a section above to view and edit its information.",
    emptyStateTitle: "No information has been added yet.",
    emptyStateBody:
      "Create sections and tiles to build the Interface Worx information repository.",
    addSectionPlaceholder: "Section name, e.g. Company Structure, Technology Stack…",
    features: {
      docPacks: false,
      architectureHub: false,
      architectureDiagrams: false,
      builtinIntegrations: false,
      recordAttachments: false,
    },
  };

export const WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG: InformationRepositoryWorkspaceConfig =
  {
    profile: INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
    apiBasePath: "/api/information-repository",
    loadErrorLabel: "Information Repository",
    selectPrompt: "Select a section above to view and edit its information.",
    emptyStateTitle: "No information has been added yet.",
    emptyStateBody:
      "Create sections and tiles to build the WOLF information repository.",
    addSectionPlaceholder: "Section name, e.g. Company Structure, Technology Stack…",
    features: {
      docPacks: false,
      architectureHub: false,
      architectureDiagrams: true,
      builtinIntegrations: false,
      recordAttachments: true,
    },
  };

export const GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG: InformationRepositoryWorkspaceConfig =
  {
    profile: INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
    apiBasePath: "/api/information-repository",
    loadErrorLabel: "Information Repository",
    selectPrompt: "Select a section above to view and edit its information.",
    emptyStateTitle: "No information has been added yet.",
    emptyStateBody:
      "Create sections and tiles to build the Green Desert information repository.",
    addSectionPlaceholder: "Section name, e.g. Company Structure, Technology Stack…",
    features: {
      docPacks: false,
      architectureHub: false,
      architectureDiagrams: true,
      builtinIntegrations: false,
      recordAttachments: true,
    },
  };

const InformationRepositoryWorkspaceConfigContext =
  createContext<InformationRepositoryWorkspaceConfig>(UNIT311_DETAILS_WORKSPACE_CONFIG);

export function InformationRepositoryWorkspaceConfigProvider({
  config,
  children,
}: {
  config: InformationRepositoryWorkspaceConfig;
  children: ReactNode;
}) {
  return (
    <InformationRepositoryWorkspaceConfigContext.Provider value={config}>
      {children}
    </InformationRepositoryWorkspaceConfigContext.Provider>
  );
}

export function useInformationRepositoryWorkspaceConfig() {
  return useContext(InformationRepositoryWorkspaceConfigContext);
}
