import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/help", "/tariff-library", "/calculator/load-solar"],
        disallow: [
          "/account/",
          "/admin/",
          "/dashboard",
          "/results-history",
          "/saved-scenarios",
          "/calculator/results",
          "/calculator/tariff",
          "/calculator/battery-costs",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
