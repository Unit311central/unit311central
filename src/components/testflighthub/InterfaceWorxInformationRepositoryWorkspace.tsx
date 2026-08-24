"use client";

import Unit311DetailsWorkspace from "./Unit311DetailsWorkspace";
import {
  InformationRepositoryWorkspaceConfigProvider,
  INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
} from "./information-repository-workspace-config";

export default function InterfaceWorxInformationRepositoryWorkspace() {
  return (
    <InformationRepositoryWorkspaceConfigProvider
      config={INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG}
    >
      <Unit311DetailsWorkspace />
    </InformationRepositoryWorkspaceConfigProvider>
  );
}
