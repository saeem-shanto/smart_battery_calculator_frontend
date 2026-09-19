"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { getDraft } from "@/lib/draft";

const assumptions = [
  ["PV system size", "5.0 kW"],
  ["Retail electricity price", "$0.3773/kWh"],
  ["Feed-in tariff", "$0.124/kWh"],
  ["Battery annual payment rate", "$50/kWh/year"],
  ["Battery search range", "0–50 kWh"],
  ["SOC operating range", "10%–95%"],
];

export default function TariffPage() {
  useEffect(() => {
    const draft = getDraft();
    if (!draft.inputFileName) window.location.replace("/calculator/load-solar");
  }, []);

  return (
    <AppShell>
      <div className="step-heading"><h1>New Calculation</h1><p>Step 2 of 4</p></div>
      <StepIndicator current={2} />
      <section className="section-card">
        <div className="locked-heading">
          <div>
            <h2 className="section-title">Client algorithm assumptions</h2>
            <p className="section-subtitle">These values come from the original MATLAB source and are intentionally not editable in this production workflow.</p>
          </div>
          <span className="status-pill"><LockKeyhole size={14} /> Locked</span>
        </div>
        <div className="assumption-grid">
          {assumptions.map(([label, value]) => <div className="assumption-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </section>
      <div className="notice"><strong>Why locked?</strong>&nbsp; The project requirement is to preserve the client-provided MATLAB files unchanged. The frontend therefore shows the actual values used by the optimisation instead of presenting controls that would be ignored.</div>
      <div className="button-row">
        <button className="btn" onClick={() => window.location.assign("/calculator/load-solar")}><ArrowLeft size={18} /> Back</button>
        <button className="btn btn-primary btn-lg" onClick={() => window.location.assign("/calculator/battery-costs")}>Next: Battery Cost <ArrowRight size={18} /></button>
      </div>
    </AppShell>
  );
}
