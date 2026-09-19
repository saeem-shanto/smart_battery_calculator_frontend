"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, BatteryCharging, Database, Download, Eye, FileSpreadsheet, RefreshCcw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  deleteAdminCalculation,
  deleteAdminFile,
  downloadAdminFile,
  getAdminCalculation,
  getAdminCalculations,
  getAdminSummary,
  logoutAdmin,
  updateAdminCalculation,
} from "@/lib/admin-api";
import { getReadiness } from "@/lib/api";
import type { AdminCalculationDetail, AdminCalculationRow, AdminSummary } from "@/lib/types";

type EditErrors = { postcode?: string; metadata?: string };
type ConfirmAction = { kind: "record" } | { kind: "file"; fileId: string; filename: string };

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function AdminDashboardClient() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [rows, setRows] = useState<AdminCalculationRow[]>([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [postcode, setPostcode] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<AdminCalculationDetail | null>(null);
  const [edit, setEdit] = useState({ postcode: "", suburb: "", state: "", metadata: "{}" });
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState<string>("Checking");
  const [workingFile, setWorkingFile] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  async function load(mode: "initial" | "refresh" = "refresh") {
    if (mode === "initial") setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const params = new URLSearchParams({ page_size: "100" });
      if (q.trim()) params.set("q", q.trim());
      if (postcode.trim()) params.set("postcode", postcode.trim());
      if (status) params.set("status", status);
      const [s, list] = await Promise.all([getAdminSummary(), getAdminCalculations(params)]);
      setSummary(s);
      setRows(list.results);
      setCount(list.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load administration data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
    getReadiness().then((r) => setReady(r.status === "ready" ? "Ready" : "Not ready")).catch(() => setReady("Unavailable"));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);

  async function open(row: AdminCalculationRow) {
    setError("");
    setMessage("");
    try {
      const detail = await getAdminCalculation(row.public_id);
      setSelected(detail);
      setEdit({ postcode: detail.postcode || "", suburb: detail.suburb || "", state: detail.state || "", metadata: JSON.stringify(detail.metadata || {}, null, 2) });
      setEditErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load record.");
    }
  }

  async function saveRecord(event: FormEvent) {
    event.preventDefault();
    if (!selected || savingRecord) return;
    const nextErrors: EditErrors = {};
    if (edit.postcode && !/^\d{4}$/.test(edit.postcode)) nextErrors.postcode = "Postcode must be four digits or blank.";
    let metadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(edit.metadata || "{}");
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
      metadata = parsed as Record<string, unknown>;
    } catch {
      nextErrors.metadata = "Metadata must be a valid JSON object.";
    }
    if (Object.keys(nextErrors).length) {
      setEditErrors(nextErrors);
      return;
    }

    setSavingRecord(true);
    setError("");
    setMessage("");
    try {
      const detail = await updateAdminCalculation(selected.public_id, { postcode: edit.postcode, suburb: edit.suburb, state: edit.state, metadata });
      setSelected(detail);
      setMessage("Record information updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update record.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function removeRecord() {
    if (!selected) return;
    setConfirmAction(null);
    setDeletingRecord(true);
    setError("");
    try {
      await deleteAdminCalculation(selected.public_id);
      setSelected(null);
      setMessage("Calculation record deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete record.");
    } finally {
      setDeletingRecord(false);
    }
  }

  async function removeFile(fileId: string, filename: string) {
    if (!selected) return;
    setConfirmAction(null);
    setWorkingFile(fileId);
    setError("");
    try {
      const response = await deleteAdminFile(selected.public_id, fileId);
      setMessage(`${response.filename} deleted. ${response.affected_calculation_records} record(s) were affected.`);
      const detail = await getAdminCalculation(selected.public_id);
      setSelected(detail);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete file.");
    } finally {
      setWorkingFile("");
    }
  }

  async function downloadFile(fileId: string, filename: string) {
    if (!selected) return;
    setWorkingFile(fileId);
    setError("");
    try {
      await downloadAdminFile(selected.public_id, fileId, filename);
      setMessage(`${filename} download started.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setWorkingFile("");
    }
  }

  async function logout() {
    await logoutAdmin().catch(() => undefined);
    window.location.replace("/admin/login?loggedOut=1");
  }

  function clearFilters() {
    setQ("");
    setPostcode("");
    setStatus("");
    window.setTimeout(() => void load(), 0);
  }

  const avgBattery = useMemo(() => {
    const values = rows.map((row) => row.optimal_battery_size_kwh).filter((value): value is number => typeof value === "number");
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "—";
  }, [rows]);
  const filtersActive = Boolean(q.trim() || postcode.trim() || status);

  return (
    <AdminShell onLogout={logout}>
      <div className="page-top-row">
        <div className="page-header"><h1>Administration</h1><p>Search calculation records, inspect result metadata, and manage stored input/CSV files.</p></div>
        <button className="btn" type="button" onClick={() => load()} disabled={refreshing}><RefreshCcw size={18}/> {refreshing ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <div className="error-box admin-message" role="alert"><strong>Administration error</strong><span>{error}</span></div>}
      {message && <div className="success-box admin-message" role="status">{message}</div>}

      <section className="admin-stat-grid" aria-label="Administration summary">
        <Stat icon={<Database size={22}/>} label="All Calculations" value={String(summary?.calculations.all_time ?? 0)}/>
        <Stat icon={<Activity size={22}/>} label="Last 30 Days" value={String(summary?.calculations.last_30_days ?? 0)}/>
        <Stat icon={<BatteryCharging size={22}/>} label="Avg Battery (visible)" value={`${avgBattery}${avgBattery !== "—" ? " kWh" : ""}`}/>
        <Stat icon={<ShieldCheck size={22}/>} label="Backend" value={ready}/>
      </section>

      <section className="card admin-filter-card">
        <form className="admin-filter-grid" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <div className="search-input-wrap admin-search"><Search size={18}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search file, suburb, state, hash or ID" aria-label="Search calculation records"/></div>
          <input className="input" value={postcode} onChange={(event) => setPostcode(event.target.value.replace(/\D/g, ""))} maxLength={4} placeholder="Postcode" aria-label="Filter by postcode"/>
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option><option value="completed">Completed</option><option value="processing">Processing</option><option value="failed">Failed</option></select>
          <div className="admin-filter-actions"><button className="btn btn-primary" type="submit" disabled={refreshing}>Apply Filters</button>{filtersActive && <button className="btn" type="button" onClick={clearFilters}>Clear</button>}</div>
        </form>
      </section>

      <section className="card admin-table-card">
        <div className="card-header"><div><h2>Calculation Records</h2><p className="admin-card-subtitle">Showing {rows.length} of {count} record{count === 1 ? "" : "s"}{filtersActive ? " for the current filters" : ""}.</p></div></div>
        {loading ? <div className="loading-inline card-loading"><span className="spinner-dark"/> Loading records…</div> : rows.length === 0 ? <div className="empty-state"><h3>No records found</h3><p>Adjust the filters or run a calculation from the user site.</p>{filtersActive && <button className="btn" type="button" onClick={clearFilters}>Clear Filters</button>}</div> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Postcode</th><th>Input</th><th>Battery</th><th>Net Payment</th><th>Savings</th><th>Files</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.public_id}><td>{new Date(row.created_at).toLocaleString()}</td><td>{row.postcode || "—"}</td><td><strong>{row.input_filename || "—"}</strong><div className="table-subtext">{[row.suburb, row.state].filter(Boolean).join(", ") || row.public_id.slice(0, 8) + "…"}</div></td><td>{row.optimal_battery_size_kwh == null ? "—" : `${row.optimal_battery_size_kwh.toFixed(2)} kWh`}</td><td>{row.net_annual_payment_aud == null ? "—" : `$${row.net_annual_payment_aud.toFixed(2)}`}</td><td>{row.estimated_annual_bill_reduction_aud == null ? "—" : `$${row.estimated_annual_bill_reduction_aud.toFixed(2)}`}</td><td><span className={row.has_input_file ? "file-dot ok" : "file-dot"}>Input</span> <span className={row.has_csv_file ? "file-dot ok" : "file-dot"}>CSV</span></td><td><span className={statusClass(row.status)}>{row.status}</span></td><td><button className="icon-button" type="button" onClick={() => open(row)} title="View record" aria-label={`View calculation ${row.public_id}`}><Eye size={18}/></button></td></tr>)}
          </tbody></table></div>
        )}
      </section>

      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><div className="modal-card modal-admin-detail" role="dialog" aria-modal="true" aria-labelledby="admin-record-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><h2 id="admin-record-title">Calculation Record</h2><p>{selected.public_id}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close record"><X size={20}/></button></div>
        <div className="scenario-detail-grid">
          <Detail label="Status" value={selected.status}/><Detail label="Input" value={selected.input_filename || "Deleted / unavailable"}/><Detail label="Input SHA-256" value={selected.input_sha256 || "—"}/><Detail label="Runtime" value={formatRuntime(selected.runtime_ms)}/><Detail label="Battery" value={selected.result_payload.optimal_battery_size_kwh == null ? "—" : `${selected.result_payload.optimal_battery_size_kwh} kWh`}/><Detail label="Net payment" value={selected.result_payload.net_annual_payment_aud == null ? "—" : `$${selected.result_payload.net_annual_payment_aud}`}/>
        </div>
        {(selected.error_code || selected.error_message) && <div className="error-box modal-record-error"><strong>{selected.error_code || "Calculation error"}</strong><span>{selected.error_message || "The calculation did not complete."}</span></div>}
        {selected.warnings.length > 0 && <div className="notice modal-record-warning"><strong>Warnings:</strong> {selected.warnings.join(" ")}</div>}

        <form onSubmit={saveRecord} className="admin-record-form" noValidate>
          <h3>Record information</h3>
          <div className="form-grid">
            <div className={`field${editErrors.postcode ? " has-error" : ""}`}><label htmlFor="admin-record-postcode">Postcode</label><input id="admin-record-postcode" className={`input${editErrors.postcode ? " input-error" : ""}`} value={edit.postcode} maxLength={4} inputMode="numeric" onChange={(event) => { setEdit((value) => ({ ...value, postcode: event.target.value.replace(/\D/g, "") })); setEditErrors((current) => ({ ...current, postcode: undefined })); }}/>{editErrors.postcode && <div className="field-message error">{editErrors.postcode}</div>}</div>
            <div className="field"><label htmlFor="admin-record-suburb">Suburb</label><input id="admin-record-suburb" className="input" value={edit.suburb} onChange={(event) => setEdit((value) => ({ ...value, suburb: event.target.value }))}/></div>
            <div className="field"><label htmlFor="admin-record-state">State</label><input id="admin-record-state" className="input" value={edit.state} onChange={(event) => setEdit((value) => ({ ...value, state: event.target.value }))}/></div>
          </div>
          <div className={`field${editErrors.metadata ? " has-error" : ""}`}><label htmlFor="admin-record-metadata">Metadata JSON</label><textarea id="admin-record-metadata" className={`input metadata-editor${editErrors.metadata ? " input-error" : ""}`} value={edit.metadata} onChange={(event) => { setEdit((value) => ({ ...value, metadata: event.target.value })); setEditErrors((current) => ({ ...current, metadata: undefined })); }} spellCheck={false}/>{editErrors.metadata && <div className="field-message error">{editErrors.metadata}</div>}<div className="field-help">Must be a JSON object. This metadata is for record/audit information only.</div></div>
          <button className="btn btn-primary" type="submit" disabled={savingRecord}>{savingRecord ? "Saving…" : "Save Record Information"}</button>
        </form>

        <div className="admin-files"><h3>Stored files</h3>{selected.files.length === 0 ? <p className="muted-copy">No stored input or CSV remains for this record.</p> : selected.files.map((file) => <div className="admin-file-row" key={file.id}><FileSpreadsheet size={19}/><div><strong>{file.filename}</strong><span>{file.kind} · {(file.size_bytes / 1024).toFixed(1)} KB</span></div><button className="icon-button" type="button" disabled={workingFile === file.id} onClick={() => void downloadFile(file.id, file.filename)} title="Download" aria-label={`Download ${file.filename}`}><Download size={18}/></button><button className="icon-button btn-danger" type="button" disabled={workingFile === file.id} onClick={() => setConfirmAction({kind:"file",fileId:file.id,filename:file.filename})} title="Delete file" aria-label={`Delete ${file.filename}`}><Trash2 size={18}/></button></div>)}</div>
        <div className="modal-actions"><button className="btn btn-danger" type="button" onClick={()=>setConfirmAction({kind:"record"})}><Trash2 size={18}/> Delete Record</button><button className="btn" type="button" onClick={() => setSelected(null)}>Close</button></div>
      </div></div>}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.kind === "file" ? "Delete stored file?" : "Delete calculation record?"}
        message={confirmAction?.kind === "file"
          ? `Delete ${confirmAction.filename}? The calculation record will remain, but this stored artifact will no longer be downloadable.`
          : "Delete this calculation record? Unreferenced private files are cleaned up automatically; shared artifacts remain while another record references them."}
        confirmLabel={confirmAction?.kind === "file" ? "Delete File" : "Delete Record"}
        busy={confirmAction?.kind === "file" ? Boolean(workingFile) : deletingRecord}
        onCancel={()=>setConfirmAction(null)}
        onConfirm={()=>{
          if (confirmAction?.kind === "file") void removeFile(confirmAction.fileId, confirmAction.filename);
          else if (confirmAction?.kind === "record") void removeRecord();
        }}
      />
    </AdminShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="admin-stat-card"><div className="admin-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="scenario-detail"><span>{label}</span><strong>{value}</strong></div>;
}

function formatRuntime(milliseconds: number) {
  if (!Number.isFinite(milliseconds)) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  const seconds = milliseconds / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}
