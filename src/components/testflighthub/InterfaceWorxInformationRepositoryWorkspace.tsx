"use client";

import { useEffect, useState } from "react";

import Unit311DetailsWorkspace from "./Unit311DetailsWorkspace";
import {
  InformationRepositoryWorkspaceConfigProvider,
  INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  type InformationRepositoryWorkspaceConfig,
} from "./information-repository-workspace-config";
import { isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";

export default function InterfaceWorxInformationRepositoryWorkspace() {
  const [config, setConfig] = useState<InformationRepositoryWorkspaceConfig>(
    INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  );

  useEffect(() => {
    if (isBrowserWolfCentralSurface()) {
      setConfig(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG);
    }
  }, []);

  return (
    <InformationRepositoryWorkspaceConfigProvider config={config}>
      <Unit311DetailsWorkspace />
    </InformationRepositoryWorkspaceConfigProvider>
  );
}
