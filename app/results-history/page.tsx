"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Link2, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";
import { deleteCalculation } from "@/lib/api";
import { claimCalculation, getCurrentUser, getOwnedCalculations } from "@/lib/account-api";
import { hasAuthSession } from "@/lib/backend-client";
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

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function ResultsHistoryPage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [accountUnavailable, setAccountUnavailable] = useState(false);
  const [owned, setOwned] = useState<OwnedCalculation[]>([]);
  const [guest, setGuest] = useState<LocalCalculation[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<HistoryRow | null>(null);

  async function refresh() {
    setGuest(listCalculationHistory());
    try {
      const current = await getCurrentUser();
      setUser(current);
      setAccountUnavailable(false);
      setOwned(current ? await getOwnedCalculations() : []);
    } catch (caught) {
      setUser(null);
      setOwned([]);
      setAccountUnavailable(hasAuthSession("user"));
      setError(caught instanceof Error ? `Account calculations could not be loaded: ${caught.message}` : "Account calculations could not be loaded. Browser-saved guest records are still shown.");
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
    return combined.filter((item) => !q || [item.inputFilename, item.postcode, item.suburb, item.state, item.publicId, item.status].join(" ").toLowerCase().includes(q));
  }, [owned, guest, query]);

  const total = useMemo(() => {
    const accountIds = new Set(owned.map((item) => item.public_id));
    return owned.length + guest.filter((item) => !accountIds.has(item.publicId)).length;
  }, [owned, guest]);

  async function confirmRemove(item: HistoryRow) {
    setWorkingId(item.publicId);
    setError("");
    setMessage("");
    try {
      await deleteCalculation(item.publicId, item.source === "guest" ? item.guestToken : undefined);
      if (item.source === "guest") removeHistoryItem(item.publicId);
      setDeleteTarget(null);
      setMessage("Calculation deleted successfully.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete calculation.");
    } finally {
      setWorkingId("");
    }
  }

  async function claim(item: HistoryRow) {
    if (!user || !item.guestToken) return;
    setWorkingId(item.publicId);
    setError("");
    setMessage("");
    try {
      await claimCalculation(item.publicId, item.guestToken);
      removeHistoryItem(item.publicId);
      setMessage("Calculation added to your account. Future access now uses your account session.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not claim calculation.");
    } finally {
      setWorkingId("");
    }
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
        <div className="page-header"><h1>My Calculations</h1><p>{user ? "Account-owned calculations plus guest records saved in this browser." : accountUnavailable ? "Your account session is preserved, but account records are temporarily unavailable." : "Guest calculations saved in this browser. Sign in to access account-owned records across sessions."}</p></div>
        <button className="btn btn-primary" onClick={startNew}><Plus size={18}/> New Calculation</button>
      </div>

      {!user && !accountUnavailable && <div className="account-history-note"><UserRound size={18}/><span><strong>Guest mode.</strong> <a href="/account/login?next=/results-history">Sign in</a> to own retained calculations and access them across browsers.</span></div>}
      {accountUnavailable && <div className="account-history-note warning"><UserRound size={18}/><span><strong>Account service unavailable.</strong> Your signed-in browser session has not been cleared. Guest records from this browser are still available below.</span></div>}

      <div className="history-toolbar">
        <div className="search-input-wrap"><Search size={20}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filename, location, status or calculation ID…" aria-label="Search calculations"/>{query && <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</div>
        <span className="history-count">{loading ? "Loading…" : query ? `${rows.length} of ${total} shown` : `${total} calculation${total === 1 ? "" : "s"}`}</span>
      </div>
      {error && <div className="error-box" role="alert"><strong>Could not complete that action</strong><span>{error}</span></div>}
      {message && <div className="success-box" role="status">{message}</div>}

      <section className="card page-card-space">
        {loading ? <div className="loading-inline card-loading"><span className="spinner-dark"/> Loading calculations…</div> : rows.length === 0 ? (
          <div className="empty-state"><h3>{query ? "No matching calculations" : "No calculations yet"}</h3><p>{query ? "Try a different filename, location, status, or calculation ID." : "Run a calculation with saving enabled to create your first retained record."}</p>{query ? <button className="btn" type="button" onClick={() => setQuery("")}>Clear Search</button> : <button className="btn btn-primary" type="button" onClick={startNew}>Start Calculation</button>}</div>
        ) : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Input</th><th>Location</th><th>Date</th><th>Battery</th><th>Annual Savings</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {rows.map((item) => <tr key={`${item.source}-${item.publicId}`} className={workingId === item.publicId ? "row-working" : ""}>
              <td><strong>{item.inputFilename}</strong><div className="table-subtext">{item.publicId.slice(0, 8)}…</div></td>
              <td>{[item.suburb, item.state, item.postcode].filter(Boolean).join(", ") || "—"}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>{item.batterySizeKwh === null ? "—" : `${item.batterySizeKwh.toFixed(2)} kWh`}</td>
              <td>{item.annualSavingsAud === null ? "—" : `$${item.annualSavingsAud.toFixed(2)}`}</td>
              <td><span className={`access-pill ${item.source}`}>{item.source === "account" ? "Account" : "This browser"}</span></td>
              <td><span className={statusClass(item.status)}>{item.status}</span></td>
              <td><div className="action-buttons">
                <button className="icon-button" type="button" title="View" aria-label={`View ${item.inputFilename}`} onClick={() => window.location.assign(`/calculator/results?id=${item.publicId}`)}><Eye size={18}/></button>
                {user && item.source === "guest" && <button className="icon-button" type="button" disabled={workingId === item.publicId} title="Add to my account" aria-label={`Add ${item.inputFilename} to my account`} onClick={() => claim(item)}><Link2 size={18}/></button>}
                <button className="icon-button btn-danger" type="button" disabled={workingId === item.publicId} title="Delete record" aria-label={`Delete ${item.inputFilename}`} onClick={() => setDeleteTarget(item)}><Trash2 size={18}/></button>
              </div></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>

      {deleteTarget && <div className="modal-backdrop" onMouseDown={() => setDeleteTarget(null)}><div className="modal-card confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-calculation-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><h2 id="delete-calculation-title">Delete calculation?</h2><p>{deleteTarget.inputFilename}</p></div><button className="icon-button" type="button" onClick={() => setDeleteTarget(null)} aria-label="Close"><X size={20}/></button></div>
        <p className="modal-copy">This removes the calculation record. Private files that are no longer referenced are cleaned up by the backend; shared artifacts remain while another record still references them.</p>
        <div className="modal-summary"><span>{deleteTarget.source === "account" ? "Account record" : "Browser guest record"}</span><span>{new Date(deleteTarget.createdAt).toLocaleString()}</span></div>
        <div className="modal-actions"><button className="btn" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger danger-solid" type="button" disabled={workingId === deleteTarget.publicId} onClick={() => confirmRemove(deleteTarget)}><Trash2 size={17}/> {workingId === deleteTarget.publicId ? "Deleting…" : "Delete Calculation"}</button></div>
      </div></div>}
    </AppShell>
  );
}
