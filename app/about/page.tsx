import { BatteryCharging, ChartNoAxesCombined, Database, PanelsTopLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="page-header"><h1>About</h1><p>Smart Battery Calculator frontend prototype.</p></div>
      <section className="about-hero page-card-space">
        <BatteryCharging size={42}/><div><h2>Solar PV battery decision-support interface</h2><p>This Next.js prototype demonstrates the intended user journey before the real optimisation backend is integrated.</p></div>
      </section>
      <div className="help-grid">
        <section className="info-card"><PanelsTopLeft size={22}/><h2>Frontend</h2><p>Next.js App Router with reusable responsive components and client-side form state.</p></section>
        <section className="info-card"><Database size={22}/><h2>Dummy APIs</h2><p>Local Next.js route handlers provide load profiles, tariff data, CSV preview, calculation outputs and scenario CRUD.</p></section>
        <section className="info-card"><ChartNoAxesCombined size={22}/><h2>Results</h2><p>Dynamic demonstration results change with load, PV, tariff and battery assumptions.</p></section>
      </div>
    </AppShell>
  );
}
