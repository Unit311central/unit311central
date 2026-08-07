import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import type { JourneyStory } from "@/lib/talanton/journey-stories-store";

export const HARRY_TURNER_QUOTE =
  "We invest with purpose — stewarding capital that creates dignified jobs at scale across Sub-Saharan Africa.";

const HARRY_TURNER_PHOTO_PATH = join(process.cwd(), "public", "images", "talanton", "harry-turner.jpg");

export type TalantonBoardPackAssets = {
  harryTurnerPhoto: string | null;
  journeyPhotos: Map<string, string | null>;
};

async function toJpegDataUrl(bytes: Buffer): Promise<string> {
  const jpeg = await sharp(bytes).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

async function fetchImageAsJpegDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return toJpegDataUrl(bytes);
  } catch {
    return null;
  }
}

export async function loadHarryTurnerPhoto(): Promise<string | null> {
  try {
    const bytes = await readFile(HARRY_TURNER_PHOTO_PATH);
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return fetchImageAsJpegDataUrl(
      "https://cdn.prod.website-files.com/683c8b9430af8743ef01cac4/683c8b9430af8743ef01cc29_Harry%20Turner.webp",
    );
  }
}

function storyPhotoUrl(story: JourneyStory): string | null {
  const photo = story.media.find((m) => m.kind === "photo");
  return photo?.url ?? photo?.previewUrl ?? null;
}

export async function loadTalantonBoardPackAssets(stories: JourneyStory[]): Promise<TalantonBoardPackAssets> {
  const [harryTurnerPhoto, ...journeyResults] = await Promise.all([
    loadHarryTurnerPhoto(),
    ...stories.map(async (story) => {
      const url = storyPhotoUrl(story);
      if (!url) return [story.id, null] as const;
      const dataUrl = await fetchImageAsJpegDataUrl(url);
      return [story.id, dataUrl] as const;
    }),
  ]);

  const journeyPhotos = new Map<string, string | null>(journeyResults);
  return { harryTurnerPhoto, journeyPhotos };
}
