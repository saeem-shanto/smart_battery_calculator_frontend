import { DashboardClient } from "@/components/DashboardClient";
import { JsonLd } from "@/components/JsonLd";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Solar Battery Calculator Australia",
  description: DEFAULT_DESCRIPTION,
  path: "/",
  keywords: ["household battery calculator", "solar storage sizing Australia"],
});

export default function HomePage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "en-AU",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser with JavaScript enabled.",
      description: DEFAULT_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "AUD",
      },
      featureList: [
        "Solar battery sizing from annual load and PV profiles",
        "Battery cost and savings estimates",
        "Optional calculation retention",
        "Guest and registered-user workflows",
      ],
    },
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <DashboardClient />
    </>
  );
}
