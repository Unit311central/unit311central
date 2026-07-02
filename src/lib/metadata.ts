import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

type PageMeta = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata({ title, description, path }: PageMeta): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === "/" ? `${SITE_NAME} | Aerial Intelligence` : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    keywords: [
      "DroneCatalyst",
      "aerial intelligence",
      "drone inspection Spain",
      "drone surveying Spain",
      "commercial drone services",
    ],
    openGraph: {
      type: "website",
      locale: "en_GB",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const homeMetadata = createPageMetadata({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: "/",
});
