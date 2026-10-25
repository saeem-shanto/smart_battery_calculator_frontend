"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleHelp, CircleDollarSign, Info, Landmark } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { InfoTip } from "@/components/InfoTip";
import { getDraft, saveDraft } from "@/lib/draft";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";
import { numericError, V1_DEFAULTS, V1_RULES, type V1NumericField } from "@/lib/algorithm-v1";
import type { DraftCalculation } from "@/lib/types";

type FinanceKey = "interestRatePercent" | "installationCostAud" | "loanPeriodYears" | "dailySupplyChargeAud";
const financeFields: FinanceKey[] = ["installationCostAud", "interestRatePercent", "loanPeriodYears", "dailySupplyChargeAud"];
const descriptions: Record<FinanceKey, string> = {
  installationCostAud: "Total financed package installation cost, not a cost per battery kWh. If the cost covers solar + inverter + battery, include the full package.",
  interestRatePercent: "Annual nominal interest rate as a percentage. Enter 0% for interest-free financing.",
  loanPeriodYears: "Number of years over which the installation cost is paid. Use a whole number.",
  dailySupplyChargeAud: "Fixed electricity connection charge from your retailer, in dollars per day. Separate from hourly usage tariffs.",
};
export default function BatteryCostsPage() {
  const [draft, setDraft] = useState<DraftCalculation | null>(null);
  const [values, setValues] = useState<Record<FinanceKey, string>>({
    installationCostAud: String(V1_DEFAULTS.installationCostAud),
    interestRatePercent: String(V1_DEFAULTS.interestRatePercent),
    loanPeriodYears: String(V1_DEFAULTS.loanPeriodYears),
    dailySupplyChargeAud: String(V1_DEFAULTS.dailySupplyChargeAud),
  });
  const [errors, setErrors] = useState<Partial<Record<FinanceKey, string>>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = getDraft();
    if (!current.inputFileName || (current.inputMode === "generated" && !current.generatedInput)) {
      window.location.replace("/calculator/load-solar"); return;
    }
    if (current.algorithmVersion !== "batt_cal_v1" || !current.v1Inputs) {
      window.location.replace("/calculator/tariff"); return;
    }
    setDraft(current);
    setValues({
      installationCostAud: String(current.v1Inputs.installationCostAud),
      interestRatePercent: String(current.v1Inputs.interestRatePercent),
      loanPeriodYears: String(current.v1Inputs.loanPeriodYears),
      dailySupplyChargeAud: String(current.v1Inputs.dailySupplyChargeAud),
    });
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found: Partial<Record<FinanceKey, string>> = {};
    for (const field of financeFields) {
      const issue = numericError(values[field], field);
      if (issue) found[field] = issue;
    }
    if (Object.keys(found).length) {
      setErrors(found);
      if (found.installationCostAud) firstRef.current?.focus();
      else document.getElementById(`v1-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const current = getDraft();
    if (!current.v1Inputs) { window.location.assign("/calculator/tariff"); return; }
    saveDraft({
      algorithmVersion: "batt_cal_v1",
      v1Inputs: {
        ...current.v1Inputs,
        installationCostAud: Number(values.installationCostAud),
        interestRatePercent: Number(values.interestRatePercent),
        loanPeriodYears: Number(values.loanPeriodYears),
        dailySupplyChargeAud: Number(values.dailySupplyChargeAud),
      },
      publicId: undefined, accessToken: undefined,
    });
    clearCachedTransientResult();
    window.location.assign("/calculator/results");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>Financial settings</h1><p>Step 3 of 4 · Configure financing and daily electricity supply charges.</p></div>
        <StepIndicator current={3}/>
        {draft && <div className="workflow-context" role="status"><div><span>Battery</span><strong>{draft.v1Inputs?.batteryCapacityKwh} kWh</strong></div><div><span>Solar PV</span><strong>{draft.v1Inputs?.pvCapacityKw} kW</strong></div><div><span>Calculation model</span><strong>batt_cal_v1 (Django / Octave)</strong></div></div>}
        <section className="section-card">
          <div className="n01-titlebar"><div><h2 className="section-title">Installation &amp; loan</h2><p className="section-subtitle">These values determine the annual installation payment in the updated client algorithm. You can accept the defaults or enter your own figures.</p></div><button type="button" className="n01-help-button" onClick={() => setHelpOpen(true)}><CircleHelp size={18}/> Tips &amp; Help</button></div>
          <div className="v1-field-grid">
            {financeFields.map((field, index) => <div className={`field${errors[field] ? " has-error" : ""}`} key={field}>
              <label htmlFor={`v1-${field}`}>{index === 0 ? <CircleDollarSign size={17} /> : <Landmark size={17} />}{V1_RULES[field].label} <InfoTip text={descriptions[field]}/></label>
              <div className="v1-input-with-unit"><input ref={index === 0 ? firstRef : undefined} id={`v1-${field}`} className={`input${errors[field] ? " input-error" : ""}`} type="number" inputMode="decimal" min={V1_RULES[field].min} max={V1_RULES[field].max} step={V1_RULES[field].step} value={values[field]} aria-invalid={!!errors[field]} onChange={e => { setValues(old => ({ ...old, [field]: e.target.value })); setErrors(old => ({ ...old, [field]: undefined })); }}/><span>{field === "installationCostAud" ? "AUD" : V1_RULES[field].unit}</span></div>
              <small className="field-help">{descriptions[field]} Range: {V1_RULES[field].min}–{V1_RULES[field].max} {V1_RULES[field].unit}.</small>
              {errors[field] && <div className="field-message error" role="alert">{errors[field]}</div>}
            </div>)}
          </div>
          <div className="notice"><Info size={17} /><span>The new client script calculates financing from the total installation cost. This <strong>replaces the previous $/kWh simple-payback input</strong>; neither should be confused with the 24-hour electricity tariffs.</span></div>
        </section>
        <div className="notice v1-pending-note"><Info size={18}/><span><strong>Backend calculation:</strong> Step 4 sends your validated settings to Django. Django prepares the annual profile, runs the updated MATLAB model in GNU Octave and returns results.</span></div>
        <div className="button-row"><button className="btn" type="button" onClick={() => window.location.assign("/calculator/tariff")}><ArrowLeft size={18}/> Back</button><button className="btn btn-primary btn-lg" type="submit">Run calculation <ArrowRight size={18}/></button></div>
        {helpOpen && <div className="n01-modal-overlay" onClick={() => setHelpOpen(false)}><div className="n01-modal" role="dialog" aria-modal="true" aria-labelledby="v1-finance-help" onClick={e => e.stopPropagation()}><div className="n01-modal-header"><h2 id="v1-finance-help">Financial input tips</h2><button aria-label="Close tips" type="button" onClick={() => setHelpOpen(false)}>✕</button></div><ol><li><strong>Installation cost:</strong> enter the total financed purchase and installation cost in Australian dollars (default $8,000).</li><li><strong>Annual interest:</strong> 2 means 2%, not 0.02%. Zero interest is supported in this frontend calculation.</li><li><strong>Loan period:</strong> whole years, default 10.</li><li><strong>Daily supply:</strong> your daily retailer connection fee, separate from each hourly electricity rate.</li><li><strong>Read-only previews:</strong> the annual financing cost and final results are computed by Django and the MATLAB model, not by your browser.</li></ol><button type="button" className="btn btn-primary" onClick={() => setHelpOpen(false)}>Got it</button></div></div>}
      </form>
    </AppShell>
  );
}
