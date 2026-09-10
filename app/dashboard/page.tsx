"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Calculator, CircleDollarSign } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SolarIllustration } from "@/components/SolarIllustration";
import { getRecentCalculations } from "@/lib/api";
import seedData from "@/data/mock/scenarios.json";
import type { Scenario } from "@/lib/types";

export default function DashboardPage() {
  const [recent, setRecent] = useState<Scenario[]>((seedData.scenarios as unknown as Scenario[]).slice(0, 3));

  useEffect(() => {
    getRecentCalculations()
      .then((data) => setRecent(data.scenarios))
      .catch(() => setRecent([]));
  }, []);

  return (
    <AppShell>
      <section className="dashboard-hero">
        <div>
          <h1>Welcome!</h1>
          <p>Calculate the optimal battery size for your solar PV system and see how much you can save.</p>
        </div>
        <SolarIllustration />
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="icon-bubble green"><Calculator size={34} /></div>
          <h3>Easy to Use</h3>
          <p>Enter your data in simple steps and get clear results.</p>
        </div>
        <div className="feature-card">
          <div className="icon-bubble purple"><BarChart3 size={34} /></div>
          <h3>Smart Optimization</h3>
          <p>Our calculator compares battery sizes and presents a clear recommendation.</p>
        </div>
        <div className="feature-card">
          <div className="icon-bubble gold"><CircleDollarSign size={35} /></div>
          <h3>Save Money</h3>
          <p>Reduce electricity costs and make better use of rooftop solar energy.</p>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Recent Calculations</h2>
          <a className="card-header-link" href="/saved-scenarios">View All <ArrowRight size={17} /></a>
        </div>
        <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Scenario Name</th><th>Date</th><th>Battery Size</th><th>Annual Savings</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td><td>{s.date}</td><td><strong>{s.batterySize} kWh</strong></td>
                    <td><strong>${s.annualSavings.toLocaleString()}</strong></td><td><span className="status-pill">{s.status || "Completed"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>
    </AppShell>
  );
}
