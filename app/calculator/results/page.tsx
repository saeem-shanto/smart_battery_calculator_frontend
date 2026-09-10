"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, BatteryCharging, Bookmark, CircleDollarSign, Coins, Save, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { BillComparisonChart, SavingsLineChart } from "@/components/Charts";
import { calculateBattery, saveScenario } from "@/lib/api";
import { runDummyCalculation } from "@/lib/dummy-calculator";
import { validateDraftDetailed } from "@/lib/validation";
import { clearDraft, getDraft } from "@/lib/draft";
import type { CalculationResult, DraftCalculation } from "@/lib/types";

export default function ResultsPage() {
  const [draft, setDraft] = useState<DraftCalculation>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("My New Scenario");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [apiStatus, setApiStatus] = useState("Preparing dummy result...");

  useEffect(() => {
    const current = getDraft();
    setDraft(current);
    const validationErrors = validateDraftDetailed(current).filter((issue) => issue.level === "error");
    if (validationErrors.length) {
      setError(validationErrors.map((issue) => issue.message).join(" "));
      return;
    }

    // Render a deterministic local result immediately, then refresh it from the
    // dummy endpoint if that endpoint is available. This prevents infinite loading.
    const immediate = runDummyCalculation(current);
    setResult(immediate);
    setApiStatus("Result ready from browser fallback. Checking dummy API...");

    calculateBattery(current)
      .then((response) => {
        setResult(response);
        setApiStatus("Dummy calculation API connected successfully.");
      })
      .catch(() => {
        setApiStatus("Dummy API was unavailable, so the browser fallback result is shown. The page remains fully functional.");
      });
  }, []);

  const sourceLabel = useMemo(() => {
    if (draft.loadMode === "csv") return draft.csvSummary?.fileName || "Uploaded CSV";
    if (draft.loadMode === "manual") return `Simple data · ${draft.manualDailyUsageKWh ?? "—"} kWh/day`;
    return draft.sampleProfile || "Sample profile";
  }, [draft]);

  async function handleSaveScenario() {
    const name = scenarioName.trim();
    if (!result) return;
    if (!name) return setSaveError("Scenario name is required.");
    if (name.length > 80) return setSaveError("Scenario name must be 80 characters or fewer.");
    setSaving(true);
    setSaveError("");
    try {
      const response = await saveScenario({
        name,
        recommendedBatterySize: result.recommendedBatterySize,
        annualBillReduction: result.annualBillReduction,
        calculationInput: draft,
        calculationResult: result,
      });
      setSavedName(response.scenario.name);
      setSaveOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save scenario.");
    } finally {
      setSaving(false);
    }
  }

  function startNew() {
    clearDraft();
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <div className="step-heading"><h1>New Calculation</h1><p>Step 4 of 4</p></div>
      <StepIndicator current={4} />

      {error && (
        <div className="error-box" role="alert">
          <strong>Calculation could not run.</strong><div>{error}</div>
          <button className="btn btn-small" onClick={() => window.location.assign("/calculator/load-solar")}>Return to Step 1</button>
        </div>
      )}

      {result && <>
        <section className="metrics-grid">
          <Metric icon={<BatteryCharging size={23}/>} tone="green" label={<>Recommended<br/>Battery Size</>} value={`${result.recommendedBatterySize} kWh`} />
          <Metric icon={<BarChart3 size={23}/>} tone="purple" label={<>Annual Bill<br/>Reduction</>} value={`$${result.annualBillReduction.toLocaleString()}`} badge={`${result.annualReductionPercent}%`} />
          <Metric icon={<CircleDollarSign size={23}/>} tone="gold" label="Payback Period" value={`${result.paybackPeriod}`} badge="years" />
          <Metric icon={<Coins size={23}/>} tone="purple" label={<>Net Present Value<br/>({draft.projectLifetime ?? 15} yr)</>} value={`${result.netPresentValue < 0 ? "−" : ""}$${Math.abs(result.netPresentValue).toLocaleString()}`} />
        </section>

        <section className="charts-grid">
          <BillComparisonChart withoutBattery={result.withoutBatteryBill} withBattery={result.withBatteryBill}/>
          <SavingsLineChart points={result.savingsCurve}/>
        </section>

        <section className="result-details-grid">
          <div className="result-detail-card"><span>Load source</span><strong>{sourceLabel}</strong></div>
          <div className="result-detail-card"><span>Estimated annual load</span><strong>{result.annualLoadKWh.toLocaleString()} kWh</strong></div>
          <div className="result-detail-card"><span>Estimated solar generation</span><strong>{result.annualSolarGenerationKWh.toLocaleString()} kWh</strong></div>
          <div className="result-detail-card"><span>Estimated annual export</span><strong>{result.estimatedAnnualExportKWh.toLocaleString()} kWh</strong></div>
          <div className="result-detail-card"><span>Self-consumption</span><strong>{result.selfConsumptionBeforePercent}% → {result.selfConsumptionAfterPercent}%</strong></div>
          <div className="result-detail-card"><span>Grid import</span><strong>{result.annualGridImportBeforeKWh.toLocaleString()} → {result.annualGridImportAfterKWh.toLocaleString()} kWh/yr</strong></div>
        </section>

        <div className="notice"><strong>{result.meta.model}:</strong> {result.meta.message}<br/><span>{apiStatus}</span></div>
        {savedName && <div className="success-box">“{savedName}” was saved successfully. <button onClick={() => window.location.assign("/saved-scenarios")}>Open Saved Scenarios</button></div>}

        <div className="button-row">
          <button className="btn" onClick={() => window.location.assign("/calculator/battery-costs")}><ArrowLeft size={18}/> Back</button>
          <div className="right-actions"><button className="btn" onClick={() => { setScenarioName(savedName || "My New Scenario"); setSaveError(""); setSaveOpen(true); }}><Bookmark size={18}/> Save Scenario</button><button className="btn btn-primary btn-lg" onClick={startNew}>New Calculation <ArrowRight size={18}/></button></div>
        </div>
      </>}

      {saveOpen && result && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setSaveOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="save-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header"><div><h2 id="save-title">Save Scenario</h2><p>Store this dummy calculation in your browser so you can view it later.</p></div><button className="icon-button" onClick={() => setSaveOpen(false)} aria-label="Close"><X size={20}/></button></div>
            {saveError && <div className="error-box" role="alert">{saveError}</div>}
            <div className="field"><label htmlFor="scenario-name">Scenario name</label><input id="scenario-name" className="input" value={scenarioName} onChange={(e) => { setScenarioName(e.target.value); setSaveError(""); }} autoFocus maxLength={80}/><div className="field-help">Required · maximum 80 characters.</div></div>
            <div className="modal-summary"><span>{result.recommendedBatterySize} kWh battery</span><span>${result.annualBillReduction.toLocaleString()} annual savings</span></div>
            <div className="modal-actions"><button className="btn" disabled={saving} onClick={() => setSaveOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={saving || !scenarioName.trim()} onClick={handleSaveScenario}>{saving ? <><span className="spinner"/> Saving...</> : <><Save size={18}/> Save Scenario</>}</button></div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ icon, tone, label, value, badge }: { icon: React.ReactNode; tone: "green"|"purple"|"gold"; label: React.ReactNode; value: string; badge?: string }) {
  return <div className="metric-card"><div className="metric-top"><div className={`metric-icon ${tone}`}>{icon}</div><div>{label}</div></div><div className="metric-value">{value}{badge && <span className="mini-pill">{badge}</span>}</div></div>;
}
