"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BatteryCharging, Calculator, CircleDollarSign } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";
import { SolarIllustration } from "@/components/SolarIllustration";
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

export default function DashboardPage() {
  const [recentLocal, setRecentLocal] = useState<LocalCalculation[]>([]);
  const [recentOwned, setRecentOwned] = useState<OwnedCalculation[]>([]);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    setRecentLocal(listCalculationHistory());
    getHealth().then(()=>setOnline(true)).catch(()=>setOnline(false));
    getCurrentUser().then(async (current) => {
      setUser(current);
      if (current) setRecentOwned(await getOwnedCalculations());
    }).catch(()=>setUser(null));
  }, []);

  const recent = useMemo(() => {
    const ownedIds = new Set(recentOwned.map((item) => item.public_id));
    return [...recentOwned.map(fromOwned), ...recentLocal.filter((item)=>!ownedIds.has(item.publicId)).map(fromLocal)]
      .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
      .slice(0,3);
  }, [recentOwned, recentLocal]);

  async function startNew() {
    clearDraft();
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <section className="dashboard-hero">
        <div>
          <h1>Smart Battery Calculator</h1>
          <p>Run the client’s validated solar-battery optimisation through the production Django and GNU Octave backend.</p>
          <div className={`backend-status ${online===true?"online":online===false?"offline":""}`}><span/>{online===null?"Checking backend…":online?"Backend online":"Backend unavailable"}</div>
          {user && <div className="dashboard-account-greeting">Signed in as <strong>{user.name}</strong></div>}
        </div>
        <SolarIllustration/>
      </section>

      <section className="feature-grid">
        <div className="feature-card"><div className="icon-bubble green"><Calculator size={34}/></div><h3>Real Annual Data</h3><p>Upload the client-format annual load and PV profile for validation and optimisation.</p></div>
        <div className="feature-card"><div className="icon-bubble purple"><BatteryCharging size={34}/></div><h3>Validated Algorithm</h3><p>The original MATLAB source runs unchanged under GNU Octave.</p></div>
        <div className="feature-card"><div className="icon-bubble gold"><CircleDollarSign size={35}/></div><h3>Auditable Results</h3><p>Choose whether to keep an auditable record or run privately without backend retention.</p></div>
      </section>

      <section className="card">
        <div className="card-header"><h2>Recent Calculations</h2><a className="card-header-link" href="/results-history">View All <ArrowRight size={17}/></a></div>
        {recent.length===0 ? (
          <div className="empty-state"><h3>No calculations yet</h3><p>Retained calculations will appear here after you choose to save a result.</p><button className="btn btn-primary" type="button" onClick={startNew}>Start Calculation</button></div>
        ) : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Input</th><th>Date</th><th>Battery Size</th><th>Annual Savings</th><th>Access</th><th>Status</th></tr></thead><tbody>
            {recent.map((item)=><tr key={`${item.source}-${item.publicId}`} onDoubleClick={()=>window.location.assign(`/calculator/results?id=${item.publicId}`)}>
              <td><strong>{item.inputFilename}</strong></td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><strong>{item.batterySizeKwh === null ? "—" : `${item.batterySizeKwh.toFixed(2)} kWh`}</strong></td><td><strong>{item.annualSavingsAud === null ? "—" : `$${item.annualSavingsAud.toFixed(2)}`}</strong></td><td><span className={`access-pill ${item.source}`}>{item.source==="account"?"Account":"This browser"}</span></td><td><span className="status-pill">{item.status}</span></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </AppShell>
  );
}
