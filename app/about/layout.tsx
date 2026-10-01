import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "About the Solar Battery Calculator",
  description: "Learn how the Smart Battery Calculator combines Next.js, Django, Supabase and GNU Octave to support solar PV battery sizing research.",
  path: "/about",
  keywords: ["battery calculator research", "GNU Octave battery optimisation"],
});

export default function Layout({ children }: { children: ReactNode }) { return children; }
