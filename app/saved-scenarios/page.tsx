"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { deleteScenario, getScenarios, updateScenario } from "@/lib/api";
import { clearDraft } from "@/lib/draft";
import seedData from "@/data/mock/scenarios.json";
import type { Scenario } from "@/lib/types";

export default function SavedScenariosPage() {
  const [items, setItems] = useState<Scenario[]>(seedData.scenarios as unknown as Scenario[]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [editing, setEditing] = useState<Scenario | null>(null);
  const [editForm, setEditForm] = useState({ name: "", batterySize: "", annualSavings: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);

  useEffect(() => {
    getScenarios()
      .then((data) => {
        setItems(data.scenarios);
        const viewId = Number(new URLSearchParams(window.location.search).get("view"));
        if (Number.isFinite(viewId) && viewId > 0) setSelected(data.scenarios.find((scenario) => scenario.id === viewId) ?? null);
      })
      .catch((err) => { setItems([]); setError(err instanceof Error ? err.message : "Could not load saved scenarios."); });
  }, []);

  const filtered = useMemo(() => (items || []).filter((scenario) => {
    const term = query.trim().toLowerCase();
    return !term || scenario.name.toLowerCase().includes(term) || scenario.date.toLowerCase().includes(term) || String(scenario.batterySize).includes(term);
  }), [items, query]);

  async function remove(scenario: Scenario) {
    if (!window.confirm(`Delete “${scenario.name}”?`)) return;
    setWorkingId(scenario.id);
    setError("");
    try {
      const response = await deleteScenario(scenario.id);
      setItems(response.scenarios);
      if (selected?.id === scenario.id) setSelected(null);
      setMessage("Scenario deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete scenario.");
    } finally {
      setWorkingId(null);
    }
  }

  function beginEdit(scenario: Scenario) {
    setEditing(scenario);
    setEditForm({ name: scenario.name, batterySize: String(scenario.batterySize), annualSavings: String(scenario.annualSavings) });
  }

  async function saveEdit() {
    if (!editing) return;
    const batterySize = Number(editForm.batterySize);
    const annualSavings = Number(editForm.annualSavings);
    const cleanName = editForm.name.trim();
    if (!cleanName) return setError("Scenario name cannot be empty.");
    if (cleanName.length > 80) return setError("Scenario name must be 80 characters or fewer.");
    if (!Number.isFinite(batterySize) || batterySize <= 0 || batterySize > 100) return setError("Battery size must be greater than 0 and no more than 100 kWh.");
    if (!Number.isFinite(annualSavings) || annualSavings < 0 || annualSavings > 1_000_000) return setError("Annual savings must be between $0 and $1,000,000.");

    setWorkingId(editing.id);
    setError("");
    try {
      const response = await updateScenario(editing.id, { name: cleanName, batterySize, annualSavings });
      setItems(response.scenarios);
      if (selected?.id === editing.id) setSelected(response.scenario);
      setEditing(null);
      setMessage("Scenario updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update scenario.");
    } finally {
      setWorkingId(null);
    }
  }

  function newCalculation() {
    clearDraft();
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>Saved Scenarios</h1><p>View and manage your saved calculation scenarios.</p></div>
        <button className="btn btn-primary" onClick={newCalculation}><Plus size={19}/> New Calculation</button>
      </div>

      <div className="search-input-wrap"><Search size={20}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scenarios..." aria-label="Search saved scenarios" /></div>

      {error && <div className="error-box" role="alert">{error}</div>}
      {message && <div className="success-box">{message}</div>}

      <section className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><h3>No scenarios found</h3><p>{query ? "Try a different search term." : "Run a calculation and save the result to create your first scenario."}</p>{!query && <button className="btn btn-primary" onClick={newCalculation}>Create Calculation</button>}</div>
        ) : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Scenario Name</th><th>Date</th><th>Battery Size</th><th>Annual Savings</th><th>Actions</th></tr></thead><tbody>
            {filtered.map((scenario) => (
              <tr key={scenario.id}>
                <td><strong>{scenario.name}</strong></td><td>{scenario.date}</td><td><strong>{scenario.batterySize} kWh</strong></td><td><strong>${scenario.annualSavings.toLocaleString()}</strong></td>
                <td><div className="action-buttons">
                  <button className="icon-button" aria-label={`View ${scenario.name}`} onClick={() => setSelected(scenario)}><Eye size={18}/></button>
                  <button className="icon-button" aria-label={`Edit ${scenario.name}`} onClick={() => beginEdit(scenario)}><Pencil size={18}/></button>
                  <button className="icon-button btn-danger" disabled={workingId === scenario.id} aria-label={`Delete ${scenario.name}`} onClick={() => remove(scenario)}><Trash2 size={18}/></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
      <div className="scenario-footer">Showing {filtered.length} of {items.length} saved scenarios</div>

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="modal-card modal-wide" role="dialog" aria-modal="true" aria-labelledby="scenario-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header"><div><h2 id="scenario-title">{selected.name}</h2><p>Saved {selected.date}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={20}/></button></div>
            <div className="scenario-detail-grid">
              <Detail label="Battery Size" value={`${selected.batterySize} kWh`} />
              <Detail label="Annual Savings" value={`$${selected.annualSavings.toLocaleString()}`} />
              <Detail label="PV Size" value={selected.input?.pvSize ? `${selected.input.pvSize} kW` : "—"} />
              <Detail label="Tariff" value={selected.input?.tariffType || "—"} />
              <Detail label="Payback" value={selected.result ? `${selected.result.paybackPeriod} years` : "—"} />
              <Detail label="NPV" value={selected.result ? `$${selected.result.netPresentValue.toLocaleString()}` : "—"} />
            </div>
            {selected.result?.meta?.message && <div className="notice">{selected.result.meta.message}</div>}
            <div className="modal-actions"><button className="btn" onClick={() => { setSelected(null); beginEdit(selected); }}><Pencil size={18}/> Edit</button><button className="btn" onClick={() => setSelected(null)}>Close</button></div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onMouseDown={() => !workingId && setEditing(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header"><div><h2 id="edit-title">Edit Scenario</h2><p>Update the demo scenario fields.</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close"><X size={20}/></button></div>
            <div className="field"><label htmlFor="edit-name">Scenario name</label><input id="edit-name" className="input" value={editForm.name} maxLength={80} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}/><div className="field-help">Required · maximum 80 characters.</div></div>
            <div className="form-grid compact-grid">
              <div className="field"><label htmlFor="edit-battery">Battery Size (kWh)</label><input id="edit-battery" className="input" type="number" min="0.1" max="100" step="0.1" value={editForm.batterySize} onChange={(e) => setEditForm((current) => ({ ...current, batterySize: e.target.value }))}/></div>
              <div className="field"><label htmlFor="edit-savings">Annual Savings ($)</label><input id="edit-savings" className="input" type="number" min="0" max="1000000" step="1" value={editForm.annualSavings} onChange={(e) => setEditForm((current) => ({ ...current, annualSavings: e.target.value }))}/></div>
            </div>
            <div className="modal-actions"><button className="btn" disabled={workingId === editing.id} onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={workingId === editing.id} onClick={saveEdit}>{workingId === editing.id ? "Saving..." : "Save Changes"}</button></div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="scenario-detail"><span>{label}</span><strong>{value}</strong></div>;
}
