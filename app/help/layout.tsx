import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Help & Battery Calculator Guide",
  description: "Learn how to upload annual load and solar PV data, run a battery calculation, understand results and manage saved calculations.",
  path: "/help",
  keywords: ["solar battery calculator guide", "battery sizing help"],
});

export default function Layout({ children }: { children: ReactNode }) { return children; }
