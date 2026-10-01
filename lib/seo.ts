import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://smartbatterycalculator.vercel.app";

function normalizeSiteUrl(value?: string) {
  const raw = (value || DEFAULT_SITE_URL).trim();
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_NAME = "Smart Battery Calculator";
export const DEFAULT_DESCRIPTION =
  "Estimate a suitable solar battery size using annual household load, solar PV and electricity tariff information. Compare energy costs, savings and battery performance with a research decision-support tool.";

export const DEFAULT_KEYWORDS = [
  "solar battery calculator",
  "home battery calculator",
  "solar battery sizing",
  "battery storage calculator",
  "solar PV battery",
  "battery savings calculator",
  "Australia solar battery",
  "energy storage calculator",
];

export function publicPageMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      locale: "en_AU",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function privatePageMetadata(title: string, description?: string): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}
