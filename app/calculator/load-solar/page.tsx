"use client";

import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { getDraft, saveDraft } from "@/lib/draft";
import { clearDraftFile, getDraftFile, saveDraftFile } from "@/lib/file-store";
import { getApiFieldMessage, validateClientWorkbook } from "@/lib/api";
import type { WorkbookValidationResponse } from "@/lib/types";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";

const configuredMaxMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 15);
const MAX_MB = Number.isFinite(configuredMaxMb) && configuredMaxMb > 0 ? configuredMaxMb : 15;
type FieldErrors = { file?: string; postcode?: string };

export default function LoadSolarPage() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [postcode, setPostcode] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("SA");
  const [retainData, setRetainData] = useState(false);
  const [validation, setValidation] = useState<WorkbookValidationResponse | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadRef = useRef<HTMLLabelElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = getDraft();
    setFileName(draft.inputFileName || "");
    setFileSize(draft.inputFileSize || 0);
    setPostcode(draft.postcode || "");
    setSuburb(draft.suburb || "");
    setState(draft.state || "SA");
    setRetainData(draft.retainData === true);
    setValidation(draft.workbookValidation || null);

    getDraftFile()
      .then((file) => {
        if (!file) return;
        setFileName(file.name);
        setFileSize(file.size);
        if (draft.workbookValidation?.original_name !== file.name || draft.inputFileSize !== file.size) setValidation(null);
      })
      .catch(() => undefined);
  }, []);

  function reveal(element: HTMLElement | null) {
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element.focus({ preventScroll: true }), 250);
  }

  function localFileError(file: File) {
    const extension = file.name.toLowerCase().split(".").pop();
    if (!["xls", "xlsx", "csv", "txt"].includes(extension || "")) return "Upload an XLS, XLSX, CSV, or TXT profile file.";
    if (file.size === 0) return "The selected file is empty.";
    if (file.size > MAX_MB * 1024 * 1024) return `File must be ${MAX_MB} MB or smaller.`;
    return "";
  }

  async function clearSelectedFile(preserveError = false) {
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
    setFileName("");
    setFileSize(0);
    setValidation(null);
    if (!preserveError) setErrors((current) => ({ ...current, file: undefined }));
    saveDraft({
      inputFileName: undefined,
      inputFileSize: undefined,
      workbookValidation: undefined,
      publicId: undefined,
      accessToken: undefined,
    });
  }

  async function validateAndStore(file: File): Promise<boolean> {
    setSaving(true);
    clearCachedTransientResult();
    setErrors((current) => ({ ...current, file: undefined }));
    setValidation(null);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const checked = await validateClientWorkbook(file);
      await saveDraftFile(file);
      setValidation(checked);
      saveDraft({
        inputFileName: file.name,
        inputFileSize: file.size,
        workbookValidation: checked,
        publicId: undefined,
        accessToken: undefined,
      });
      return true;
    } catch (error) {
      const message = getApiFieldMessage(error, "file") || (error instanceof Error ? error.message : "The workbook could not be validated.");
      await clearDraftFile().catch(() => undefined);
      setValidation(null);
      setErrors((current) => ({ ...current, file: message }));
      saveDraft({
        inputFileName: undefined,
        inputFileSize: undefined,
        workbookValidation: undefined,
        publicId: undefined,
        accessToken: undefined,
      });
      reveal(uploadRef.current);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function acceptFile(file: File) {
    const message = localFileError(file);
    if (message) {
      await clearSelectedFile(true);
      setFileName(file.name);
      setFileSize(file.size);
      setErrors((current) => ({ ...current, file: message }));
      reveal(uploadRef.current);
      return;
    }
    await validateAndStore(file);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await acceptFile(file);
  }

  async function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (saving) return;
    const file = event.dataTransfer.files?.[0];
    if (file) await acceptFile(file);
  }

  function openPicker(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    fileInputRef.current?.click();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const file = await getDraftFile().catch(() => null);

    if (!file || !fileName) nextErrors.file = "Choose the household/PV input file first.";
    if (postcode && !/^\d{4}$/.test(postcode)) nextErrors.postcode = "Postcode must be a 4-digit Australian postcode.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.file) reveal(uploadRef.current);
      else if (nextErrors.postcode) reveal(postcodeRef.current);
      return;
    }

    if (file && !validation) {
      const valid = await validateAndStore(file);
      if (!valid) return;
    }

    setErrors({});
    saveDraft({
      inputFileName: fileName,
      inputFileSize: fileSize,
      postcode: postcode.trim(),
      suburb: suburb.trim(),
      state: state.trim(),
      retainData,
      consent: undefined,
      publicId: undefined,
      accessToken: undefined,
    });
    window.location.assign("/calculator/tariff");
  }

  const ready = Boolean(fileName && validation && !saving && !errors.file);

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 1 of 4 · Add the annual profile and optional record details.</p></div>
        <StepIndicator current={1} />

        <section className="section-card">
          <div className="section-heading-row">
            <div>
              <h2 className="section-title">Upload annual load &amp; PV data</h2>
              <p className="section-subtitle">The client algorithm uses the first column as the base PV profile and the second column as household load. A complete annual profile is required.</p>
            </div>
            {validation && <span className="status-pill status-completed">Validated</span>}
          </div>

          <label
            ref={uploadRef}
            className={`production-upload ${dragging ? "is-dragging" : ""} ${errors.file ? "input-error" : ""}`}
            htmlFor="profile-file"
            tabIndex={0}
            aria-invalid={Boolean(errors.file)}
            aria-describedby={errors.file ? "profile-file-error" : validation ? "profile-file-success" : "profile-file-help"}
            onKeyDown={openPicker}
            onDragEnter={(event) => { event.preventDefault(); if (!saving) setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={(event) => void onDrop(event)}
          >
            <div className="production-upload-icon"><Upload size={26} /></div>
            <div>
              <strong>{fileName || (dragging ? "Drop file to validate" : "Choose or drop input file")}</strong>
              <span id="profile-file-help">
                {fileName
                  ? `${(fileSize / 1024).toFixed(1)} KB · ${saving ? "validating with backend…" : validation ? "validated and ready" : "not validated"}`
                  : `Accepted: .xls, .xlsx, .csv, .txt · up to ${MAX_MB} MB`}
              </span>
            </div>
            <span className="btn btn-outline-green" aria-hidden="true">{saving ? "Validating…" : fileName ? "Replace File" : "Select File"}</span>
          </label>
          <input ref={fileInputRef} id="profile-file" type="file" accept=".xls,.xlsx,.csv,.txt" hidden onChange={onFile} disabled={saving} />
          {errors.file && <div id="profile-file-error" className="field-message error" role="alert">{errors.file}</div>}

          {fileName && !saving && (
            <div className="file-inline-actions">
              <span>{validation ? "This file is ready for the next step." : "This file must be validated before continuing."}</span>
              <button className="text-button" type="button" onClick={() => void clearSelectedFile()} disabled={saving}>Remove file</button>
            </div>
          )}

          {validation && (
            <div id="profile-file-success" className="upload-summary upload-summary-valid" role="status" aria-live="polite">
              <CheckCircle2 size={19} />
              <div>
                <strong>Workbook validated</strong>
                <span>{validation.row_count.toLocaleString()} usable rows · {validation.detected_format.toUpperCase()}{validation.profile_is_full_year ? " · complete annual profile" : ""}</span>
                {validation.warnings.length > 0 && <small>{validation.warnings.join(" ")}</small>}
              </div>
            </div>
          )}
        </section>

        <section className="section-card">
          <h2 className="section-title">Location &amp; record information</h2>
          <p className="section-subtitle">These fields do not change the optimisation. If retention is enabled, they help identify the calculation later.</p>
          <div className="form-grid">
            <div className={`field${errors.postcode ? " has-error" : ""}`}>
              <label htmlFor="postcode">Postcode <span className="optional-label">Optional</span></label>
              <input
                ref={postcodeRef}
                id="postcode"
                className={`input ${errors.postcode ? "input-error" : ""}`}
                inputMode="numeric"
                maxLength={4}
                value={postcode}
                aria-invalid={Boolean(errors.postcode)}
                aria-describedby={errors.postcode ? "postcode-error" : "postcode-help"}
                onBlur={() => { if (postcode && !/^\d{4}$/.test(postcode)) setErrors((current) => ({ ...current, postcode: "Postcode must be a 4-digit Australian postcode." })); }}
                onChange={(event) => { setPostcode(event.target.value.replace(/\D/g, "")); setErrors((current) => ({ ...current, postcode: undefined })); }}
                placeholder="e.g. 5000"
              />
              <div id="postcode-help" className="field-help">Used only as searchable record information.</div>
              {errors.postcode && <div id="postcode-error" className="field-message error" role="alert">{errors.postcode}</div>}
            </div>
            <div className="field">
              <label htmlFor="suburb">Suburb <span className="optional-label">Optional</span></label>
              <input id="suburb" className="input" maxLength={120} value={suburb} onChange={(event) => setSuburb(event.target.value)} placeholder="e.g. Adelaide" autoComplete="address-level2" />
              <div className="field-help">Helps you recognise saved calculations later.</div>
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <select id="state" className="input" value={state} onChange={(event) => setState(event.target.value)} autoComplete="address-level1">
                <option>SA</option><option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option><option>TAS</option><option>ACT</option><option>NT</option>
              </select>
            </div>
          </div>
        </section>

        <section className="section-card retention-section">
          <div className="retention-heading">
            <div>
              <h2 className="section-title">Privacy &amp; data retention</h2>
              <p className="section-subtitle">Saving is optional. The calculator can return a result without keeping your household file on the backend.</p>
            </div>
            <ShieldCheck size={24} />
          </div>
          <label className={`consent-row retention-toggle ${retainData ? "selected" : ""}`}>
            <input type="checkbox" checked={retainData} onChange={(event) => setRetainData(event.target.checked)} />
            <span>
              <strong>Save my uploaded file and calculation for later access.</strong>
              <small>If enabled, the backend retains the input, calculation record and canonical result CSV. If disabled, processing is transient and no calculation/file record is stored server-side. The selected workbook is kept temporarily in this browser while you move between steps or retry.</small>
            </span>
            <span className={`retention-state ${retainData ? "on" : "off"}`}>{retainData ? "ON" : "OFF"}</span>
          </label>
        </section>

        <div className={`notice workflow-readiness ${ready ? "ready" : ""}`} role="status">
          <FileSpreadsheet size={17} />
          <span>
            {!ready
              ? saving ? "Validating the selected workbook before you can continue…" : "Validate an annual workbook to continue."
              : retainData
                ? "Ready to continue. Retention is ON, so the backend will keep the input and result artifacts after calculation."
                : "Ready to continue. Retention is OFF, so the backend will process the workbook without saving a calculation/file record."}
          </span>
        </div>

        <div className="button-row">
          <span />
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? "Validating…" : "Next: Algorithm"} <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </AppShell>
  );
}
