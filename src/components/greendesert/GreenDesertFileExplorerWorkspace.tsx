"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, File, Folder, FolderPlus } from "lucide-react";

import { WorkspaceModuleHeader, WorkspaceSection } from "@/components/workspace-ui";
import {
  createGreenDesertFolderEntry,
  GREENDESERT_FILES_ROOT_ID,
  loadGreenDesertFilesState,
  saveGreenDesertFilesState,
} from "@/lib/greendesert/greendesert-files-persistence";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function GreenDesertFileExplorerWorkspace() {
  const [state, setState] = useState(() => loadGreenDesertFilesState());
  const [currentFolderId, setCurrentFolderId] = useState(GREENDESERT_FILES_ROOT_ID);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  useEffect(() => {
    saveGreenDesertFilesState(state);
  }, [state]);

  const currentFolder =
    state.entries.find((entry) => entry.id === currentFolderId) ?? state.entries[0];
  const children = useMemo(
    () => state.entries.filter((entry) => entry.parentId === currentFolderId),
    [state.entries, currentFolderId],
  );

  const createFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) {
      setFolderError("Enter a folder name first.");
      return;
    }

    setFolderError(null);
    setState((current) => createGreenDesertFolderEntry(current, name, currentFolderId));
    setNewFolderName("");
  }, [currentFolderId, newFolderName]);

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <WorkspaceModuleHeader
        brandLabel={GREENDESERT_DISPLAY_NAME}
        moduleLabel="Business Productivity"
        title="File Explorer"
        description="Internal files for Green Desert operators — folders and documents stay on this workspace."
        themeId="talanton-emerald"
      />

      <WorkspaceSection title={currentFolder?.name ?? "Files"}>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
          <span>Green Desert</span>
          {currentFolderId !== GREENDESERT_FILES_ROOT_ID ? (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                type="button"
                className="text-emerald-200/80 hover:text-emerald-100"
                onClick={() => setCurrentFolderId(GREENDESERT_FILES_ROOT_ID)}
              >
                {currentFolder?.name}
              </button>
            </>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={newFolderName}
            onChange={(event) => {
              setNewFolderName(event.target.value);
              if (folderError) setFolderError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createFolder();
              }
            }}
            placeholder="New folder name"
            aria-invalid={folderError ? true : undefined}
            aria-describedby={folderError ? "gd-new-folder-error" : undefined}
            className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
          <button
            type="button"
            onClick={createFolder}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100"
          >
            <FolderPlus className="h-4 w-4" />
            Create folder
          </button>
        </div>
        {folderError ? (
          <p id="gd-new-folder-error" className="mb-4 text-sm text-amber-200/90">
            {folderError}
          </p>
        ) : null}

        {children.length === 0 ? (
          <p className="text-sm text-white/45">This folder is empty.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-black/20">
            {children.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (entry.kind === "folder") setCurrentFolderId(entry.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/80",
                    entry.kind === "folder" && "hover:bg-white/[0.03]",
                  )}
                >
                  {entry.kind === "folder" ? (
                    <Folder className="h-4 w-4 text-emerald-300/80" />
                  ) : (
                    <File className="h-4 w-4 text-white/45" />
                  )}
                  <span className="flex-1">{entry.name}</span>
                  <span className="text-xs text-white/35">{formatWhen(entry.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </WorkspaceSection>
    </div>
  );
}
