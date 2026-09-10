"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepIndicator } from "@/components/StepIndicator";
import { InlineIssue, ValidationSummary } from "@/components/ValidationSummary";
import { getTariffs } from "@/lib/api";
import { getDraft, saveDraft } from "@/lib/draft";
import { errorsOnly, validateTariffInput, warningsOnly } from "@/lib/validation";
import type { Tariff } from "@/lib/types";

const fallback: Tariff = {
  id: "tou-3",
  type: "Time of Use (3 Periods)",
  provider: "Demo Energy",
  description: "Three-period time-of-use demonstration tariff.",
  peak: 0.45,
  shoulder: 0.28,
  offPeak: 0.16,
  feedIn: 0.06,
  demandCharge: 0,
  periods: { peak: "4pm – 9pm", shoulder: "7am – 4pm", offPeak: "9pm – 7am" },
};

export default function TariffPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([fallback]);
  const [tariff, setTariff] = useState<Tariff>(fallback);
  const [feedIn, setFeedIn] = useState("0.06");
  const [demand, setDemand] = useState("0.00");
  const [submitted, setSubmitted] = useState(false);
  const [apiNote, setApiNote] = useState("Using built-in demo tariff while the dummy API loads.");

  useEffect(() => {
    const draft = getDraft();
    if (!draft.loadMode || !draft.pvSize) {
      window.location.replace("/calculator/load-solar");
      return;
    }

    if (draft.tariffId) {
      const restored: Tariff = {
        ...fallback,
        id: draft.tariffId,
        type: draft.tariffType ?? fallback.type,
        peak: draft.peakRate ?? fallback.peak,
        shoulder: draft.shoulderRate ?? fallback.shoulder,
        offPeak: draft.offPeakRate ?? fallback.offPeak,
        feedIn: draft.feedInTariff ?? fallback.feedIn,
        demandCharge: draft.demandCharge ?? fallback.demandCharge,
      };
      setTariff(restored);
      setFeedIn(String(restored.feedIn));
      setDemand(String(restored.demandCharge));
    }

    getTariffs().then((data) => {
      const available = data.tariffs.length ? data.tariffs : [fallback];
      const preferredId = draft.tariffId || sessionStorage.getItem("smart-battery-preferred-tariff") || undefined;
      const selected = available.find((item) => item.id === preferredId) ?? available[0];
      sessionStorage.removeItem("smart-battery-preferred-tariff");
      setTariffs(available);
      setTariff(selected);
      setFeedIn(String(draft.feedInTariff ?? selected.feedIn));
      setDemand(String(draft.demandCharge ?? selected.demandCharge));
      setApiNote("Tariffs loaded. If the dummy endpoint is unavailable, bundled JSON is used automatically.");
    }).catch(() => {
      setTariffs([fallback]);
      setTariff(fallback);
      setApiNote("Dummy API was unavailable, so the built-in tariff JSON is being used. You can continue normally.");
    });
  }, []);

  const issues = useMemo(() => validateTariffInput({ tariff, feedIn, demand }), [tariff, feedIn, demand]);
  const visibleIssues = useMemo(() => [...(submitted ? errorsOnly(issues) : []), ...warningsOnly(issues)], [issues, submitted]);

  function chooseTariff(id: string) {
    const selected = tariffs.find((item) => item.id === id) ?? fallback;
    setTariff(selected);
    setFeedIn(String(selected.feedIn));
    setDemand(String(selected.demandCharge));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errorsOnly(issues).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    saveDraft({
      tariffId: tariff.id,
      tariffType: tariff.type,
      peakRate: tariff.peak,
      shoulderRate: tariff.shoulder,
      offPeakRate: tariff.offPeak,
      feedInTariff: Number(feedIn),
      demandCharge: Number(demand),
    });
    window.location.assign("/calculator/battery-costs");
  }

  return (
    <AppShell>
      <form onSubmit={submit} noValidate>
        <div className="step-heading"><h1>New Calculation</h1><p>Step 2 of 4</p></div>
        <StepIndicator current={2} />
        <ValidationSummary issues={visibleIssues} />
        <h2 className="section-title">Select Tariff</h2>
        <p className="section-subtitle">Choose your electricity tariff.</p>

        <div className="field">
          <label htmlFor="tariff-type">Tariff Type</label>
          <select id="tariff-type" className="input" value={tariff.id} onChange={(e) => chooseTariff(e.target.value)}>
            {tariffs.map((item) => <option key={item.id} value={item.id}>{item.type}</option>)}
          </select>
          {tariff.description && <div className="field-help">{tariff.provider ? `${tariff.provider} · ` : ""}{tariff.description}</div>}
          <InlineIssue issues={visibleIssues} field="tariff" />
        </div>

        <div className="tariff-cards">
          <TariffCard tone="red" title="Peak" value={tariff.peak} time={tariff.periods.peak} />
          <TariffCard tone="amber" title="Shoulder" value={tariff.shoulder} time={tariff.periods.shoulder} />
          <TariffCard tone="green" title="Off-Peak" value={tariff.offPeak} time={tariff.periods.offPeak} />
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="feedin">Feed-in Tariff (Export Rate)</label>
            <div className="input-wrap"><span className="input-prefix">$</span><input id="feedin" className={`input has-prefix has-unit ${visibleIssues.some((i) => i.field === "feedIn" && i.level === "error") ? "input-error" : ""}`} type="number" min="0" max="2" step="0.01" value={feedIn} onChange={(e) => { setFeedIn(e.target.value); }} /><span className="input-unit">/kWh</span></div>
            <InlineIssue issues={visibleIssues} field="feedIn" />
          </div>
          <div className="field">
            <label htmlFor="demand">Demand Charge (if applicable)</label>
            <div className="input-wrap"><span className="input-prefix">$</span><input id="demand" className={`input has-prefix has-unit ${visibleIssues.some((i) => i.field === "demand" && i.level === "error") ? "input-error" : ""}`} type="number" min="0" max="100" step="0.01" value={demand} onChange={(e) => { setDemand(e.target.value); }} /><span className="input-unit">/kW/day</span></div>
            <InlineIssue issues={visibleIssues} field="demand" />
          </div>
        </div>

        <div className="notice">{apiNote}</div>
        <div className="button-row">
          <button className="btn" type="button" onClick={() => window.location.assign("/calculator/load-solar")}><ArrowLeft size={18}/> Back</button>
          <button className="btn btn-primary btn-lg" type="submit">Next: Battery & Costs <ArrowRight size={18}/></button>
        </div>
      </form>
    </AppShell>
  );
}

function TariffCard({ tone, title, value, time }: { tone: "red" | "amber" | "green"; title: string; value: number; time: string }) {
  return <div className={`tariff-card ${tone}`}><h3>{title}</h3><div className="tariff-price">${value.toFixed(2)}</div><div className="tariff-unit">/kWh</div><div className="tariff-time">e.g. {time}</div></div>;
}
