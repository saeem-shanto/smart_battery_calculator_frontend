"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BatteryCharging, Calculator, CircleDollarSign, Eye, FileSpreadsheet, LockKeyhole, RefreshCcw, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";
import { EnergyEcosystem } from "@/components/EnergyEcosystem";
import { listCalculationHistory } from "@/lib/calculation-history";
import { getHealth } from "@/lib/api";
import { getCurrentUser, getOwnedCalculations } from "@/lib/account-api";
import { isCompleteBatteryResult, type LocalCalculation, type OwnedCalculation, type UserSummary } from "@/lib/types";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";

type RecentRow = {
  publicId: string;
  inputFilename: string;
  createdAt: string;
  batterySizeKwh: number | null;
  annualSavingsAud: number | null;
  status: string;
  source: "account" | "guest";
};

function fromOwned(item: OwnedCalculation): RecentRow {
  return {
    publicId: item.public_id,
    inputFilename: item.input_filename || "Uploaded workbook",
    createdAt: item.created_at,
    batterySizeKwh: isCompleteBatteryResult(item.result) ? item.result.optimal_battery_size_kwh : null,
    annualSavingsAud: isCompleteBatteryResult(item.result) ? item.result.estimated_annual_bill_reduction_aud : null,
    status: item.status,
    source: "account",
  };
}

function fromLocal(item: LocalCalculation): RecentRow {
  return {
    publicId: item.publicId,
    inputFilename: item.inputFilename,
    createdAt: item.createdAt,
    batterySizeKwh: item.batterySizeKwh,
    annualSavingsAud: item.annualSavingsAud,
    status: item.status,
    source: "guest",
  };
}

function statusClass(status: string) {
  const normal = status.toLowerCase();
  return `status-pill status-${normal.replace(/[^a-z0-9]+/g, "-")}`;
}

export function DashboardClient() {
  const [recentLocal, setRecentLocal] = useState<LocalCalculation[]>([]);
  const [recentOwned, setRecentOwned] = useState<OwnedCalculation[]>([]);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [accountWarning, setAccountWarning] = useState("");

  async function checkBackend() {
    setOnline(null);
    try { await getHealth(); setOnline(true); } catch { setOnline(false); }
  }

  useEffect(() => {
    setRecentLocal(listCalculationHistory());
    void checkBackend();
    getCurrentUser()
      .then(async (current) => {
        setUser(current);
        if (current) setRecentOwned(await getOwnedCalculations());
      })
      .catch((error) => {
        setAccountWarning(error instanceof Error ? "Account calculations are temporarily unavailable; browser-saved guest records are still shown." : "Account calculations are temporarily unavailable.");
        setUser(null);
      })
      .finally(() => setLoadingRecords(false));
  }, []);

  const recent = useMemo(() => {
    const ownedIds = new Set(recentOwned.map((item) => item.public_id));
    return [...recentOwned.map(fromOwned), ...recentLocal.filter((item) => !ownedIds.has(item.publicId)).map(fromLocal)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [recentOwned, recentLocal]);

  async function startNew() {
    clearDraft();
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="hero-kicker">Residential solar battery calculator</div>
          <h1>Size your home battery <span>with real energy data.</span></h1>
          <p className="hero-lead">Enter your postcode and 24 hourly consumption values, or upload an annual workbook. Evaluate a chosen battery and solar PV size with the updated client calculation model.</p>

          <div className="dashboard-hero-actions">
            <button className="btn btn-primary hero-primary-action" type="button" onClick={startNew}><Calculator size={18}/> Start a calculation <ArrowRight size={17}/></button>
            <a className="hero-secondary-action" href="/about">How it works</a>
          </div>

          <div className="hero-trust-row" aria-label="Calculator highlights">
            <span><FileSpreadsheet size={16}/> Annual profile input</span>
            <span><Zap size={16}/> Retail tariff + FiT</span>
            <span><LockKeyhole size={16}/> Optional data retention</span>
          </div>

          {user && <div className="dashboard-account-greeting hero-account-greeting">Signed in as <strong>{user.name}</strong>. Saved calculations will be linked to your account. <a href="/account/profile">Manage account &amp; security</a></div>}
        </div>

        <div className="landing-hero-visual">
          <EnergyEcosystem/>
          <div className={`backend-status hero-backend-status ${online === true ? "online" : online === false ? "offline" : ""}`} role="status" aria-live="polite">
            <span aria-hidden="true"/>
            {online === null ? "Checking calculation service…" : online ? "Calculation service online" : "Calculation service unavailable"}
            {online === false && <button type="button" className="status-retry" onClick={checkBackend}><RefreshCcw size={13}/> Retry</button>}
          </div>
        </div>
      </section>

      <section className="feature-grid landing-feature-grid" aria-label="Calculator capabilities">
        <div className="feature-card landing-feature-card"><div className="feature-topline"><div className="icon-bubble green"><FileSpreadsheet size={25}/></div></div><h3>Use your annual profile</h3><p>Enter a typical 24-hour load and generate location-based solar data, or validate an annual workbook.</p></div>
        <div className="feature-card landing-feature-card"><div className="feature-topline"><div className="icon-bubble purple"><BatteryCharging size={25}/></div></div><h3>Run the client model</h3><p>The selected-capacity MATLAB calculation is executed through GNU Octave on the Django backend.</p></div>
        <div className="feature-card landing-feature-card"><div className="feature-topline"><div className="icon-bubble gold"><CircleDollarSign size={25}/></div></div><h3>Review the result</h3><p>Review the selected battery capacity, modelled annual payment, grid exchange and payback estimate.</p></div>
      </section>

      {accountWarning && <div className="notice dashboard-notice" role="status">{accountWarning}</div>}

      <section className="card">
        <div className="card-header"><h2>Recent Calculations</h2><a className="card-header-link" href="/results-history">View All <ArrowRight size={17}/></a></div>
        {loadingRecords ? (
          <div className="loading-inline card-loading"><span className="spinner-dark"/> Loading recent calculations…</div>
        ) : recent.length === 0 ? (
          <div className="empty-state"><h3>No retained calculations yet</h3><p>Run a calculation and enable saving if you want it to appear here later.</p><button className="btn btn-primary" type="button" onClick={startNew}>Start Calculation</button></div>
        ) : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Input</th><th>Date</th><th>Battery Size</th><th>Annual Savings</th><th>Access</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {recent.map((item) => <tr key={`${item.source}-${item.publicId}`}>
              <td><strong>{item.inputFilename}</strong></td>
              <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              <td><strong>{item.batterySizeKwh === null ? "—" : `${item.batterySizeKwh.toFixed(2)} kWh`}</strong></td>
              <td><strong>{item.annualSavingsAud === null ? "—" : `$${item.annualSavingsAud.toFixed(2)}`}</strong></td>
              <td><span className={`access-pill ${item.source}`}>{item.source === "account" ? "Account" : "This browser"}</span></td>
              <td><span className={statusClass(item.status)}>{item.status}</span></td>
              <td><button className="icon-button" type="button" aria-label={`View calculation ${item.inputFilename}`} title="View calculation" onClick={() => window.location.assign(`/calculator/results?id=${item.publicId}`)}><Eye size={18}/></button></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </AppShell>
  );
}
