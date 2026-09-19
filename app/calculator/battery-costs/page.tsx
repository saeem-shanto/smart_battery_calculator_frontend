"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { getDraft, saveDraft } from "@/lib/draft";
import type { DraftCalculation } from "@/lib/types";

function validateCost(raw: string) {
  if (!raw.trim()) return "Enter the installed battery cost per kWh.";
  const value = Number(raw);
  if (!Number.isFinite(value)) return "Enter a valid numeric installed cost.";
  if (value < 0 || value > 10000) return "Installed battery cost must be between $0 and $10,000 per kWh.";
  return "";
}

export default function BatteryCostsPage() {
  const [cost, setCost] = useState("1000");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<DraftCalculation | null>(null);
  const costRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = getDraft();
    if (!current.inputFileName) {
      window.location.replace("/calculator/load-solar");
      return;
    }
    setDraft(current);
    setCost(String(current.batteryInstalledCostPerKwh ?? 1000));
  }, []);

  function revealCost() {
    costRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => costRef.current?.focus({ preventScroll: true }), 250);
  }

  function validate(show = true) {
    const message = validateCost(cost);
    if (show) setError(message);
    return message;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const message = validate(true);
    if (message) {
      revealCost();
      return;
    }
    const value = Number(cost);
    saveDraft({ batteryInstalledCostPerKwh: value, publicId: undefined, accessToken: undefined });
    window.location.assign("/calculator/results");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 3 of 4 · Add the installed-cost assumption used for simple payback.</p></div>
        <StepIndicator current={3} />

        {draft && (
          <div className="workflow-context" role="status">
            <div><span>Input</span><strong>{draft.inputFileName}</strong></div>
            <div><span>Retention</span><strong>{draft.retainData ? "Saved after calculation" : "Transient / not saved"}</strong></div>
            <div><span>Optimisation</span><strong>Client MATLAB assumptions locked</strong></div>
          </div>
        )}

        <section className="section-card">
          <h2 className="section-title">Battery installed cost</h2>
          <p className="section-subtitle">This value is used only for the displayed simple payback calculation. It does not alter the client optimisation.</p>
          <div className={`field production-cost-field${error ? " has-error" : ""}`}>
            <label htmlFor="battery-cost">Installed battery cost <span className="required-label">Required</span></label>
            <div className="input-wrap">
              <span className="input-prefix">$</span>
              <input
                ref={costRef}
                id="battery-cost"
                className={`input has-prefix has-unit ${error ? "input-error" : ""}`}
                type="number"
                inputMode="decimal"
                min="0"
                max="10000"
                step="10"
                value={cost}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "battery-cost-error" : "battery-cost-help"}
                onBlur={() => validate(true)}
                onChange={(event) => {
                  setCost(event.target.value);
                  if (error) setError("");
                }}
              />
              <span className="input-unit">/kWh</span>
            </div>
            <div id="battery-cost-help" className="field-help">Use the installed cost assumption you want reflected in the simple-payback result. You can change it and rerun later.</div>
            {error && <div id="battery-cost-error" className="field-message error" role="alert">{error}</div>}
          </div>
          <div className="notice"><Info size={17} /><span>The optimisation itself still uses the original annual battery payment rate of <strong>$50/kWh/year</strong>. This separate installed-cost assumption is used by Django only to report simple payback.</span></div>
        </section>

        <div className="calculation-ready-note">
          <strong>Ready to calculate</strong>
          <span>The next step uploads the validated workbook to Django and runs the annual optimisation. Keep the results page open until it finishes.</span>
        </div>

        <div className="button-row">
          <button className="btn" type="button" onClick={() => window.location.assign("/calculator/tariff")}><ArrowLeft size={18} /> Back</button>
          <button className="btn btn-primary btn-lg" type="submit">Run Calculation <ArrowRight size={18} /></button>
        </div>
      </form>
    </AppShell>
  );
}
