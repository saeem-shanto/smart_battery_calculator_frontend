import { BatteryCharging, ChartNoAxesCombined, Database, ServerCog, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function AboutPage(){
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "development";
  return <AppShell>
    <div className="page-header"><h1>About</h1><p>Industrial Research Project N01: Smart Battery Calculator.</p></div>
    <div className="about-hero"><BatteryCharging size={42}/><div><h2>Solar PV battery decision-support platform</h2><p>The application uses Next.js as the frontend and calls the Django REST API directly. Django validates annual profiles and executes the client-provided updated MATLAB calculation through GNU Octave.</p><span className="about-version">Frontend version {version}</span></div></div>

    <div className="architecture-strip page-card-space" aria-label="Application architecture">
      <span>Next.js frontend</span><strong>→</strong><span>Django REST API</span><strong>→</strong><span>Supabase + GNU Octave</span>
    </div>

    <div className="help-grid page-card-space">
      <section className="info-card"><ServerCog size={22}/><h2>Client calculation model</h2><p>The current model evaluates a user-selected battery capacity with hourly retail and feed-in tariffs, rather than automatically finding an optimum. GNU Octave provides the server-side runtime.</p></section>
      <section className="info-card"><Database size={22}/><h2>Privacy &amp; auditability</h2><p>The updated calculation pathway is configured for transient processing. Retention depends on the backend capabilities deployed with this model.</p></section>
      <section className="info-card"><UserRound size={22}/><h2>Optional accounts</h2><p>Users may remain guests or create an account. Account JWTs are kept for the current browser tab and sent directly to Django in Authorization headers; retained calculations can be owned by the authenticated user.</p></section>
      <section className="info-card"><ChartNoAxesCombined size={22}/><h2>Results</h2><p>The interface presents selected battery capacity, annual payment, bill reduction, import/export energy, self-consumption and simple payback from the real backend result.</p></section>
      <section className="info-card"><BatteryCharging size={22}/><h2>Research scope</h2><p>The platform is designed for research demonstration and future extension while keeping the validated client algorithm traceable.</p></section>
    </div>
  </AppShell>;
}
