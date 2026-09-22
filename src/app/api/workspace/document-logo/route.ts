import { NextRequest, NextResponse } from "next/server";

import { requireUsersModuleAdministratorSession } from "@/lib/internal-admin-auth";
import {
  getWorkspaceDocumentLogoRecord,
  removeWorkspaceDocumentLogo,
  resolveWorkspaceDocumentLogoPreview,
  uploadWorkspaceDocumentLogo,
} from "@/lib/workspace-document-logo-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  try {
    const record = await getWorkspaceDocumentLogoRecord(auth.workspace.id);
    const preview = resolveWorkspaceDocumentLogoPreview({
      workspaceSlug: auth.workspace.slug,
      record,
    });
    return NextResponse.json({
      filename: record.filename,
      contentType: record.contentType,
      ...preview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace document logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
    }
    await uploadWorkspaceDocumentLogo(auth.workspace.id, file);
    const record = await getWorkspaceDocumentLogoRecord(auth.workspace.id);
    const preview = resolveWorkspaceDocumentLogoPreview({
      workspaceSlug: auth.workspace.slug,
      record,
    });
    return NextResponse.json({
      ok: true,
      filename: record.filename,
      contentType: record.contentType,
      ...preview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload workspace document logo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  try {
    await removeWorkspaceDocumentLogo(auth.workspace.id);
    const record = await getWorkspaceDocumentLogoRecord(auth.workspace.id);
    const preview = resolveWorkspaceDocumentLogoPreview({
      workspaceSlug: auth.workspace.slug,
      record,
    });
    return NextResponse.json({ ok: true, ...preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove workspace document logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
