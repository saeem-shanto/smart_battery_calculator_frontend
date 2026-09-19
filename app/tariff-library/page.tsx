"use client";

import { useEffect, useMemo, useState } from "react";
import { LibraryBig, RefreshCcw, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTariffs } from "@/lib/api";
import type { BackendTariff } from "@/lib/types";

export default function TariffLibraryPage() {
  const [items, setItems] = useState<BackendTariff[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try { setItems(await getTariffs()); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load tariffs."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const kinds = useMemo(() => [...new Set(items.map((item) => item.kind).filter(Boolean))].sort(), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !q || [item.name, item.provider, item.kind, item.notes].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchesKind = !kind || item.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [items, query, kind]);

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>Tariff Library</h1><p>Reference tariff records from the Django backend. The current client optimisation still uses its own fixed retail and feed-in rates.</p></div>
        <button className="btn" type="button" onClick={load} disabled={loading}><RefreshCcw size={18}/> {loading ? "Refreshing…" : "Refresh"}</button>
      </div>

      <div className="notice page-card-space"><strong>Reference only:</strong>&nbsp; Selecting or viewing a tariff here does not change the current production optimisation. The client MATLAB constants remain retail <strong>$0.3773/kWh</strong> and feed-in <strong>$0.124/kWh</strong>.</div>

      <div className="library-toolbar">
        <div className="search-input-wrap"><Search size={20}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search provider, tariff name or type…" aria-label="Search tariff library"/>{query && <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</div>
        <select className="input library-kind-filter" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter tariff type"><option value="">All tariff types</option>{kinds.map((value) => <option value={value} key={value}>{value}</option>)}</select>
        <span className="history-count">{loading ? "Loading…" : `${filtered.length} of ${items.length}`}</span>
      </div>

      {error && <div className="error-box" role="alert"><strong>Could not load tariff library</strong><span>{error}</span><button className="text-button" type="button" onClick={load}>Try again</button></div>}

      {loading ? (
        <div className="loading-inline card-loading"><span className="spinner-dark"/> Loading tariff reference data…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><h3>{items.length ? "No matching tariffs" : "No active tariffs"}</h3><p>{items.length ? "Try a different search or tariff type." : "The admin can create tariff reference records from the backend."}</p>{items.length > 0 && <button className="btn" type="button" onClick={() => { setQuery(""); setKind(""); }}>Clear Filters</button>}</div>
      ) : (
        <div className="library-grid">
          {filtered.map((item) => <article className="library-card" key={item.id}>
            <div className="library-icon"><LibraryBig size={22}/></div>
            <div><div className="eyebrow">{item.provider || "Tariff"}</div><h2>{item.name}</h2><p>{item.notes || "Reference tariff record supplied by the backend."}</p></div>
            <div className="rate-grid">
              <span><small>Flat/Peak</small><strong>{formatRate(item.flat_import_rate ?? item.peak_import_rate)}</strong></span>
              <span><small>Feed-in</small><strong>{formatRate(item.feed_in_rate)}</strong></span>
              <span><small>Demand</small><strong>{formatDemand(item.demand_charge_rate_per_kw_day)}</strong></span>
              <span><small>Type</small><strong>{item.kind || "—"}</strong></span>
            </div>
          </article>)}
        </div>
      )}
    </AppShell>
  );
}

function formatRate(value: number | null | undefined) {
  return value == null ? "—" : `$${Number(value).toFixed(3)}/kWh`;
}

function formatDemand(value: number | null | undefined) {
  return value == null ? "—" : `$${Number(value).toFixed(2)}/kW/day`;
}
