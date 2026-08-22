import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { parseDataUrlImage } from "@/lib/platform-workspaces/provisioning-validation";
import type {
  WorkspaceLoginPageConfig,
  WorkspaceLoginPageInput,
} from "@/lib/platform-workspaces/types";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

const LOGIN_ASSET_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

export type LoginPageProvisioningRequest = {
  workspaceId: string;
  loginPage: WorkspaceLoginPageInput;
};

export type LoginPageProvisioningResult = {
  status: "complete" | "skipped" | "failed";
  title: string;
  logoStoragePath: string | null;
  backgroundStoragePath: string | null;
  message: string;
};

function requireFilesSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured for login asset storage.");
  }
  return createTenancyServerClient();
}

function loginAssetStoragePath(workspaceId: string, kind: "logo" | "background", extension: string) {
  const suffix = kind === "background" ? "jpg" : extension;
  return `${workspaceId}/login/${kind}.${suffix}`;
}

async function uploadLoginAsset(input: {
  workspaceId: string;
  kind: "logo" | "background";
  dataUrl: string;
}): Promise<string> {
  const parsed = parseDataUrlImage(input.dataUrl);
  if (!parsed) {
    throw new Error(`Invalid ${input.kind} image upload.`);
  }
  if (input.kind === "background" && parsed.extension !== "jpg" && parsed.contentType !== "image/jpeg") {
    throw new Error("Login background must be a JPG image.");
  }

  const supabase = requireFilesSupabase();
  const storagePath = loginAssetStoragePath(input.workspaceId, input.kind, parsed.extension);

  const { error: uploadError } = await supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .upload(storagePath, parsed.bytes, {
      contentType: parsed.contentType,
      upsert: true,
    });
  if (uploadError) {
    throw new Error(uploadError.message || `Failed to upload login ${input.kind}.`);
  }
  return storagePath;
}

export async function createSignedLoginAssetUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  if (!isSupabaseServiceRoleConfigured()) return null;

  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .createSignedUrl(storagePath, LOGIN_ASSET_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Persist login page title and upload logo/background assets to internal-files storage.
 * Idempotent per workspace — reuses existing storage paths when uploads are omitted on retry.
 */
export async function provisionWorkspaceLoginPage(
  request: LoginPageProvisioningRequest,
): Promise<LoginPageProvisioningResult> {
  const title = request.loginPage.title.trim();
  if (!title) {
    throw new Error("Login page title is required.");
  }

  const supabase = createTenancyServerClient();
  const { data: metadata } = await supabase
    .from("workspace_admin_metadata")
    .select(
      "login_page_title, login_logo_storage_path, login_background_storage_path, provisioning_login_page_status",
    )
    .eq("workspace_id", request.workspaceId)
    .maybeSingle();

  if (metadata?.provisioning_login_page_status === "complete" && metadata.login_page_title) {
    return {
      status: "complete",
      title: String(metadata.login_page_title),
      logoStoragePath: metadata.login_logo_storage_path ? String(metadata.login_logo_storage_path) : null,
      backgroundStoragePath: metadata.login_background_storage_path
        ? String(metadata.login_background_storage_path)
        : null,
      message: "Login page configuration already provisioned.",
    };
  }

  let logoStoragePath = metadata?.login_logo_storage_path
    ? String(metadata.login_logo_storage_path)
    : null;
  let backgroundStoragePath = metadata?.login_background_storage_path
    ? String(metadata.login_background_storage_path)
    : null;

  if (request.loginPage.logoDataUrl?.trim()) {
    logoStoragePath = await uploadLoginAsset({
      workspaceId: request.workspaceId,
      kind: "logo",
      dataUrl: request.loginPage.logoDataUrl,
    });
  }

  if (request.loginPage.backgroundDataUrl?.trim()) {
    backgroundStoragePath = await uploadLoginAsset({
      workspaceId: request.workspaceId,
      kind: "background",
      dataUrl: request.loginPage.backgroundDataUrl,
    });
  }

  const { error } = await supabase
    .from("workspace_admin_metadata")
    .update({
      login_page_title: title,
      login_logo_storage_path: logoStoragePath,
      login_background_storage_path: backgroundStoragePath,
      provisioning_login_page_status: "complete",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", request.workspaceId);

  if (error) {
    throw new Error(error.message || "Failed to persist login page configuration.");
  }

  return {
    status: "complete",
    title,
    logoStoragePath,
    backgroundStoragePath,
    message: "Customer login page configured and persisted.",
  };
}

export async function loadWorkspaceLoginBrandingByWorkspaceId(
  workspaceId: string,
): Promise<WorkspaceLoginPageConfig | null> {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspace_admin_metadata")
    .select("login_page_title, login_logo_storage_path, login_background_storage_path")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data?.login_page_title) return null;

  const [logoUrl, backgroundUrl] = await Promise.all([
    createSignedLoginAssetUrl(data.login_logo_storage_path ? String(data.login_logo_storage_path) : null),
    createSignedLoginAssetUrl(
      data.login_background_storage_path ? String(data.login_background_storage_path) : null,
    ),
  ]);

  return {
    title: String(data.login_page_title),
    logoUrl,
    backgroundUrl,
  };
}

export async function loadWorkspaceLoginBrandingBySlug(
  workspaceSlug: string,
): Promise<WorkspaceLoginPageConfig | null> {
  const supabase = createTenancyServerClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug.trim().toLowerCase())
    .maybeSingle();

  if (!workspace?.id) return null;
  return loadWorkspaceLoginBrandingByWorkspaceId(String(workspace.id));
}

export async function verifyWorkspaceLoginPageReady(workspaceId: string): Promise<boolean> {
  const supabase = createTenancyServerClient();
  const { data } = await supabase
    .from("workspace_admin_metadata")
    .select("login_page_title, provisioning_login_page_status")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return (
    data?.provisioning_login_page_status === "complete" &&
    Boolean(String(data.login_page_title ?? "").trim())
  );
}
