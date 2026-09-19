"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Link2, Plus, Search, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";
import { deleteCalculation } from "@/lib/api";
import { claimCalculation, getCurrentUser, getOwnedCalculations } from "@/lib/account-api";
import { listCalculationHistory, removeHistoryItem } from "@/lib/calculation-history";
import { isCompleteBatteryResult, type LocalCalculation, type OwnedCalculation, type UserSummary } from "@/lib/types";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";

type HistoryRow = {
  publicId: string;
  inputFilename: string;
  postcode: string;
  suburb: string;
  state: string;
  createdAt: string;
  batterySizeKwh: number | null;
  annualSavingsAud: number | null;
  status: string;
  source: "account" | "guest";
  guestToken?: string;
};

function accountRow(item: OwnedCalculation): HistoryRow {
  return {
    publicId: item.public_id,
    inputFilename: item.input_filename || "Uploaded workbook",
    postcode: item.postcode || "",
    suburb: item.suburb || "",
    state: item.state || "",
    createdAt: item.created_at,
    batterySizeKwh: isCompleteBatteryResult(item.result) ? item.result.optimal_battery_size_kwh : null,
    annualSavingsAud: isCompleteBatteryResult(item.result) ? item.result.estimated_annual_bill_reduction_aud : null,
    status: item.status,
    source: "account",
  };
}

function guestRow(item: LocalCalculation): HistoryRow {
  return {
    publicId: item.publicId,
    inputFilename: item.inputFilename,
    postcode: item.postcode,
    suburb: item.suburb,
    state: item.state,
    createdAt: item.createdAt,
    batterySizeKwh: item.batterySizeKwh,
    annualSavingsAud: item.annualSavingsAud,
    status: item.status,
    source: "guest",
    guestToken: item.accessToken,
  };
}

export default function ResultsHistoryPage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [owned, setOwned] = useState<OwnedCalculation[]>([]);
  const [guest, setGuest] = useState<LocalCalculation[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");

  async function refresh() {
    setGuest(listCalculationHistory());
    try {
      const current = await getCurrentUser();
      setUser(current);
      setOwned(current ? await getOwnedCalculations() : []);
    } catch (caught) {
      setUser(null);
      setOwned([]);
      setError(caught instanceof Error ? `Account calculations could not be loaded: ${caught.message}` : "Account calculations could not be loaded. Guest records from this browser are still shown.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const rows = useMemo(() => {
    const accountIds = new Set(owned.map((item) => item.public_id));
    const combined = [...owned.map(accountRow), ...guest.filter((item) => !accountIds.has(item.publicId)).map(guestRow)];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const q = query.trim().toLowerCase();
    return combined.filter((item) => !q || [item.inputFilename, item.postcode, item.suburb, item.state, item.publicId].join(" ").toLowerCase().includes(q));
  }, [owned, guest, query]);

  async function remove(item: HistoryRow) {
    if (!confirm(`Delete calculation ${item.publicId}? Unreferenced private files are cleaned up by the backend.`)) return;
    setWorkingId(item.publicId); setError("");
    try {
      await deleteCalculation(item.publicId, item.source === "guest" ? item.guestToken : undefined);
      if (item.source === "guest") removeHistoryItem(item.publicId);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete calculation.");
    } finally { setWorkingId(""); }
  }

  async function claim(item: HistoryRow) {
    if (!user || !item.guestToken) return;
    setWorkingId(item.publicId); setError("");
    try {
      await claimCalculation(item.publicId, item.guestToken);
      removeHistoryItem(item.publicId);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not claim calculation.");
    } finally { setWorkingId(""); }
  }

  async function startNew() {
    clearDraft();
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>My Calculations</h1><p>{user ? "Account-owned calculations plus guest records saved in this browser." : "Guest calculations saved in this browser. Sign in to access account-owned records across sessions."}</p></div>
        <button className="btn btn-primary" onClick={startNew}><Plus size={18}/> New Calculation</button>
      </div>

      {!user && <div className="account-history-note"><UserRound size={18}/><span><strong>Guest mode.</strong> <a href="/account/login?next=/results-history">Sign in</a> to own retained calculations and access them across browsers.</span></div>}

      <div className="search-input-wrap"><Search size={20}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search filename, location or calculation ID…"/></div>
      {error && <div className="error-box">{error}</div>}

      <section className="card page-card-space">
        {loading ? <div className="loading-inline"><span className="spinner-dark"/> Loading calculations…</div> : rows.length === 0 ? (
          <div className="empty-state"><h3>No calculations found</h3><p>Run a calculation with “Save my uploaded file and calculation” enabled to create your first retained record.</p></div>
        ) : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Input</th><th>Location</th><th>Date</th><th>Battery</th><th>Annual Savings</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {rows.map((item) => <tr key={`${item.source}-${item.publicId}`}>
              <td><strong>{item.inputFilename}</strong></td>
              <td>{[item.suburb,item.state,item.postcode].filter(Boolean).join(", ") || "—"}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>{item.batterySizeKwh === null ? "—" : `${item.batterySizeKwh.toFixed(2)} kWh`}</td>
              <td>{item.annualSavingsAud === null ? "—" : `$${item.annualSavingsAud.toFixed(2)}`}</td>
              <td><span className={`access-pill ${item.source}`}>{item.source === "account" ? "Account" : "This browser"}</span></td>
              <td><span className="status-pill">{item.status}</span></td>
              <td><div className="action-buttons">
                <button className="icon-button" title="View" onClick={()=>window.location.assign(`/calculator/results?id=${item.publicId}`)}><Eye size={18}/></button>
                {user && item.source === "guest" && <button className="icon-button" disabled={workingId===item.publicId} title="Add to my account" onClick={()=>claim(item)}><Link2 size={18}/></button>}
                <button className="icon-button btn-danger" disabled={workingId===item.publicId} title="Delete record" onClick={()=>remove(item)}><Trash2 size={18}/></button>
              </div></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </AppShell>
  );
}
