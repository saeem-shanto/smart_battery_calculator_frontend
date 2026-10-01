import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Electricity Tariff Library",
  description: "Browse electricity tariff information available to the Smart Battery Calculator for solar PV and battery energy-cost comparisons.",
  path: "/tariff-library",
  keywords: ["electricity tariffs Australia", "solar feed-in tariff", "battery tariff comparison"],
});

export default function Layout({ children }: { children: ReactNode }) { return children; }
