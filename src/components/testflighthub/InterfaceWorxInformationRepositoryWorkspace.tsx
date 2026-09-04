"use client";

import { useEffect, useState } from "react";
import { FileText, Network } from "lucide-react";

import Unit311DetailsWorkspace from "./Unit311DetailsWorkspace";
import WolfInformationRepositoryArchitectureWorkspace from "./WolfInformationRepositoryArchitectureWorkspace";
import {
  InformationRepositoryWorkspaceConfigProvider,
  INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  type InformationRepositoryWorkspaceConfig,
} from "./information-repository-workspace-config";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";
import { isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";
import { cn } from "@/lib/utils";

type WolfRepositoryView = "sections" | "architecture";

export default function InterfaceWorxInformationRepositoryWorkspace() {
  const [config, setConfig] = useState<InformationRepositoryWorkspaceConfig>(
    INTERFACE_WORX_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
  );
  const [wolfView, setWolfView] = useState<WolfRepositoryView>("sections");
  const [isWolfSurface, setIsWolfSurface] = useState(false);

  useEffect(() => {
    const wolf = isBrowserWolfCentralSurface();
    const greenDesert = isBrowserGreenDesertSurface();
    setIsWolfSurface(wolf);
    if (wolf) {
      setConfig(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG);
    } else if (greenDesert) {
      setConfig(GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG);
    }
  }, []);

  const showArchitectureTab = isWolfSurface && config.features.architectureDiagrams;

  return (
    <InformationRepositoryWorkspaceConfigProvider config={config}>
      {showArchitectureTab ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <nav
            aria-label="Information Repository views"
            className="flex flex-wrap gap-2 border-b border-white/10 pb-3"
          >
            {(
              [
                { id: "sections" as const, label: "Sections", icon: FileText },
                { id: "architecture" as const, label: "Architecture Diagrams", icon: Network },
              ] as const
            ).map((item) => {
              const isActive = wolfView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWolfView(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-sky-200" : "text-white/35")} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {wolfView === "architecture" ? (
            <WolfInformationRepositoryArchitectureWorkspace />
          ) : (
            <Unit311DetailsWorkspace />
          )}
        </div>
      ) : (
        <Unit311DetailsWorkspace />
      )}
    </InformationRepositoryWorkspaceConfigProvider>
  );
}
