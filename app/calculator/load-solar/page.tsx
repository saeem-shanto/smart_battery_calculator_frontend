"use client";

import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, Upload, MapPin, Sun, Info, CircleHelp, Settings2, BarChart3, CalendarDays, Zap, X, ChevronDown, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { getDraft, saveDraft } from "@/lib/draft";
import { clearDraftFile, getDraftFile, saveDraftFile } from "@/lib/file-store";
import { getApiFieldMessage, validateClientWorkbook } from "@/lib/api";
import type { WorkbookValidationResponse } from "@/lib/types";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";

const configuredMaxMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 15);
const MAX_MB = Number.isFinite(configuredMaxMb) && configuredMaxMb > 0 ? configuredMaxMb : 15;
type FieldErrors = { file?: string; postcode?: string; solar?: string };

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
  const [inputMode, setInputMode] = useState<"generated" | "upload">("generated");
  const [hourlyLoads, setHourlyLoads] = useState<string[]>(Array.from({ length: 24 }, () => "0"));
  const [pvYear, setPvYear] = useState(2024);
  const [tilt, setTilt] = useState(25);
  const [azimuth, setAzimuth] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<string | null>(null);

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
    setInputMode(draft.inputMode || "generated");
    if (draft.generatedInput) {
      setHourlyLoads(draft.generatedInput.loadProfile24h.map(String));
      setPvYear(draft.generatedInput.year);
      setTilt(draft.generatedInput.tilt);
      setAzimuth(draft.generatedInput.azimuth);
    }

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
    const file = inputMode === "upload" ? await getDraftFile().catch(() => null) : null;

    if (inputMode === "upload" && (!file || !fileName)) nextErrors.file = "Choose the household/PV input file first.";
    if (inputMode === "generated" && !postcode) nextErrors.postcode = "Enter a postcode to generate solar production.";
    if (inputMode === "generated" && (hourlyLoads.length !== 24 || hourlyLoads.some((value) => !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0))) nextErrors.file = "Enter a valid, non-negative consumption value for every hour.";
    if (postcode && !/^\d{4}$/.test(postcode)) nextErrors.postcode = "Postcode must be a 4-digit Australian postcode.";
    if (inputMode === "generated" && (!Number.isFinite(tilt) || tilt < 0 || tilt > 90 || !Number.isFinite(azimuth) || azimuth < 0 || azimuth > 360)) {
      nextErrors.solar = "Panel tilt must be between 0° and 90°, and azimuth between 0° and 360°.";
      setAdvancedOpen(true);
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.file && inputMode === "upload") reveal(uploadRef.current);
      else if (nextErrors.postcode) reveal(postcodeRef.current);
      return;
    }

    if (inputMode === "generated") {
      // Only 24 numbers and solar settings travel between pages.
      // Django generates and validates the annual dataset when Step 4 runs.
      clearCachedTransientResult();
      await clearDraftFile().catch(() => undefined); // Remove any old manual upload from this browser.
    }
    if (inputMode === "upload" && file && !validation) {
      const valid = await validateAndStore(file);
      if (!valid) return;
    }

    setErrors({});
    saveDraft({
      inputMode,
      generatedInput: inputMode === "generated" ? {
        loadProfile24h: hourlyLoads.map(Number), year: pvYear,
        tilt, azimuth, systemLoss: 0.1,
      } : undefined,
      inputFileName: inputMode === "generated" ? `Annual PV + load · ${postcode.trim()} (${pvYear})` : fileName,
      inputFileSize: inputMode === "generated" ? undefined : fileSize,
      workbookValidation: inputMode === "generated" ? undefined : validation || undefined,
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

  const ready = inputMode === "generated" ? !saving && /^\d{4}$/.test(postcode) && Number.isFinite(tilt) && tilt >= 0 && tilt <= 90 && Number.isFinite(azimuth) && azimuth >= 0 && azimuth <= 360 && hourlyLoads.every(v => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0) : Boolean(fileName && validation && !saving && !errors.file);

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 1 of 4 · Generate annual solar and household consumption data, or upload a workbook.</p></div>
        <StepIndicator current={1} />

        <section className="section-card n01-methods" aria-label="Input method">
          <div className="n01-method-grid">
            <button type="button" aria-pressed={inputMode === "generated"} className={`n01-method ${inputMode === "generated" ? "is-selected" : ""}`} onClick={() => { setInputMode("generated"); setErrors({}); }}>
              <span className="n01-method-icon"><MapPin size={22}/></span><span><strong>Postcode + 24-hour table</strong><small>Enter your location and typical daily electricity use</small></span><CheckCircle2 size={22}/>
            </button>
            <button type="button" aria-pressed={inputMode === "upload"} className={`n01-method ${inputMode === "upload" ? "is-selected" : ""}`} onClick={() => { setInputMode("upload"); setErrors({}); }}>
              <span className="n01-method-icon"><FileSpreadsheet size={22}/></span><span><strong>Upload annual workbook</strong><small>Use your existing yearly spreadsheet</small></span><CheckCircle2 size={22}/>
            </button>
          </div>
        </section>

        {inputMode === "generated" && <section className="section-card n01-consumption">
          <div className="n01-titlebar">
            <div><h2 className="section-title">Typical daily electricity consumption</h2><p className="section-subtitle">Enter electricity consumed during each one-hour interval in kWh. Your 24 values are repeated across a 365-day simulation year. Solar data comes from Renewables.ninja.</p></div>
            <button type="button" className="n01-help-button" onClick={() => setHelpOpen(true)}><CircleHelp size={19}/> Tips &amp; Help</button>
          </div>
          <div className="n01-subcard">
            <div className="n01-subhead"><span className="n01-round-icon"><Sun size={24}/></span><div><h3>Solar settings</h3><p>Historical weather and panel orientation determine estimated PV generation.</p></div><button type="button" className="n01-advanced-button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(v => !v)}><Settings2 size={16}/> Advanced settings <ChevronDown size={16}/></button></div>
            <div className="n01-solar-grid">
              <div className="field"><label htmlFor="pv-year">Historical PV simulation year <button type="button" className="n01-info" aria-label="Explain simulation year" onClick={() => setActiveTip(activeTip === "year" ? null : "year")}><Info size={15}/></button></label><select className="input" id="pv-year" value={pvYear} onChange={event => setPvYear(Number(event.target.value))}>{[2024,2023,2022,2021,2019,2018].map(y => <option key={y} value={y}>{y}</option>)}</select><small className="field-help">2024 is the latest confirmed complete historical year.</small>{activeTip === "year" && <div className="n01-inline-tip">Solar generation is estimated using weather from the selected year. A leap year's 29 February is omitted to keep 8,760 rows.</div>}</div>
              {advancedOpen && <>
                <div className="field"><label htmlFor="pv-tilt">Panel tilt (degrees) <button type="button" className="n01-info" aria-label="Explain panel tilt" onClick={() => setActiveTip(activeTip === "tilt" ? null : "tilt")}><Info size={15}/></button></label><input className="input" id="pv-tilt" type="number" min="0" max="90" value={tilt} onChange={event => setTilt(Number(event.target.value))}/><small className="field-help">Angle above horizontal. Default: 25°.</small>{activeTip === "tilt" && <div className="n01-inline-tip">0° is flat; 90° is vertical. If unknown, keep 25°.</div>}</div>
                <div className="field"><label htmlFor="pv-azimuth">Panel azimuth (degrees) <button type="button" className="n01-info" aria-label="Explain panel azimuth" onClick={() => setActiveTip(activeTip === "azimuth" ? null : "azimuth")}><Info size={15}/></button></label><input className="input" id="pv-azimuth" type="number" min="0" max="360" value={azimuth} onChange={event => setAzimuth(Number(event.target.value))}/><small className="field-help">0° north · 90° east · 180° south · 270° west.</small>{activeTip === "azimuth" && <div className="n01-inline-tip">Direction your solar panels face. Keep 0° if unknown.</div>}</div>
              </>}
            </div>
            {errors.solar && <div className="field-message error" role="alert">{errors.solar}</div>}
            {!advancedOpen && <p className="n01-assumption">Using default solar orientation: 25° tilt, north-facing panels and 10% system loss. Select Advanced settings to adjust.</p>}
          </div>
          <div className="n01-subcard">
            <div className="n01-subhead"><span className="n01-round-icon"><BarChart3 size={23}/></span><div><h3>24-hour electricity consumption <button type="button" className="n01-info" aria-label="Explain hourly load" onClick={() => setActiveTip(activeTip === "load" ? null : "load")}><Info size={15}/></button></h3><p>Enter the electricity your household typically uses in each hour (kWh).</p></div><button type="button" className="n01-reset" onClick={() => setHourlyLoads(Array(24).fill("0"))}><RotateCcw size={15}/> Clear values</button></div>
            {activeTip === "load" && <div className="n01-inline-tip">Use energy in kWh, not instantaneous power in kW. For example, a 1 kW appliance running for 30 minutes uses 0.5 kWh. The same daily pattern is assumed every day of the year.</div>}
            <div className="n01-hour-grid">
              {hourlyLoads.map((load, hour) => <div className="n01-hour" key={hour}><label htmlFor={`load-hour-${hour}`}>{String(hour).padStart(2,"0")}:00–{String((hour + 1) % 24).padStart(2,"0")}:00</label><input className="input" id={`load-hour-${hour}`} type="number" min="0" step="any" required value={load} onChange={event => setHourlyLoads(previous => previous.map((item, index) => index === hour ? event.target.value : item))} aria-label={`Consumption from ${hour}:00 to ${(hour+1)%24}:00 in kWh`}/></div>)}
            </div>
          </div>
          <div className="n01-summary" aria-live="polite"><div className="n01-summary-title"><BarChart3 size={25}/> <strong>Load summary</strong></div><div><small><Zap size={15}/> Daily load</small><strong>{hourlyLoads.reduce((sum,value)=>sum+(Number(value)||0),0).toFixed(2)} kWh</strong></div><div><small><CalendarDays size={15}/> Approximate annual load</small><strong>{(hourlyLoads.reduce((sum,value)=>sum+(Number(value)||0),0)*365).toLocaleString("en-AU",{maximumFractionDigits:1})} kWh</strong></div><div className="n01-fixed-pv">Fixed PV system size: <strong>5 kW</strong><small>Required by the unchanged MATLAB model</small></div><div className="n01-completeness"><CheckCircle2 size={22}/><span>{hourlyLoads.filter(v => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0).length} of 24<small>valid hourly values</small></span></div></div>
          {errors.file && <div className="field-message error" role="alert">{errors.file}</div>}
          {helpOpen && <div className="n01-modal-overlay" onClick={() => setHelpOpen(false)}><div className="n01-modal" role="dialog" aria-modal="true" aria-labelledby="n01-help-title" onClick={e => e.stopPropagation()}><div className="n01-modal-header"><h2 id="n01-help-title">How to enter your electricity data</h2><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help"><X size={22}/></button></div><ol><li><strong>Postcode and state:</strong> enter these in the Location section below. The postcode gives an approximate solar simulation location.</li><li><strong>Historical year:</strong> choose a year of solar weather data. It is not the year your electricity was consumed.</li><li><strong>Hourly load:</strong> enter energy in kWh for each one-hour interval. For example, using a 2 kW heater for 30 minutes consumes 1 kWh.</li><li><strong>Solar orientation:</strong> optional advanced settings. Tilt is the panel angle; azimuth is the direction panels face. Defaults are 25° and north.</li><li><strong>Annual simulation:</strong> the same 24-hour load repeats 365 times; this does not model seasonal or weekend variations. PV weather changes hour by hour.</li><li><strong>Next:</strong> Django combines 8,760 hourly PV values and 8,760 hourly load values into the two columns required by the unchanged MATLAB algorithm.</li></ol><button type="button" className="btn btn-primary" onClick={() => setHelpOpen(false)}>Got it</button></div></div>}
        </section>}

        {inputMode === "upload" && <section className="section-card">
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
        </section>}

        <section className="section-card">
          <h2 className="section-title">Location &amp; record information</h2>
          <p className="section-subtitle">For postcode generation, location determines the solar PV profile. Optional record details can help identify saved calculations.</p>
          <div className="form-grid">
            <div className={`field${errors.postcode ? " has-error" : ""}`}>
              <label htmlFor="postcode">Postcode {inputMode === "generated" ? "(required)" : "(optional)"}</label>
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
              <div id="postcode-help" className="field-help">Used to estimate PV generation for the selected Australian location.</div>
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
              <strong>Save my annual profile and calculation for later access.</strong>
              <small>If enabled, the backend retains the input, calculation record and canonical result CSV. If disabled, processing is transient and no calculation/file record is stored server-side. For manual uploads, the selected workbook is kept temporarily in this browser while you move between steps or retry. For postcode-based calculations, only the 24 hourly values and solar settings are kept in your browser draft.</small>
            </span>
            <span className={`retention-state ${retainData ? "on" : "off"}`}>{retainData ? "ON" : "OFF"}</span>
          </label>
        </section>

        <div className={`notice workflow-readiness ${ready ? "ready" : ""}`} role="status">
          <FileSpreadsheet size={17} />
          <span>
            {!ready
              ? saving ? "Preparing inputs…" : inputMode === "generated" ? "Enter a postcode and valid 24-hour consumption values to continue." : "Validate an annual workbook to continue."
              : retainData
                ? "Ready to continue. Django will prepare and validate the annual profile when the calculation starts. Retention is ON."
                : "Ready to continue. Django will create the annual profile internally when the calculation starts. Retention is OFF."}
          </span>
        </div>

        <div className="button-row">
          <span />
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? "Checking inputs…" : "Next: Algorithm"} <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </AppShell>
  );
}
