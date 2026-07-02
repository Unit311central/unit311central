import { NextRequest, NextResponse } from "next/server";

import { buildOpenMeteoUrl, parseOpenMeteoResponse } from "@/lib/weather-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const latitude = request.nextUrl.searchParams.get("latitude");
  const longitude = request.nextUrl.searchParams.get("longitude");
  const label = request.nextUrl.searchParams.get("label") ?? "Survey area";

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "latitude and longitude are required" }, { status: 400 });
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "latitude and longitude must be numbers" }, { status: 400 });
  }

  try {
    const response = await fetch(buildOpenMeteoUrl(lat, lon), {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Weather provider unavailable" }, { status: 502 });
    }

    const payload = await response.json();
    const weather = parseOpenMeteoResponse(payload);

    return NextResponse.json({
      ...weather,
      label,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
