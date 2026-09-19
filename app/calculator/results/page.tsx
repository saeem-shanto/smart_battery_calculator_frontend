"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BatteryCharging,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Gauge,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { BillComparisonChart } from "@/components/Charts";
import { clearDraft, getDraft, saveDraft } from "@/lib/draft";
import { clearDraftFile, getDraftFile } from "@/lib/file-store";
import {
  downloadCalculationFile,
  downloadTransientCsv,
  getCalculation,
  runWorkbookCalculation,
} from "@/lib/api";
import { getHistoryItem, saveCalculationHistory } from "@/lib/calculation-history";
import type { CalculationResponse } from "@/lib/types";

export default function ResultsPage() {
  const [data, setData] = useState<CalculationResponse | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("id");
        if (requested) {
          const item = getHistoryItem(requested);
          const response = await getCalculation(requested, item?.accessToken);
          if (cancelled) return;
          setData(response);
          setToken(item?.accessToken || "");
          return;
        }

        const draft = getDraft();
        if (draft.publicId) {
          const response = await getCalculation(draft.publicId, draft.accessToken);
          if (cancelled) return;
          setData(response);
          setToken(draft.accessToken || "");
          if (draft.accessToken) saveCalculationHistory(response, draft.accessToken);
          return;
        }

        const file = await getDraftFile();
        if (!file) throw new Error("The uploaded input file is no longer available. Return to Step 1 and select it again.");

        const response = await runWorkbookCalculation(draft, file);
        if (cancelled) return;
        setData(response);

        if (response.retained) {
          const publicId = response.public_id;
          const access = response.access_token;
          if (!publicId || !access) throw new Error("The backend retained the calculation but did not return its private access credentials.");
          setToken(access);
          saveDraft({ publicId, accessToken: access });
          saveCalculationHistory(response, access);
        } else {
          setToken("");
          saveDraft({ publicId: undefined, accessToken: undefined });
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "The calculation could not be completed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const result = data?.result;
  const location = useMemo(
    () => [data?.suburb, data?.state, data?.postcode].filter(Boolean).join(", "),
    [data],
  );

  async function downloadStored(fileId: string, name: string) {
    if (!data?.public_id) return;
    setDownloading(fileId);
    try {
      await downloadCalculationFile(data.public_id, fileId, token, name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed.");
    } finally {
      setDownloading("");
    }
  }

  function downloadTransient() {
    if (!data?.transient_csv) return;
    try {
      downloadTransientCsv(
        data.transient_csv.base64_data,
        data.transient_csv.filename,
        data.transient_csv.content_type,
      );
    } catch {
      setError("The transient CSV could not be prepared for download.");
    }
  }

  async function startNew() {
    clearDraft();
    await clearDraftFile();
    window.location.assign("/calculator/load-solar");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 4 of 4</p></div>
        <StepIndicator current={4} />
        <div className="calculation-loading">
          <span className="spinner-dark" />
          <h2>Running the battery optimisation…</h2>
          <p>The backend is processing the annual profile with GNU Octave. Please keep this page open.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="step-heading"><h1>Calculation Results</h1><p>Step 4 of 4</p></div>
      <StepIndicator current={4} />

      {error && (
        <div className="error-box" role="alert">
          <strong>Calculation error</strong>
          <span>{error}</span>
          <button className="btn btn-small" onClick={() => window.location.assign("/calculator/load-solar")}>
            <RefreshCcw size={16} /> Return to Step 1
          </button>
        </div>
      )}

      {data && result && (
        <>
          <div className={`retention-result-banner ${data.retained ? "retained" : "transient"}`}>
            <ShieldCheck size={19} />
            <div>
              <strong>{data.retained ? "Saved calculation" : "Private transient calculation"}</strong>
              <span>
                {data.retained
                  ? "The input and result artifacts were retained by the backend for later access."
                  : "The backend processed this request without creating a calculation record or storing the uploaded file/results."}
              </span>
            </div>
          </div>

          <section className="metrics-grid">
            <Metric icon={<BatteryCharging size={23} />} tone="green" label="Recommended Battery" value={`${result.optimal_battery_size_kwh.toFixed(2)} kWh`} />
            <Metric icon={<BarChart3 size={23} />} tone="purple" label="Annual Bill Reduction" value={`$${result.estimated_annual_bill_reduction_aud.toFixed(2)}`} badge={`${result.estimated_annual_bill_reduction_percent.toFixed(1)}%`} />
            <Metric icon={<CircleDollarSign size={23} />} tone="gold" label="Simple Payback" value={result.simple_payback_years === null ? "N/A" : `${result.simple_payback_years.toFixed(1)} yr`} />
            <Metric icon={<Gauge size={23} />} tone="purple" label="Net Annual Payment" value={`$${result.net_annual_payment_aud.toFixed(2)}`} />
          </section>

          <section className="charts-grid single-chart">
            <BillComparisonChart withoutBattery={result.baseline_annual_payment_aud} withBattery={result.net_annual_payment_aud} />
            <div className="card result-summary-panel">
              <div className="card-header"><h2>Energy Summary</h2></div>
              <div className="result-summary-list">
                <Summary label="Annual load" value={`${result.annual_load_kwh.toLocaleString()} kWh`} />
                <Summary label="Annual PV generation" value={`${result.annual_pv_generation_kwh.toLocaleString()} kWh`} />
                <Summary label="Grid import" value={`${result.import_from_grid_kwh_year.toLocaleString()} kWh`} />
                <Summary label="Grid export" value={`${result.export_to_grid_kwh_year.toLocaleString()} kWh`} />
                <Summary label="Self-consumption" value={`${result.baseline_self_consumption_percent.toFixed(1)}% → ${result.self_consumption_percent.toFixed(1)}%`} />
                <Summary label="Battery upfront cost" value={`$${result.battery_upfront_cost_aud.toLocaleString()}`} />
              </div>
            </div>
          </section>

          <section className="card page-card-space">
            <div className="card-header">
              <div>
                <h2>{data.retained ? "Calculation Record" : "Calculation Details"}</h2>
                <p className="admin-card-subtitle">
                  {data.retained
                    ? "Saved in the backend with its unique input and canonical CSV."
                    : "Displayed from this transient response; no backend calculation record was created."}
                </p>
              </div>
            </div>
            <div className="result-details-grid">
              <Detail label="Input file" value={data.input_filename || "—"} />
              <Detail label="Location" value={location || "Not provided"} />
              <Detail label="Retention" value={data.retained ? "Saved" : "Not saved"} />
              <Detail label="Runtime" value={`${data.runtime_ms} ms`} />
              <Detail label="Engine" value={data.algorithm_version || result.engine} />
              <Detail label="PV size" value={`${result.pv_size_kw} kW`} />
              <Detail label="Profile duration" value={`${result.profile_duration_hours.toLocaleString()} hours`} />
            </div>
            {data.warnings.length > 0 && <div className="notice"><strong>Warnings:</strong> {data.warnings.join(" ")}</div>}
          </section>

          <section className="card page-card-space">
            <div className="card-header">
              <div>
                <h2>Downloads</h2>
                <p className="admin-card-subtitle">
                  {data.retained
                    ? (token
                        ? "Stored artifacts are protected by this guest calculation's private browser token."
                        : "Stored artifacts are protected by your signed-in account session.")
                    : "The canonical result CSV is returned inline for this transient calculation and is not stored by the backend."}
                </p>
              </div>
            </div>
            <div className="download-grid">
              {data.retained && data.files.map((file) => (
                <button
                  className="download-card"
                  key={file.id}
                  disabled={downloading === file.id}
                  onClick={() => downloadStored(file.id, file.filename)}
                >
                  <FileSpreadsheet size={22} />
                  <span>
                    <strong>{file.filename}</strong>
                    <small>{file.kind === "legacy_csv" ? "Canonical result CSV" : "Original uploaded input"} · {(file.size_bytes / 1024).toFixed(1)} KB</small>
                  </span>
                  <Download size={18} />
                </button>
              ))}

              {!data.retained && data.transient_csv && (
                <button className="download-card" onClick={downloadTransient}>
                  <FileSpreadsheet size={22} />
                  <span>
                    <strong>{data.transient_csv.filename}</strong>
                    <small>Transient canonical result CSV · {(data.transient_csv.size_bytes / 1024).toFixed(1)} KB</small>
                  </span>
                  <Download size={18} />
                </button>
              )}
            </div>
          </section>

          {!data.retained && (
            <div className="notice privacy-notice">
              <strong>Privacy note:</strong>&nbsp; This result will not appear in My Calculations because the backend did not retain it. Download the CSV before leaving if you need a copy.
            </div>
          )}

          <div className="notice"><strong>Algorithm integrity:</strong> {result.algorithm_source} · SHA-256 {result.algorithm_sha256.slice(0, 16)}…</div>
          <div className="button-row">
            <button
              className="btn"
              onClick={() => window.location.assign(data.retained ? "/results-history" : "/calculator/load-solar")}
            >
              <ArrowLeft size={18} /> {data.retained ? "My Calculations" : "Back to Inputs"}
            </button>
            <button className="btn btn-primary btn-lg" onClick={startNew}>New Calculation <ArrowRight size={18} /></button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Metric({ icon, tone, label, value, badge }: { icon: React.ReactNode; tone: "green" | "purple" | "gold"; label: string; value: string; badge?: string }) {
  return <div className="metric-card"><div className="metric-top"><div className={`metric-icon ${tone}`}>{icon}</div><div>{label}</div></div><div className="metric-value">{value}{badge && <span className="mini-pill">{badge}</span>}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="result-detail-card"><span>{label}</span><strong>{value}</strong></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div>;
}
