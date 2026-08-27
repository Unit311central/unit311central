import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireWolfCentralWorkspace();
    const filePath = path.join(
      process.cwd(),
      "public/geo/wolf/southern-east-africa-countries.geojson",
    );
    const body = await readFile(filePath, "utf8");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json",
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load WOLF region map geography.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
