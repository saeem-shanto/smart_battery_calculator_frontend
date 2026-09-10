"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, FileText, LoaderCircle, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { InlineIssue, ValidationSummary } from "@/components/ValidationSummary";
import { analyzeCsv, getLoadProfiles } from "@/lib/api";
import { getDraft, saveDraft } from "@/lib/draft";
import { errorsOnly, validateLoadSolarInput, warningsOnly } from "@/lib/validation";
import type { CsvSummary, LoadProfile, UsagePattern } from "@/lib/types";

const fallbackProfiles: LoadProfile[] = [
  { id: "typical-adelaide", name: "Typical Adelaide Home", description: "Balanced household consumption with morning and evening peaks.", dailyUsageKWh: 18, pattern: "balanced" },
  { id: "evening-heavy", name: "Evening Heavy Usage", description: "Higher consumption after 4 pm.", dailyUsageKWh: 24, pattern: "evening-heavy" },
  { id: "daytime-heavy", name: "High Daytime Usage", description: "Higher consumption while solar is generating.", dailyUsageKWh: 28, pattern: "daytime-heavy" },
];

type Mode = "csv" | "manual" | "sample";

export default function LoadSolarPage() {
  const [mode, setMode] = useState<Mode>("manual");
  const [profiles, setProfiles] = useState<LoadProfile[]>(fallbackProfiles);
  const [sampleProfileId, setSampleProfileId] = useState(fallbackProfiles[0].id);
  const [csvSummary, setCsvSummary] = useState<CsvSummary | null>(null);
  const [manualDailyUsage, setManualDailyUsage] = useState("18");
  const [manualPattern, setManualPattern] = useState<UsagePattern>("balanced");
  const [pvSize, setPvSize] = useState("6.6");
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    if (draft.loadMode) setMode(draft.loadMode);
    if (draft.sampleProfileId) setSampleProfileId(draft.sampleProfileId);
    if (draft.csvSummary) setCsvSummary(draft.csvSummary);
    if (draft.manualDailyUsageKWh !== undefined) setManualDailyUsage(String(draft.manualDailyUsageKWh));
    if (draft.manualPattern) setManualPattern(draft.manualPattern);
    if (draft.pvSize !== undefined) setPvSize(String(draft.pvSize));

    getLoadProfiles().then((data) => {
      if (!data.profiles.length) return;
      setProfiles(data.profiles);
      if (!draft.sampleProfileId) setSampleProfileId(data.profiles[0].id);
    }).catch(() => undefined);
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === sampleProfileId) ?? profiles[0],
    [profiles, sampleProfileId],
  );

  const issues = useMemo(() => validateLoadSolarInput({
    mode,
    csvSummary,
    manualDailyUsage,
    manualPattern,
    selectedProfile,
    pvSize,
  }), [mode, csvSummary, manualDailyUsage, manualPattern, selectedProfile, pvSize]);

  const visibleIssues = useMemo(() => [
    ...(submitted ? errorsOnly(issues) : []),
    ...warningsOnly(issues),
  ], [issues, submitted]);

  function switchMode(next: Mode) {
    setMode(next);
    setFileError("");
    setSubmitted(false);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError("");
    const extensionOkay = file.name.toLowerCase().endsWith(".csv");
    const mimeOkay = !file.type || file.type === "text/csv" || file.type === "application/vnd.ms-excel" || file.type === "text/plain";
    if (!extensionOkay) return setFileError("Only .csv files are accepted.");
    if (!mimeOkay) return setFileError("This file does not appear to be a CSV. Export it as CSV and try again.");
    if (file.size === 0) return setFileError("The selected CSV is empty.");
    if (file.size > 5_000_000) return setFileError("CSV files must be smaller than 5 MB in this prototype.");

    setAnalyzing(true);
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error("The selected CSV is empty.");
      const response = await analyzeCsv(file.name, text);
      setCsvSummary(response.summary);
      setMode("csv");
    } catch (err) {
      setCsvSummary(null);
      setFileError(err instanceof Error ? err.message : "Could not analyse the CSV.");
    } finally {
      setAnalyzing(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (fileError || errorsOnly(issues).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const pv = Number(pvSize);
    const manualKWh = Number(manualDailyUsage);
    saveDraft({
      loadMode: mode,
      fileName: mode === "csv" ? csvSummary?.fileName : undefined,
      csvSummary: mode === "csv" ? csvSummary ?? undefined : undefined,
      manualDailyUsageKWh: mode === "manual" ? manualKWh : undefined,
      manualPattern: mode === "manual" ? manualPattern : undefined,
      sampleProfileId: mode === "sample" ? selectedProfile?.id : undefined,
      sampleProfile: mode === "sample" ? selectedProfile?.name : undefined,
      sampleDailyUsageKWh: mode === "sample" ? selectedProfile?.dailyUsageKWh : undefined,
      pvSize: pv,
    });
    window.location.assign("/calculator/tariff");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 1 of 4</p></div>
        <StepIndicator current={1} />
        {fileError && <div className="validation-summary error" role="alert"><div><strong>CSV error:</strong><div>{fileError}</div></div></div>}
        <ValidationSummary issues={visibleIssues} />

        <section className="section-card">
          <h2 className="section-title">1. Load Profile (Electricity Usage)</h2>
          <p className="section-subtitle">Upload interval data, enter simple household usage, or use a demo profile.</p>

          <div className={`option-card ${mode === "csv" ? "selected" : ""}`} onClick={() => switchMode("csv")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") switchMode("csv"); }}>
            <input aria-label="Upload CSV mode" type="radio" name="mode" checked={mode === "csv"} onChange={() => switchMode("csv")} />
            <span className="option-content"><strong>Upload my data (CSV)</strong><span>{csvSummary ? `Ready: ${csvSummary.fileName}` : "Upload electricity usage data such as smart-meter interval readings."}</span></span>
            <label className={`btn btn-outline-green ${analyzing ? "disabled" : ""}`} htmlFor="csv-file" onClick={(e) => e.stopPropagation()}>
              {analyzing ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />} {analyzing ? "Analyzing..." : "Upload CSV"}
            </label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={onFile} hidden disabled={analyzing} />
          </div>
          {mode === "csv" && <InlineIssue issues={visibleIssues} field="csv" />}

          {mode === "csv" && csvSummary && (
            <div className="upload-summary" aria-live="polite"><CheckCircle2 size={19} /><div><strong>{csvSummary.fileName}</strong><span>{csvSummary.rowCount.toLocaleString()} rows · {csvSummary.totalKWh.toLocaleString()} kWh in file · estimated {csvSummary.averageDailyKWh.toLocaleString()} kWh/day</span></div></div>
          )}

          <div className={`option-card ${mode === "manual" ? "selected" : ""}`} onClick={() => switchMode("manual")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") switchMode("manual"); }}>
            <input aria-label="Simple data mode" type="radio" name="mode" checked={mode === "manual"} onChange={() => switchMode("manual")} />
            <span className="option-content"><strong>Enter simple household data</strong><span>No CSV required. Enter average daily electricity use and a general usage pattern.</span></span>
          </div>

          {mode === "manual" && (
            <div className="simple-data-grid">
              <div className="field">
                <label htmlFor="daily-usage">Average Daily Electricity Usage</label>
                <div className="input-wrap"><input id="daily-usage" className={`input has-unit ${visibleIssues.some((i) => i.field === "manualDailyUsage" && i.level === "error") ? "input-error" : ""}`} type="number" min="1" max="100" step="0.1" value={manualDailyUsage} onChange={(e) => { setManualDailyUsage(e.target.value); }} /><span className="input-unit">kWh/day</span></div>
                <div className="field-help">If you only know monthly usage, divide it by about 30.</div>
                <InlineIssue issues={visibleIssues} field="manualDailyUsage" />
              </div>
              <div className="field">
                <label htmlFor="usage-pattern">Typical Usage Pattern</label>
                <select id="usage-pattern" className="input" value={manualPattern} onChange={(e) => setManualPattern(e.target.value as UsagePattern)}>
                  <option value="balanced">Balanced — morning & evening use</option>
                  <option value="evening-heavy">Evening-heavy — more use after 4 pm</option>
                  <option value="daytime-heavy">Daytime-heavy — more use while solar generates</option>
                </select>
                <InlineIssue issues={visibleIssues} field="manualPattern" />
              </div>
            </div>
          )}

          <div className={`option-card compact-option ${mode === "sample" ? "selected" : ""}`} onClick={() => switchMode("sample")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") switchMode("sample"); }}>
            <input aria-label="Sample profile mode" type="radio" name="mode" checked={mode === "sample"} onChange={() => switchMode("sample")} />
            <span className="option-content"><strong>Use a sample profile</strong><span>Quick demo data for testing the complete flow.</span></span>
          </div>

          {mode === "sample" && selectedProfile && (
            <div className="field sample-select">
              <label htmlFor="sample-profile">Sample Profile</label>
              <select id="sample-profile" className="input" value={sampleProfileId} onChange={(e) => setSampleProfileId(e.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select>
              <div className="field-help">{selectedProfile.description} Demo average: <strong>{selectedProfile.dailyUsageKWh} kWh/day</strong>.</div>
              <InlineIssue issues={visibleIssues} field="sampleProfile" />
            </div>
          )}

          <details className="format-details" id="data-format">
            <summary>Learn more about CSV data format <ExternalLink size={15} /></summary>
            <div><FileText size={17} /><p>A CSV needs a header and a numeric usage column such as <code>kWh</code>, <code>Usage</code>, <code>Energy</code> or <code>Consumption</code>. Negative values, empty files, unsupported columns, and files above 5 MB are rejected. <a className="inline-link" href="/sample-electricity-usage.csv" download>Download the sample CSV</a>.</p></div>
          </details>
        </section>

        <section className="section-card">
          <h2 className="section-title">2. Solar PV System</h2>
          <p className="section-subtitle">Enter your existing or planned solar system size.</p>
          <div className="field">
            <label htmlFor="pv">PV System Size (kW)</label>
            <div className="input-wrap"><input id="pv" className={`input has-unit ${visibleIssues.some((i) => i.field === "pvSize" && i.level === "error") ? "input-error" : ""}`} type="number" min="1" max="30" step="0.1" value={pvSize} onChange={(e) => { setPvSize(e.target.value); }} placeholder="e.g. 6.6" /><span className="input-unit">kW</span></div>
            <div className="field-help">Allowed demo range: 1–30 kW.</div>
            <InlineIssue issues={visibleIssues} field="pvSize" />
          </div>
        </section>

        <div className="button-row"><span /><button className="btn btn-primary btn-lg" type="submit" disabled={analyzing}>Next: Tariff <ArrowRight size={19} /></button></div>
      </form>
    </AppShell>
  );
}
