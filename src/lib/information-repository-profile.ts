import {
  UNIT311_DETAIL_CATEGORIES,
  UNIT311_DETAIL_ROWS,
  UNIT311_DETAILS_ROOT_FOLDER_NAME,
  type Unit311DetailCategory,
} from "@/lib/unit311-details-data";
import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";

export type InformationRepositoryProfile = {
  id: string;
  rootFolderName: string;
  builtinCategories: readonly Unit311DetailCategory[];
  builtinRows: readonly (readonly string[])[];
};

export const WOLF_MODEL_TESTING_ARCH_CATEGORY: Unit311DetailCategory = {
  id: WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
  label: "MODEL TESTING ARCH",
  folderName: "1",
  builtin: true,
};

export const WOLF_INFORMATION_REPOSITORY_PROFILE: InformationRepositoryProfile = {
  id: "wolf-information-repository",
  rootFolderName: "Information Repository",
  builtinCategories: [WOLF_MODEL_TESTING_ARCH_CATEGORY],
  builtinRows: [[WOLF_MODEL_TESTING_ARCH_CATEGORY_ID]],
};

export const UNIT311_DETAILS_REPOSITORY_PROFILE: InformationRepositoryProfile = {
  id: "unit311-details",
  rootFolderName: UNIT311_DETAILS_ROOT_FOLDER_NAME,
  builtinCategories: UNIT311_DETAIL_CATEGORIES,
  builtinRows: UNIT311_DETAIL_ROWS,
};

export const INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE: InformationRepositoryProfile = {
  id: "interface-worx-information-repository",
  rootFolderName: "Information Repository",
  builtinCategories: [],
  builtinRows: [],
};

export function resolveInformationRepositoryProfile(
  workspaceSlug: string | null | undefined,
): InformationRepositoryProfile {
  const normalized = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "wolf-central" || normalized === "wolf") {
    return WOLF_INFORMATION_REPOSITORY_PROFILE;
  }
  return INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE;
}

export function isWolfModelTestingArchCategoryId(categoryId: string | null | undefined): boolean {
  return String(categoryId ?? "").trim() === WOLF_MODEL_TESTING_ARCH_CATEGORY_ID;
}

export function isReservedRepositoryFolderName(
  name: string,
  profile: InformationRepositoryProfile,
): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === profile.rootFolderName.toLowerCase()) return true;
  return profile.builtinCategories.some(
    (category) => category.folderName.toLowerCase() === normalized,
  );
}

export function groupRepositoryCategoriesIntoRows(
  categories: readonly Unit311DetailCategory[],
  profile: InformationRepositoryProfile,
): Unit311DetailCategory[][] {
  const builtinIds = new Set(profile.builtinCategories.map((category) => category.id));
  const rows: Unit311DetailCategory[][] = profile.builtinRows.map((row) =>
    row
      .map((id) => categories.find((category) => category.id === id) ?? null)
      .filter((category): category is Unit311DetailCategory => category !== null),
  );

  const customCategories = categories.filter((category) => !builtinIds.has(category.id));
  if (customCategories.length > 0) {
    rows.push(customCategories);
  }

  return rows.filter((row) => row.length > 0);
}
