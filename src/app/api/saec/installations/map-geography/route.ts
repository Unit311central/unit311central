import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireSaecInstallationsWorkspace } from "@/lib/saec/installations-auth";

export const dynamic = "force-dynamic";

const LAYER_FILES = {
  country: "south-africa-country.geojson",
  provinces: "south-africa-provinces.geojson",
} as const;

type MapLayer = keyof typeof LAYER_FILES;

function parseLayer(value: string | null): MapLayer {
  return value === "provinces" ? "provinces" : "country";
}

export async function GET(request: Request) {
  try {
    await requireSaecInstallationsWorkspace();
    const url = new URL(request.url);
    const layer = parseLayer(url.searchParams.get("layer"));
    const filePath = path.join(process.cwd(), "public/geo/saec", LAYER_FILES[layer]);
    const body = await readFile(filePath, "utf8");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load South Africa map geography.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
