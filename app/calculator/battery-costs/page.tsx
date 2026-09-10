"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { InlineIssue, ValidationSummary } from "@/components/ValidationSummary";
import { getDraft, saveDraft } from "@/lib/draft";
import { errorsOnly, validateBatteryInput, warningsOnly, type BatteryFormValues } from "@/lib/validation";

const defaults: BatteryFormValues = { batteryCost: "8000", replacementCost: "8000", efficiency: "90", depthOfDischarge: "90", projectLifetime: "15", discountRate: "6" };
type FormKey = keyof BatteryFormValues;

export default function BatteryCostsPage() {
  const [form, setForm] = useState<BatteryFormValues>(defaults);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    if (!draft.tariffId || !draft.loadMode || !draft.pvSize) {
      window.location.replace(draft.loadMode ? "/calculator/tariff" : "/calculator/load-solar");
      return;
    }
    setForm({
      batteryCost: String(draft.batteryCost ?? 8000),
      replacementCost: String(draft.replacementCost ?? 8000),
      efficiency: String(draft.efficiency ?? 90),
      depthOfDischarge: String(draft.depthOfDischarge ?? 90),
      projectLifetime: String(draft.projectLifetime ?? 15),
      discountRate: String(draft.discountRate ?? 6),
    });
  }, []);

  const issues = useMemo(() => validateBatteryInput(form), [form]);
  const visibleIssues = useMemo(() => [...(submitted ? errorsOnly(issues) : []), ...warningsOnly(issues)], [issues, submitted]);

  const update = (key: FormKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errorsOnly(issues).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    saveDraft({
      batteryCost: Number(form.batteryCost),
      replacementCost: Number(form.replacementCost),
      efficiency: Number(form.efficiency),
      depthOfDischarge: Number(form.depthOfDischarge),
      projectLifetime: Number(form.projectLifetime),
      discountRate: Number(form.discountRate),
    });
    window.location.assign("/calculator/results");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 3 of 4</p></div>
        <StepIndicator current={3} />
        <ValidationSummary issues={visibleIssues} />
        <h2 className="section-title">Battery & Cost Assumptions</h2>
        <p className="section-subtitle">Enter battery and project cost details used by the dummy calculation.</p>
        <div className="form-grid">
          <NumericField label="Battery Cost ($)" field="batteryCost" value={form.batteryCost} onChange={update} min={1} max={100000} step={100} issues={visibleIssues} />
          <NumericField label="Battery Replacement Cost ($)" field="replacementCost" value={form.replacementCost} onChange={update} min={0} max={100000} step={100} issues={visibleIssues} />
          <NumericField label="Battery Efficiency (%)" field="efficiency" value={form.efficiency} onChange={update} min={50} max={100} step={1} unit="%" issues={visibleIssues} />
          <NumericField label="Battery Depth of Discharge (%)" field="depthOfDischarge" value={form.depthOfDischarge} onChange={update} min={50} max={100} step={1} unit="%" issues={visibleIssues} />
          <NumericField label="Project Lifetime (years)" field="projectLifetime" value={form.projectLifetime} onChange={update} min={1} max={30} step={1} unit="years" issues={visibleIssues} />
          <NumericField label="Discount Rate (%)" field="discountRate" value={form.discountRate} onChange={update} min={0} max={30} step={0.1} unit="%" issues={visibleIssues} />
        </div>
        <div className="notice">These assumptions are passed to <code>POST /api/calculate</code>. Errors block navigation; warnings allow navigation after you review the values.</div>
        <div className="button-row"><button className="btn" type="button" onClick={() => window.location.assign("/calculator/tariff")}><ArrowLeft size={18}/> Back</button><button className="btn btn-primary btn-lg" type="submit">Next: Results <ArrowRight size={18}/></button></div>
      </form>
    </AppShell>
  );
}

function NumericField({ label, field, value, onChange, min, max, step, unit, issues }: { label: string; field: FormKey; value: string; onChange: (field: FormKey, value: string) => void; min: number; max: number; step: number; unit?: string; issues: ReturnType<typeof validateBatteryInput> }) {
  const hasError = issues.some((issue) => issue.field === field && issue.level === "error");
  return <div className="field"><label htmlFor={field}>{label}</label><div className="input-wrap"><input id={field} className={`input ${unit ? "has-unit" : ""} ${hasError ? "input-error" : ""}`} type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(field, e.target.value)} />{unit && <span className="input-unit">{unit}</span>}</div><InlineIssue issues={issues} field={field} /></div>;
}
