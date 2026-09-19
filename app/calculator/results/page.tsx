"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ApiRequestError,
} from "@/lib/api";
import { getHistoryItem, removeHistoryItem, saveCalculationHistory } from "@/lib/calculation-history";
import { isCompleteBatteryResult, type CalculationResponse } from "@/lib/types";
import { clearCachedTransientResult, getCachedTransientResult, hasTransientAttempt, markTransientAttempt, saveCachedTransientResult, transientFingerprint } from "@/lib/transient-result-cache";

export default function ResultsPage() {
  const [data, setData] = useState<CalculationResponse | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAttempt = useRef<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    setElapsedSeconds(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, attempt]);

  useEffect(() => {
    if (!loading) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [loading]);

  useEffect(() => {
    // React Strict Mode intentionally re-runs effects in development. Without
    // this guard the annual Octave optimisation can be submitted twice.
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;

    (async () => {
      try {
        setError("");
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("id");
        if (requested) {
          const item = getHistoryItem(requested);
          const response = await getCalculation(requested, item?.accessToken);
          setData(response);
          setToken(item?.accessToken || "");
          return;
        }

        const draft = getDraft();
        if (draft.publicId) {
          const response = await getCalculation(draft.publicId, draft.accessToken);
          setData(response);
          setToken(draft.accessToken || "");
          if (draft.accessToken) saveCalculationHistory(response, draft.accessToken);
          return;
        }

        const fingerprint = transientFingerprint(draft);
        if (!draft.retainData) {
          const cached = getCachedTransientResult(fingerprint);
          if (cached) {
            setData(cached);
            setToken("");
            return;
          }
          if (hasTransientAttempt(fingerprint)) {
            throw new Error("The previous private result is no longer available in this browser. Use Retry Calculation to run the optimisation again.");
          }
          markTransientAttempt(fingerprint);
        }

        const file = await getDraftFile();
        if (!file) throw new Error("The uploaded input file is no longer available. Return to Step 1 and select it again.");

        const response = await runWorkbookCalculation(draft, file);
        setData(response);

        if (response.retained) {
          const publicId = response.public_id;
          if (!publicId) throw new Error("The backend retained the calculation but did not return its calculation ID.");

          // Guest retained calculations receive a private access token.
          // Account-owned retained calculations intentionally do not: future
          // access is authorized by the signed-in user's Django JWT session.
          const access = response.access_token || "";
          setToken(access);
          saveDraft({ publicId, accessToken: access || undefined });
          if (access) saveCalculationHistory(response, access);
          else removeHistoryItem(publicId);
        } else {
          setToken("");
          saveDraft({ publicId: undefined, accessToken: undefined });
          saveCachedTransientResult(fingerprint, response);
        }
      } catch (caught) {
        setError(calculationErrorMessage(caught));
      } finally {
        setLoading(false);
      }
    })();
  }, [attempt]);

  function retryCalculation() {
    clearCachedTransientResult();
    setData(null);
    setToken("");
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  const result = data?.status === "completed" && isCompleteBatteryResult(data.result) ? data.result : null;
  const location = useMemo(
    () => [data?.suburb, data?.state, data?.postcode].filter(Boolean).join(", "),
    [data],
  );

  async function downloadStored(fileId: string, name: string) {
    if (!data?.public_id) return;
    setDownloading(fileId);
    setDownloadError("");
    try {
      await downloadCalculationFile(data.public_id, fileId, token, name);
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : "Download failed.");
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
      setDownloadError("The transient CSV could not be prepared for download.");
    }
  }

  async function startNew() {
    clearDraft();
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
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
          <p>The backend is processing the annual profile with GNU Octave. Please keep this page open and avoid refreshing.</p>
          <div className="calculation-progress-copy">
            <strong>{elapsedSeconds < 60 ? `${elapsedSeconds}s elapsed` : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s elapsed`}</strong>
            <span>
              {elapsedSeconds < 45
                ? "Preparing and optimising the full-year profile…"
                : elapsedSeconds < 120
                  ? "The optimisation is still running. Render cold starts and annual profiles can take longer."
                  : "This is taking longer than usual, but the request is still active. The page will update when the backend responds."}
            </span>
          </div>
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
          <div className="calculation-error-actions">
            <button className="btn btn-small btn-primary" onClick={retryCalculation}>
              <RefreshCcw size={16} /> Retry Calculation
            </button>
            <button className="btn btn-small" onClick={() => window.location.assign("/calculator/battery-costs")}>
              <ArrowLeft size={16} /> Back to Battery Cost
            </button>
            <button className="btn btn-small" onClick={() => window.location.assign("/calculator/load-solar")}>
              Return to Step 1
            </button>
          </div>
        </div>
      )}


      {downloadError && (
        <div className="error-box" role="alert">
          <strong>Download error</strong>
          <span>{downloadError}</span>
        </div>
      )}

      {data && !result && !error && (
        <div className="error-box calculation-record-status" role="status">
          <strong>This calculation did not complete successfully</strong>
          <span>Backend status: {data.status}. The saved record may still contain the original input file, but there is no complete result payload to display.</span>
          <div className="calculation-error-actions">
            <button className="btn btn-small btn-primary" onClick={startNew}>New Calculation</button>
            <button className="btn btn-small" onClick={() => window.location.assign("/results-history")}><ArrowLeft size={16}/> My Calculations</button>
          </div>
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

function calculationErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 502) {
      return `${error.message} The workbook passed validation, so the failure occurred while the calculation engine was running. Your inputs are still available and you can retry without uploading again.`;
    }
    if (error.status === 503 || error.status === 504) {
      return `${error.message} Your inputs are still available; wait for the backend to recover and retry.`;
    }
    if (error.status === 401) return "Your account session expired. Sign in again, then retry the calculation.";
    if (error.status === 403) return "This saved calculation is not accessible with the current account or guest token.";
  }
  return error instanceof Error ? error.message : "The calculation could not be completed.";
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
