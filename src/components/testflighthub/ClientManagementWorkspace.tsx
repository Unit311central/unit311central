"use client";

import type { ManagedClient } from "@/lib/client-management-data";
import {
  type ClientDirectorySurfaceVariant,
  isBusinessCentralClientDirectorySurface,
} from "@/lib/client-directory-surface";

import ClientManagementClientDirectoryView from "./ClientManagementClientDirectoryView";
import ClientManagementLegacyDirectoryView from "./ClientManagementLegacyDirectoryView";

export type ClientManagementWorkspaceProps = {
  onClientsChange?: (clients: ManagedClient[]) => void;
  /** Explicit surface — do not infer from `view=clients` alone. */
  surfaceVariant?: ClientDirectorySurfaceVariant;
};

export default function ClientManagementWorkspace({
  surfaceVariant = "legacy",
  ...props
}: ClientManagementWorkspaceProps) {
  if (isBusinessCentralClientDirectorySurface(surfaceVariant)) {
    return <ClientManagementClientDirectoryView {...props} />;
  }
  return <ClientManagementLegacyDirectoryView {...props} />;
}
