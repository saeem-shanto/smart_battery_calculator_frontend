import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Solar Battery Sizing Calculator",
  description: "Start a solar battery sizing calculation using annual household load and PV profile data. Validate your energy profile before running the optimisation.",
  path: "/calculator/load-solar",
  keywords: ["solar battery sizing calculator", "annual load profile", "PV load profile calculator"],
});

export default function Layout({ children }: { children: ReactNode }) { return children; }
