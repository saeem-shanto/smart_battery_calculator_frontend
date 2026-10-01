import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";
export const metadata = privatePageMetadata("Saved Scenarios", "Private saved battery calculation scenarios.");
export default function Layout({ children }: { children: ReactNode }) { return children; }
