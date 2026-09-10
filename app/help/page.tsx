import { AppShell } from "@/components/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <div className="page-header"><h1>Help</h1><p>How to use the Smart Battery Calculator prototype.</p></div>
      <div className="help-grid">
        <section className="info-card"><h2>1. Add electricity usage</h2><p>Upload a small CSV with a numeric usage column, or choose one of the sample household profiles.</p></section>
        <section className="info-card"><h2>2. Enter solar size</h2><p>Provide the existing or planned PV system size in kW.</p></section>
        <section className="info-card"><h2>3. Choose a tariff</h2><p>Select a dummy tariff and adjust the feed-in tariff or demand charge if required.</p></section>
        <section className="info-card"><h2>4. Add battery assumptions</h2><p>Enter battery cost, efficiency, depth of discharge, lifetime and discount rate.</p></section>
        <section className="info-card"><h2>5. Review results</h2><p>The local dummy API produces a recommended battery size, bill comparison, savings curve, payback and NPV.</p></section>
        <section className="info-card"><h2>6. Save scenarios</h2><p>Save a result, then view, edit, search or delete it from Saved Scenarios.</p></section>
      </div>
      <div className="notice"><strong>Prototype note:</strong> the calculations are not engineering or financial advice. The dummy API exists only to make the frontend fully testable before the real optimisation service is connected.</div>
    </AppShell>
  );
}
