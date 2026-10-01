import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Battery Calculator",
    short_name: "Battery Calculator",
    description: "Research decision-support tool for solar PV battery sizing and energy-cost comparison.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b9e45",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
