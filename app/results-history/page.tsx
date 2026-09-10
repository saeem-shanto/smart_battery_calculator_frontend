"use client";

import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getScenarios } from "@/lib/api";
import { clearDraft } from "@/lib/draft";
import seedData from "@/data/mock/scenarios.json";
import type { Scenario } from "@/lib/types";

export default function ResultsHistoryPage() {
  const [items, setItems] = useState<Scenario[]>(seedData.scenarios as unknown as Scenario[]);
  const [error, setError] = useState("");

  useEffect(() => {
    getScenarios().then((data) => setItems(data.scenarios)).catch((err) => {
      setItems([]);
      setError(err instanceof Error ? err.message : "Could not load result history.");
    });
  }, []);

  function startNew() {
    clearDraft();
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>Results History</h1><p>Recent completed calculations and saved demo results.</p></div>
        <button className="btn btn-primary" onClick={startNew}><Plus size={18}/> New Calculation</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <section className="card page-card-space">
        {items.length === 0 ? <div className="empty-state"><h3>No results yet</h3><p>Complete your first calculation to create a result.</p><button className="btn btn-primary" onClick={startNew}>Start Calculation</button></div> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Scenario</th><th>Date</th><th>Recommended Battery</th><th>Annual Savings</th><th>Status</th><th></th></tr></thead><tbody>
            {items.map((scenario) => <tr key={scenario.id}><td><strong>{scenario.name}</strong></td><td>{scenario.date}</td><td><strong>{scenario.batterySize} kWh</strong></td><td><strong>${scenario.annualSavings.toLocaleString()}</strong></td><td><span className="status-pill">{scenario.status || "Completed"}</span></td><td><button className="icon-button" aria-label={`Open ${scenario.name}`} onClick={() => window.location.assign(`/saved-scenarios?view=${scenario.id}`)}><Eye size={18}/></button></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </AppShell>
  );
}
