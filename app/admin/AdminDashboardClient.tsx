"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BatteryCharging, CircleDollarSign, Database, ExternalLink, RefreshCcw, ShieldCheck, Trash2, UsersRound, Zap } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { deleteScenario, getScenarios, getTariffs } from "@/lib/api";
import { resetScenarioStore } from "@/lib/client-store";
import type { Scenario, Tariff } from "@/lib/types";

export default function AdminDashboardClient() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);

  useEffect(() => { void refresh(); }, []);

  async function refresh() {
    setError("");
    try {
      const [scenarioResponse, tariffResponse] = await Promise.all([getScenarios(), getTariffs()]);
      setScenarios(scenarioResponse.scenarios);
      setTariffs(tariffResponse.tariffs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin dashboard data.");
    }
  }

  const stats = useMemo(() => {
    const totalSavings = scenarios.reduce((sum, scenario) => sum + scenario.annualSavings, 0);
    const avgSavings = scenarios.length ? Math.round(totalSavings / scenarios.length) : 0;
    const avgBattery = scenarios.length ? Number((scenarios.reduce((sum, scenario) => sum + scenario.batterySize, 0) / scenarios.length).toFixed(1)) : 0;
    return { total: scenarios.length, avgSavings, avgBattery, tariffCount: tariffs.length };
  }, [scenarios, tariffs]);

  async function removeScenario(scenario: Scenario) {
    if (!window.confirm(`Admin: delete “${scenario.name}”?`)) return;
    setWorkingId(scenario.id);
    setError("");
    setMessage("");
    try {
      const response = await deleteScenario(scenario.id);
      setScenarios(response.scenarios);
      setMessage(`Scenario “${scenario.name}” was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete scenario.");
    } finally {
      setWorkingId(null);
    }
  }

  function resetDemo() {
    if (!window.confirm("Reset all browser-saved scenarios to the original demo data?")) return;
    resetScenarioStore();
    void refresh();
    setMessage("Demo scenario data was reset successfully.");
  }

  async function logout() {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    window.location.replace("/admin/login?loggedOut=1");
  }

  return (
    <AdminShell onLogout={logout}>
      <div className="page-top-row">
        <div className="page-header"><h1>Admin Dashboard</h1><p>Monitor the dummy prototype, tariffs, and saved calculation scenarios.</p></div>
        <div className="right-actions"><button className="btn" onClick={refresh}><RefreshCcw size={18}/> Refresh</button><a className="btn btn-primary" href="/dashboard"><ExternalLink size={18}/> Open User Website</a></div>
      </div>

      {error && <div className="error-box admin-message" role="alert"><strong>Admin error</strong><span>{error}</span></div>}
      {message && <div className="success-box admin-message">{message}</div>}

      <section className="admin-stat-grid">
        <AdminStat icon={<UsersRound size={22}/>} label="Saved Scenarios" value={stats.total.toLocaleString()} />
        <AdminStat icon={<CircleDollarSign size={22}/>} label="Average Annual Savings" value={`$${stats.avgSavings.toLocaleString()}`} />
        <AdminStat icon={<BatteryCharging size={22}/>} label="Average Battery Size" value={`${stats.avgBattery} kWh`} />
        <AdminStat icon={<Zap size={22}/>} label="Tariffs Available" value={stats.tariffCount.toLocaleString()} />
      </section>

      <section className="admin-grid-two">
        <div className="card admin-panel">
          <div className="card-header"><div><h2>System Status</h2><p className="admin-card-subtitle">Current prototype components</p></div><Activity size={20}/></div>
          <div className="status-list">
            <StatusRow icon={<ShieldCheck size={18}/>} name="Admin authentication" detail="Demo HttpOnly cookie session" status="Online" />
            <StatusRow icon={<Database size={18}/>} name="Scenario storage" detail="Browser localStorage with dummy API mirror" status="Online" />
            <StatusRow icon={<Zap size={18}/>} name="Calculation engine" detail="Deterministic dummy optimizer" status="Online" />
          </div>
        </div>
        <div className="card admin-panel">
          <div className="card-header"><div><h2>Demo Controls</h2><p className="admin-card-subtitle">Administrative actions for testing</p></div></div>
          <div className="admin-control-list">
            <button className="btn" onClick={refresh}><RefreshCcw size={18}/> Reload dashboard data</button>
            <button className="btn btn-danger" onClick={resetDemo}><Trash2 size={18}/> Reset demo scenarios</button>
            <a className="btn" href="/tariff-library"><Zap size={18}/> Open tariff library</a>
          </div>
        </div>
      </section>

      <section className="card admin-table-card">
        <div className="card-header"><div><h2>Recent Saved Scenarios</h2><p className="admin-card-subtitle">Admin can inspect or remove browser-saved demo calculations.</p></div></div>
        {scenarios.length === 0 ? <div className="empty-state"><h3>No scenarios</h3><p>There are currently no saved scenarios in this browser.</p></div> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Date</th><th>Battery</th><th>Annual Savings</th><th>Status</th><th>Admin Action</th></tr></thead><tbody>{scenarios.slice(0, 10).map((scenario) => <tr key={scenario.id}><td><strong>{scenario.name}</strong></td><td>{scenario.date}</td><td>{scenario.batterySize} kWh</td><td><strong>${scenario.annualSavings.toLocaleString()}</strong></td><td><span className="status-pill">{scenario.status ?? "Completed"}</span></td><td><button className="icon-button btn-danger" disabled={workingId === scenario.id} onClick={() => removeScenario(scenario)} aria-label={`Delete ${scenario.name}`}><Trash2 size={18}/></button></td></tr>)}</tbody></table></div>
        )}
      </section>
    </AdminShell>
  );
}

function AdminStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="admin-stat-card"><div className="admin-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function StatusRow({ icon, name, detail, status }: { icon: React.ReactNode; name: string; detail: string; status: string }) {
  return <div className="status-row"><div className="status-row-icon">{icon}</div><div className="status-row-copy"><strong>{name}</strong><span>{detail}</span></div><span className="status-pill">{status}</span></div>;
}
