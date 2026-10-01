import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";
export const metadata = privatePageMetadata("Account", "Private account and authentication pages.");
export default function Layout({ children }: { children: ReactNode }) { return children; }
