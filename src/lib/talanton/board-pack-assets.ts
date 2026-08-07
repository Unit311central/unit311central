import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import type { JourneyStory } from "@/lib/talanton/journey-stories-store";

export const HARRY_TURNER_QUOTE =
  "We invest with purpose — stewarding capital that creates dignified jobs at scale across Sub-Saharan Africa.";

const HARRY_TURNER_PHOTO_PATH = join(process.cwd(), "public", "images", "talanton", "harry-turner.jpg");

const SLIDE_BACKDROP_URLS = {
  executive:
    "https://images.unsplash.com/photo-1521737711862-e3b97375f902?auto=format&fit=crop&w=1600&q=80",
  minutes:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
  risk: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
  funds: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
  portfolio:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
} as const;

export type TalantonBoardPackAssets = {
  harryTurnerPhoto: string | null;
  journeyPhotos: Map<string, string | null>;
  slideBackdrops: Record<keyof typeof SLIDE_BACKDROP_URLS, string | null>;
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
  const [harryTurnerPhoto, ...rest] = await Promise.all([
    loadHarryTurnerPhoto(),
    ...stories.map(async (story) => {
      const url = storyPhotoUrl(story);
      if (!url) return [story.id, null] as const;
      const dataUrl = await fetchImageAsJpegDataUrl(url);
      return [story.id, dataUrl] as const;
    }),
    ...Object.entries(SLIDE_BACKDROP_URLS).map(async ([key, url]) => {
      const dataUrl = await fetchImageAsJpegDataUrl(url);
      return [key, dataUrl] as const;
    }),
  ]);

  const journeyResults = rest.slice(0, stories.length) as Array<readonly [string, string | null]>;
  const backdropResults = rest.slice(stories.length) as Array<
    readonly [keyof typeof SLIDE_BACKDROP_URLS, string | null]
  >;

  const journeyPhotos = new Map<string, string | null>(journeyResults);
  const slideBackdrops = Object.fromEntries(backdropResults) as Record<
    keyof typeof SLIDE_BACKDROP_URLS,
    string | null
  >;
  return { harryTurnerPhoto, journeyPhotos, slideBackdrops };
}
