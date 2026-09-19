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
import {
  clearCachedTransientResult,
  getCachedTransientResult,
  hasTransientAttempt,
  markTransientAttempt,
  saveCachedTransientResult,
  transientFingerprint,
} from "@/lib/transient-result-cache";

type CalculationErrorState = {
  message: string;
  status?: number;
  code?: string;
};

const debugEnabled = process.env.NEXT_PUBLIC_APP_DEBUG === "true";

export default function ResultsPage() {
  const [data, setData] = useState<CalculationResponse | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<CalculationErrorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAttempt = useRef<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    setElapsedSeconds(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
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
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;

    (async () => {
      try {
        setError(null);
        setDownloadError("");
        setDownloadSuccess("");
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
        setError(calculationErrorState(caught));
      } finally {
        setLoading(false);
      }
    })();
  }, [attempt]);

  function retryCalculation() {
    clearCachedTransientResult();
    setData(null);
    setToken("");
    setError(null);
    setDownloadError("");
    setDownloadSuccess("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  const result = data?.status === "completed" && isCompleteBatteryResult(data.result) ? data.result : null;
  const location = useMemo(() => [data?.suburb, data?.state, data?.postcode].filter(Boolean).join(", "), [data]);
  const draft = typeof window !== "undefined" ? getDraft() : {};

  async function downloadStored(fileId: string, name: string) {
    if (!data?.public_id) return;
    setDownloading(fileId);
    setDownloadError("");
    setDownloadSuccess("");
    try {
      await downloadCalculationFile(data.public_id, fileId, token, name);
      setDownloadSuccess(`${name} download started.`);
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : "Download failed.");
    } finally {
      setDownloading("");
    }
  }

  function downloadTransient() {
    if (!data?.transient_csv) return;
    setDownloadError("");
    setDownloadSuccess("");
    try {
      downloadTransientCsv(data.transient_csv.base64_data, data.transient_csv.filename, data.transient_csv.content_type);
      setDownloadSuccess(`${data.transient_csv.filename} download started.`);
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
        <div className="step-heading"><h1>New Calculation</h1><p>Step 4 of 4 · Running the annual optimisation.</p></div>
        <StepIndicator current={4} />
        <div className="calculation-loading" role="status" aria-live="polite">
          <span className="spinner-dark" aria-hidden="true" />
          <h2>Running the battery optimisation…</h2>
          <p>The backend is processing the annual profile with GNU Octave. Keep this page open; refreshing can interrupt your view of the result.</p>
          <div className="calculation-progress-copy">
            <strong>{formatElapsed(elapsedSeconds)}</strong>
            <span>{loadingMessage(elapsedSeconds)}</span>
          </div>
          <div className="calculation-context-inline">
            <span><strong>Input:</strong> {draft.inputFileName || "annual workbook"}</span>
            <span><strong>Retention:</strong> {draft.retainData ? "save result" : "transient"}</span>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="step-heading"><h1>Calculation Results</h1><p>Step 4 of 4 · Review, download, or start another scenario.</p></div>
      <StepIndicator current={4} />

      {error && (
        <div className="error-box calculation-error-panel" role="alert">
          <strong>Calculation could not be completed</strong>
          <span>{error.message}</span>
          {debugEnabled && (error.code || error.status) && (
            <div className="debug-error-details"><span>HTTP {error.status ?? "—"}</span><span>Error code: {error.code || "—"}</span></div>
          )}
          <div className="calculation-error-actions">
            <button className="btn btn-small btn-primary" onClick={retryCalculation}><RefreshCcw size={16} /> Retry Calculation</button>
            <button className="btn btn-small" onClick={() => window.location.assign("/calculator/battery-costs")}><ArrowLeft size={16} /> Back to Battery Cost</button>
            <button className="btn btn-small" onClick={() => window.location.assign("/calculator/load-solar")}>Return to Step 1</button>
          </div>
          <small className="error-preservation-note">Your workbook and current inputs remain in this browser, so retrying does not require another upload.</small>
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
              <span>{data.retained ? "The input and result artifacts were retained by the backend for later access." : "The backend processed this request without creating a calculation record or storing the uploaded file/results."}</span>
            </div>
            <span className="status-pill status-completed">Completed</span>
          </div>

          <section className="metrics-grid" aria-label="Key results">
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
            <div className="card-header"><div><h2>{data.retained ? "Calculation Record" : "Calculation Details"}</h2><p className="admin-card-subtitle">{data.retained ? "Saved in the backend with its unique input and canonical CSV." : "Displayed from this transient response; no backend calculation record was created."}</p></div></div>
            <div className="result-details-grid">
              <Detail label="Input file" value={data.input_filename || "—"} />
              <Detail label="Location" value={location || "Not provided"} />
              <Detail label="Retention" value={data.retained ? "Saved" : "Not saved"} />
              <Detail label="Runtime" value={formatRuntime(data.runtime_ms)} />
              <Detail label="Engine" value={data.algorithm_version || result.engine} />
              <Detail label="PV size" value={`${result.pv_size_kw} kW`} />
              <Detail label="Profile duration" value={`${result.profile_duration_hours.toLocaleString()} hours`} />
            </div>
            {data.warnings.length > 0 && <div className="notice result-warning"><strong>Warnings:</strong> {data.warnings.join(" ")}</div>}
          </section>

          <section className="card page-card-space">
            <div className="card-header"><div><h2>Downloads</h2><p className="admin-card-subtitle">{data.retained ? (token ? "Stored artifacts are protected by this guest calculation's private browser token." : "Stored artifacts are protected by your signed-in account session.") : "The canonical result CSV is returned inline for this transient calculation and is not stored by the backend."}</p></div></div>
            {downloadError && <div className="error-box download-feedback" role="alert"><strong>Download failed</strong><span>{downloadError}</span></div>}
            {downloadSuccess && <div className="success-box download-feedback" role="status">{downloadSuccess}</div>}
            <div className="download-grid">
              {data.retained && data.files.map((file) => (
                <button className="download-card" key={file.id} disabled={downloading === file.id} onClick={() => downloadStored(file.id, file.filename)}>
                  <FileSpreadsheet size={22} />
                  <span><strong>{file.filename}</strong><small>{file.kind === "legacy_csv" ? "Canonical result CSV" : "Original uploaded input"} · {(file.size_bytes / 1024).toFixed(1)} KB</small></span>
                  {downloading === file.id ? <span className="spinner-dark spinner-small" aria-label="Downloading"/> : <Download size={18} />}
                </button>
              ))}

              {!data.retained && data.transient_csv && (
                <button className="download-card" onClick={downloadTransient}>
                  <FileSpreadsheet size={22} />
                  <span><strong>{data.transient_csv.filename}</strong><small>Transient canonical result CSV · {(data.transient_csv.size_bytes / 1024).toFixed(1)} KB</small></span>
                  <Download size={18} />
                </button>
              )}
            </div>
          </section>

          {!data.retained && <div className="notice privacy-notice"><strong>Privacy note:</strong>&nbsp; This result will not appear in My Calculations because the backend did not retain it. Download the CSV before leaving if you need a copy.</div>}

          <div className="notice algorithm-integrity"><strong>Algorithm integrity:</strong> {result.algorithm_source} · SHA-256 {result.algorithm_sha256.slice(0, 16)}…</div>
          <div className="button-row">
            <button className="btn" onClick={() => window.location.assign(data.retained ? "/results-history" : "/calculator/load-solar")}><ArrowLeft size={18} /> {data.retained ? "My Calculations" : "Back to Inputs"}</button>
            <button className="btn btn-primary btn-lg" onClick={startNew}>New Calculation <ArrowRight size={18} /></button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function calculationErrorState(error: unknown): CalculationErrorState {
  if (error instanceof ApiRequestError) {
    let message = error.message;
    if (error.status === 502) message = `${error.message} The workbook passed validation, so the failure occurred while the calculation engine was running.`;
    else if (error.status === 503 || error.status === 504) message = `${error.message} The backend is temporarily unavailable or still recovering. Wait briefly and retry.`;
    else if (error.status === 401) message = "Your account session expired. Sign in again, then retry the calculation.";
    else if (error.status === 403) message = "This saved calculation is not accessible with the current account or guest token.";
    return { message, status: error.status, code: error.code };
  }
  return { message: error instanceof Error ? error.message : "The calculation could not be completed." };
}

function loadingMessage(elapsedSeconds: number) {
  if (elapsedSeconds < 20) return "Uploading the validated annual profile to the calculation service…";
  if (elapsedSeconds < 60) return "Preparing the annual profile and starting the optimiser…";
  if (elapsedSeconds < 120) return "The full-year optimisation is running. This can take longer on a cold backend instance.";
  if (elapsedSeconds < 240) return "The optimisation is still active. Keep this page open while the backend finishes processing.";
  return "This run is taking longer than usual. The request is still active unless the backend returns an error.";
}

function formatElapsed(seconds: number) {
  return seconds < 60 ? `${seconds}s elapsed` : `${Math.floor(seconds / 60)}m ${seconds % 60}s elapsed`;
}

function formatRuntime(milliseconds: number) {
  if (!Number.isFinite(milliseconds)) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  const seconds = milliseconds / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
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
