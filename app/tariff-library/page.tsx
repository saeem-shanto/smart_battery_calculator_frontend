"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LibraryBig } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTariffs } from "@/lib/api";
import { clearDraft } from "@/lib/draft";
import tariffData from "@/data/mock/tariffs.json";
import type { Tariff } from "@/lib/types";

export default function TariffLibraryPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>(tariffData.tariffs as unknown as Tariff[]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTariffs().then((data) => setTariffs(data.tariffs)).catch((err) => {
      setTariffs([]);
      setError(err instanceof Error ? err.message : "Could not load tariffs.");
    });
  }, []);

  function useTariff(tariff: Tariff) {
    clearDraft();
    sessionStorage.setItem("smart-battery-preferred-tariff", tariff.id);
    window.location.assign("/calculator/load-solar");
  }

  return (
    <AppShell>
      <div className="page-header"><h1>Tariff Library</h1><p>Dummy electricity tariffs available to the frontend prototype.</p></div>
      {error && <div className="error-box page-card-space">{error}</div>}
      <div className="library-grid">
          {tariffs.map((tariff) => <article className="library-card" key={tariff.id}>
            <div className="library-icon"><LibraryBig size={23}/></div>
            <div><span className="eyebrow">{tariff.provider || "Demo provider"}</span><h2>{tariff.type}</h2><p>{tariff.description || "Demonstration electricity tariff."}</p></div>
            <div className="rate-grid"><span><small>Peak</small><strong>${tariff.peak.toFixed(2)}/kWh</strong></span><span><small>Shoulder</small><strong>${tariff.shoulder.toFixed(2)}/kWh</strong></span><span><small>Off-Peak</small><strong>${tariff.offPeak.toFixed(2)}/kWh</strong></span><span><small>Feed-in</small><strong>${tariff.feedIn.toFixed(2)}/kWh</strong></span></div>
            <button className="btn btn-primary" onClick={() => useTariff(tariff)}>Use in New Calculation <ArrowRight size={17}/></button>
          </article>)}
        </div>
      <div className="notice">These are deliberately dummy values for UI development and must not be presented as current retailer offers.</div>
    </AppShell>
  );
}
