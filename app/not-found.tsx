import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <AppShell>
      <div className="page-header">
        <h1>Page not found</h1>
        <p>The page you requested does not exist or may have moved.</p>
      </div>
      <div className="notice page-card-space">
        <a href="/"><strong>Return to Smart Battery Calculator</strong></a>
      </div>
    </AppShell>
  );
}
