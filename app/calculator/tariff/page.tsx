"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BatteryCharging, ChevronDown, CircleHelp, Info, RotateCcw, Sun, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { InfoTip } from "@/components/InfoTip";
import { getDraft, saveDraft } from "@/lib/draft";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";
import type { DraftCalculation } from "@/lib/types";
import { dailyConsumption, hourRange, numericError, tariffError, V1_DEFAULTS, V1_RULES, V1_RETAIL_DEFAULTS, V1_FEED_IN_DEFAULTS } from "@/lib/algorithm-v1";

type FieldKey = "batteryCapacityKwh" | "pvCapacityKw";
type FieldErrors = Partial<Record<FieldKey | "retail" | "feed", string>>;

export default function TariffPage() {
  const [draft, setDraft] = useState<DraftCalculation | null>(null);
  const [battery, setBattery] = useState(String(V1_DEFAULTS.batteryCapacityKwh));
  const [pv, setPv] = useState(String(V1_DEFAULTS.pvCapacityKw));
  const [retail, setRetail] = useState<string[]>(V1_RETAIL_DEFAULTS.map(String));
  const [feed, setFeed] = useState<string[]>(V1_FEED_IN_DEFAULTS.map(String));
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const batteryRef = useRef<HTMLInputElement>(null);
  const pvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = getDraft();
    if (!saved.inputFileName || (saved.inputMode === "generated" && !saved.generatedInput)) {
      window.location.replace("/calculator/load-solar");
      return;
    }
    setDraft(saved);
    const existing = saved.v1Inputs;
    if (existing) {
      setBattery(String(existing.batteryCapacityKwh));
      setPv(String(existing.pvCapacityKw));
      if (existing.retailTariff24h?.length === 24) setRetail(existing.retailTariff24h.map(String));
      if (existing.feedInTariff24h?.length === 24) setFeed(existing.feedInTariff24h.map(String));
    }
  }, []);

  const daily = useMemo(() => draft?.inputMode === "generated" && draft.generatedInput
    ? dailyConsumption(draft.generatedInput.loadProfile24h) : null, [draft]);

  function setHourly(index: number, value: string, target: "retail" | "feed") {
    const setter = target === "retail" ? setRetail : setFeed;
    setter(old => old.map((item, i) => i === index ? value : item));
    setErrors(old => ({ ...old, [target]: undefined }));
  }

  function resetTariffs() {
    setRetail(V1_RETAIL_DEFAULTS.map(String));
    setFeed(V1_FEED_IN_DEFAULTS.map(String));
    setErrors(old => ({ ...old, retail: undefined, feed: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: FieldErrors = {
      batteryCapacityKwh: numericError(battery, "batteryCapacityKwh"),
      pvCapacityKw: numericError(pv, "pvCapacityKw"),
      retail: tariffError(retail, "Retail tariff"),
      feed: tariffError(feed, "Feed-in tariff"),
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      if (nextErrors.retail || nextErrors.feed) setExpanded(true);
      else (nextErrors.batteryCapacityKwh ? batteryRef : pvRef).current?.focus();
      return;
    }
    if (daily !== null && daily <= 0) {
      setErrors({ batteryCapacityKwh: "Enter at least some daily electricity consumption in Step 1 before continuing." });
      return;
    }
    const old = getDraft();
    saveDraft({
      algorithmVersion: "batt_cal_v1",
      v1Inputs: {
        ...(old.v1Inputs ?? V1_DEFAULTS),
        batteryCapacityKwh: Number(battery), pvCapacityKw: Number(pv),
        retailTariff24h: retail.map(Number), feedInTariff24h: feed.map(Number),
      },
      publicId: undefined, accessToken: undefined,
    });
    clearCachedTransientResult();
    window.location.assign("/calculator/battery-costs");
  }

  return (
    <AppShell>
      <form noValidate onSubmit={submit}>
        <div className="step-heading"><h1>System &amp; electricity tariffs</h1><p>Step 2 of 4 · Configure the updated client MATLAB model.</p></div>
        <StepIndicator current={2} />

        <section className="section-card">
          <div className="n01-titlebar">
            <div><h2 className="section-title">Solar and battery configuration</h2><p className="section-subtitle">Choose the capacity you want to evaluate. Both values will become inputs to <code>batt_cal_v1.m</code> in the Django calculation.</p></div>
            <button className="n01-help-button" type="button" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /> Tips &amp; Help</button>
          </div>
          <div className="v1-field-grid">
            <div className={`field${errors.batteryCapacityKwh ? " has-error" : ""}`}>
              <label htmlFor="v1-battery"><BatteryCharging size={17} /> Battery capacity <InfoTip text="Energy that your chosen battery can store, measured in kWh. This version evaluates the selected size; it does not automatically optimise battery capacity." /></label>
              <div className="v1-input-with-unit"><input ref={batteryRef} id="v1-battery" className={`input${errors.batteryCapacityKwh ? " input-error" : ""}`} type="number" inputMode="decimal" min={V1_RULES.batteryCapacityKwh.min} max={V1_RULES.batteryCapacityKwh.max} step="0.5" value={battery} aria-invalid={!!errors.batteryCapacityKwh} onChange={e => { setBattery(e.target.value); setErrors(old => ({ ...old, batteryCapacityKwh: undefined })); }}/><span>kWh</span></div>
              <small className="field-help">Allowed range: 1–50 kWh. Default from the new MATLAB source: 15 kWh.</small>
              {errors.batteryCapacityKwh && <div role="alert" className="field-message error">{errors.batteryCapacityKwh}</div>}
            </div>
            <div className={`field${errors.pvCapacityKw ? " has-error" : ""}`}>
              <label htmlFor="v1-pv"><Sun size={17} /> Solar PV capacity <InfoTip text="Rated solar panel system size. PV generation from Renewables.ninja must be scaled exactly once by the Django backend." /></label>
              <div className="v1-input-with-unit"><input ref={pvRef} id="v1-pv" className={`input${errors.pvCapacityKw ? " input-error" : ""}`} type="number" inputMode="decimal" min={V1_RULES.pvCapacityKw.min} max={V1_RULES.pvCapacityKw.max} step="0.5" value={pv} aria-invalid={!!errors.pvCapacityKw} onChange={e => { setPv(e.target.value); setErrors(old => ({ ...old, pvCapacityKw: undefined })); }}/><span>kW</span></div>
              <small className="field-help">Allowed range: 0.5–30 kW. Default from the new MATLAB source: 6 kW.</small>
              {errors.pvCapacityKw && <div role="alert" className="field-message error">{errors.pvCapacityKw}</div>}
            </div>
          </div>
          <div className="v1-auto-summary">
            <Zap size={22} aria-hidden="true" />
            <div><strong>Average daily electricity consumption <span className="v1-auto-chip">Calculated automatically</span></strong>
              <p>{daily === null ? "For an uploaded annual workbook, Django will calculate this from its load column." : `${daily.toFixed(2)} kWh/day · ${(daily * 365).toLocaleString("en-AU", { maximumFractionDigits: 1 })} kWh/year estimated from your 24-hour table.`} You don't need to enter it again.</p></div>
          </div>
        </section>

        <section className="section-card">
          <div className="n01-titlebar">
            <div><h2 className="section-title">Hourly electricity tariffs</h2><p className="section-subtitle">The updated MATLAB script has a 24-hour retail-price schedule and a 24-hour solar feed-in tariff schedule. We've prefilled the values from the file you supplied.</p></div>
            <button type="button" className="n01-advanced-button" aria-expanded={expanded} aria-controls="v1-tariff-editor" onClick={() => setExpanded(v => !v)}>{expanded ? "Hide" : "Edit"} hourly rates <ChevronDown size={16} className={expanded ? "v1-rotate" : ""} /></button>
          </div>
          <div className="v1-tariff-summary">
            <div><span>Average retail rate</span><strong>${(retail.reduce((sum, v) => sum + (Number(v) || 0), 0) / 24).toFixed(3)} / kWh</strong></div>
            <div><span>Average feed-in rate</span><strong>${(feed.reduce((sum, v) => sum + (Number(v) || 0), 0) / 24).toFixed(3)} / kWh</strong></div>
            <div><span>Schedule</span><strong>24 hourly intervals</strong></div>
          </div>
          {expanded && <div id="v1-tariff-editor" className="v1-tariff-editor">
            <div className="v1-editor-head"><span>All rates are in AUD/kWh. Enter the price that applies during each hour.</span><button className="btn btn-small" type="button" onClick={resetTariffs}><RotateCcw size={15}/> Restore client defaults</button></div>
            <div className="v1-tariff-table-wrap"><table className="v1-tariff-table"><thead><tr><th scope="col">Hour</th><th scope="col">Retail import ($/kWh)</th><th scope="col">Solar feed-in ($/kWh)</th></tr></thead><tbody>{retail.map((value, hour) => <tr key={hour}><th scope="row">{hourRange(hour)}</th><td><input className={`input${value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 5 ? " input-error" : ""}`} type="number" inputMode="decimal" min="0" max="5" step="0.001" aria-label={`Retail import rate ${hourRange(hour)}`} value={value} onChange={e => setHourly(hour, e.target.value, "retail")}/></td><td><input className={`input${feed[hour].trim() === "" || !Number.isFinite(Number(feed[hour])) || Number(feed[hour]) < 0 || Number(feed[hour]) > 5 ? " input-error" : ""}`} type="number" inputMode="decimal" min="0" max="5" step="0.001" aria-label={`Solar feed-in rate ${hourRange(hour)}`} value={feed[hour]} onChange={e => setHourly(hour, e.target.value, "feed")}/></td></tr>)}</tbody></table></div>
          </div>}
          {(errors.retail || errors.feed) && <div role="alert" className="field-message error">{[errors.retail, errors.feed].filter(Boolean).join(" ")}</div>}
          <div className="notice"><Info size={17} /><span>The tariff presets are taken from <code>batt_cal_v1.m</code>; they are not guaranteed to match your electricity plan. You can edit them in the hourly-rate table.</span></div>
        </section>

        <div className="notice"><Info size={18} /><span>These are input settings only. Energy flows, loan instalments and annual results are calculated on the Django server using GNU Octave.</span></div>
        <div className="button-row"><button className="btn" type="button" onClick={() => window.location.assign("/calculator/load-solar")}><ArrowLeft size={18}/> Back</button><button className="btn btn-primary btn-lg" type="submit">Next: Financial Settings <ArrowRight size={18}/></button></div>

        {helpOpen && <div className="n01-modal-overlay" onClick={() => setHelpOpen(false)}><div className="n01-modal" role="dialog" aria-modal="true" aria-labelledby="v1-system-help" onClick={e => e.stopPropagation()}><div className="n01-modal-header"><h2 id="v1-system-help">System &amp; tariffs: tips</h2><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close tips">✕</button></div><ol><li><strong>Battery capacity:</strong> stored energy, measured in kWh. The current script evaluates the chosen size, not the optimal size.</li><li><strong>Solar PV capacity:</strong> the installed solar-panel system rating, measured in kW.</li><li><strong>Daily load:</strong> automatically summed from the 24 hourly entries in Step 1.</li><li><strong>Retail tariff:</strong> what you pay your electricity retailer for imported grid energy at each hour.</li><li><strong>Feed-in tariff:</strong> what your retailer credits for exported solar energy at each hour.</li><li><strong>Backend integration:</strong> Django receives these inputs and executes the updated MATLAB calculation. The browser never runs the algorithm.</li></ol><button className="btn btn-primary" type="button" onClick={() => setHelpOpen(false)}>Got it</button></div></div>}
      </form>
    </AppShell>
  );
}
