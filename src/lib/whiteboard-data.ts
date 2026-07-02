import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

export type WhiteboardScene = {
  elements: ExcalidrawInitialDataState["elements"];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export type WhiteboardProject = {
  id: string;
  name: string;
  ownerUserId: string | null;
  ownerName: string;
  scene: WhiteboardScene;
  createdAt: string;
  updatedAt: string;
};

export type WhiteboardProjectSummary = Omit<WhiteboardProject, "scene">;

export const EMPTY_WHITEBOARD_SCENE: WhiteboardScene = {
  elements: [],
  appState: { theme: "dark" },
  files: {},
};

type DbWhiteboardProject = {
  id: string;
  name: string;
  owner_user_id: string | null;
  owner_name: string;
  scene: WhiteboardScene | null;
  created_at: string;
  updated_at: string;
};

export function mapWhiteboardProject(row: DbWhiteboardProject): WhiteboardProject {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    scene: normalizeStoredScene(row.scene),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWhiteboardProjectSummary(
  row: Pick<
    DbWhiteboardProject,
    "id" | "name" | "owner_user_id" | "owner_name" | "created_at" | "updated_at"
  >,
): WhiteboardProjectSummary {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeStoredScene(scene: WhiteboardScene | null): WhiteboardScene {
  if (!scene || typeof scene !== "object") {
    return EMPTY_WHITEBOARD_SCENE;
  }

  return {
    elements: scene.elements ?? [],
    appState: scene.appState ?? { theme: "dark" },
    files: scene.files ?? {},
  };
}

export function pickPersistedAppState(appState: AppState): Partial<AppState> {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    currentItemStrokeColor: appState.currentItemStrokeColor,
    currentItemBackgroundColor: appState.currentItemBackgroundColor,
    currentItemFillStyle: appState.currentItemFillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidth,
    currentItemRoughness: appState.currentItemRoughness,
    currentItemOpacity: appState.currentItemOpacity,
    currentItemFontFamily: appState.currentItemFontFamily,
    currentItemFontSize: appState.currentItemFontSize,
    currentItemTextAlign: appState.currentItemTextAlign,
    currentItemStartArrowhead: appState.currentItemStartArrowhead,
    currentItemEndArrowhead: appState.currentItemEndArrowhead,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    zoom: appState.zoom,
    theme: appState.theme,
  };
}

export function normalizeWhiteboardScene(
  elements: WhiteboardScene["elements"],
  appState: AppState,
  files: BinaryFiles,
): WhiteboardScene {
  return {
    elements,
    appState: pickPersistedAppState(appState),
    files,
  };
}

export function createBlankWhiteboardProjectInput(name = "New project") {
  return {
    name,
    scene: EMPTY_WHITEBOARD_SCENE,
  };
}
