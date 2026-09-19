import { BatteryCharging, ChartNoAxesCombined, Database, ServerCog, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function AboutPage(){
  return <AppShell>
    <div className="page-header"><h1>About</h1><p>Industrial Research Project N01 — Smart Battery Calculator.</p></div>
    <div className="about-hero"><BatteryCharging size={42}/><div><h2>Solar PV battery decision-support platform</h2><p>The application connects a Next.js user interface to a Django REST API and executes the client-provided MATLAB optimisation unchanged through GNU Octave.</p></div></div>
    <div className="help-grid page-card-space">
      <section className="info-card"><ServerCog size={22}/><h2>Optimisation</h2><p>The original MATLAB source is preserved and integrity-checked. GNU Octave provides the server-side compatible runtime.</p></section>
      <section className="info-card"><Database size={22}/><h2>Privacy &amp; auditability</h2><p>Retention is optional. Saved calculations keep searchable metadata and private file references, while transient calculations create no backend calculation/file record.</p></section>
      <section className="info-card"><UserRound size={22}/><h2>Optional accounts</h2><p>Users may remain guests or create an account. Account JWTs are kept for the current browser tab and sent directly to Django in Authorization headers; retained calculations can be owned by the authenticated user.</p></section>
      <section className="info-card"><ChartNoAxesCombined size={22}/><h2>Results</h2><p>The interface presents battery sizing, annual payment, bill reduction, import/export energy, self-consumption and simple payback from the real backend result.</p></section>
      <section className="info-card"><BatteryCharging size={22}/><h2>Research scope</h2><p>The platform is designed for research demonstration and future extension while keeping the validated client algorithm traceable.</p></section>
    </div>
  </AppShell>;
}
