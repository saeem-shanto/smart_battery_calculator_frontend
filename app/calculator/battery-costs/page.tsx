"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { getDraft, saveDraft } from "@/lib/draft";

export default function BatteryCostsPage() {
  const [cost, setCost] = useState("1000");
  const [error, setError] = useState("");
  const costRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = getDraft();
    if (!draft.inputFileName) {
      window.location.replace("/calculator/load-solar");
      return;
    }
    setCost(String(draft.batteryInstalledCostPerKwh ?? 1000));
  }, []);

  function revealCost() {
    costRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => costRef.current?.focus({ preventScroll: true }), 250);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(cost);
    if (!Number.isFinite(value) || value < 0 || value > 10000) {
      setError("Installed battery cost must be between $0 and $10,000 per kWh.");
      revealCost();
      return;
    }
    setError("");
    saveDraft({ batteryInstalledCostPerKwh: value, publicId: undefined, accessToken: undefined });
    window.location.assign("/calculator/results");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 3 of 4</p></div>
        <StepIndicator current={3} />
        {error && <div className="error-box" role="alert"><strong>Check your input</strong><span>{error}</span></div>}
        <section className="section-card">
          <h2 className="section-title">Battery installed cost</h2>
          <p className="section-subtitle">This value is used only for the displayed simple payback calculation. It does not alter the client optimisation.</p>
          <div className="field production-cost-field">
            <label htmlFor="battery-cost">Installed battery cost</label>
            <div className="input-wrap">
              <span className="input-prefix">$</span>
              <input
                ref={costRef}
                id="battery-cost"
                className={`input has-prefix has-unit ${error ? "input-error" : ""}`}
                type="number"
                min="0"
                max="10000"
                step="10"
                value={cost}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "battery-cost-error" : undefined}
                onChange={(event) => {
                  setCost(event.target.value);
                  if (error) setError("");
                }}
              />
              <span className="input-unit">/kWh</span>
            </div>
            {error && <div id="battery-cost-error" className="field-message error">{error}</div>}
          </div>
          <div className="notice"><Info size={17} /><span>The optimisation itself still uses the original annual battery payment rate of <strong>$50/kWh/year</strong>. This separate installed-cost assumption is used by Django to report simple payback.</span></div>
        </section>
        <div className="button-row">
          <button className="btn" type="button" onClick={() => window.location.assign("/calculator/tariff")}><ArrowLeft size={18} /> Back</button>
          <button className="btn btn-primary btn-lg" type="submit">Run Calculation <ArrowRight size={18} /></button>
        </div>
      </form>
    </AppShell>
  );
}
