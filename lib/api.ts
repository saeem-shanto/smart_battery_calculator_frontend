"use client";

import tariffData from "@/data/mock/tariffs.json";
import loadProfileData from "@/data/mock/load-profiles.json";
import seedData from "@/data/mock/scenarios.json";
import { analyzeCsvText } from "@/lib/csv-analyzer";
import { runDummyCalculation, validateDraft } from "@/lib/dummy-calculator";
import {
  createLocalScenario,
  deleteLocalScenario,
  hasScenarioStore,
  readScenarioStore,
  updateLocalScenario,
  writeScenarioStore,
} from "@/lib/client-store";
import type { CalculationResult, CsvSummary, DraftCalculation, LoadProfile, Scenario, Tariff } from "./types";

const NETWORK_TIMEOUT_MS = 900;
const seedScenarios = seedData.scenarios as unknown as Scenario[];

async function json<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(payload?.error || `API request failed with ${response.status}`);
  if (!payload) throw new Error("The API returned an empty response.");
  return payload;
}

async function fetchWithTimeout<T>(url: string, init?: RequestInit, timeoutMs = NETWORK_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await json<T>(await fetch(url, { ...init, signal: controller.signal, cache: "no-store" }));
  } finally {
    window.clearTimeout(timer);
  }
}

function fireAndForget(url: string, init?: RequestInit) {
  if (typeof window === "undefined") return;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 1200);
  fetch(url, { ...init, signal: controller.signal, cache: "no-store" })
    .catch(() => undefined)
    .finally(() => window.clearTimeout(timer));
}

export async function getRecentCalculations() {
  const scenarios = (await getScenarios()).scenarios;
  return { scenarios: scenarios.slice(0, 3) };
}

export async function getLoadProfiles() {
  const fallback = loadProfileData as { profiles: LoadProfile[] };
  try {
    return await fetchWithTimeout<{ profiles: LoadProfile[] }>("/api/load-profiles");
  } catch {
    return fallback;
  }
}

export async function analyzeCsv(fileName: string, text: string) {
  const local = () => analyzeCsvText(fileName, text);
  try {
    return await fetchWithTimeout<{ summary: CsvSummary; meta: { source: string; energyColumn: string; assumption: string } }>(
      "/api/csv/analyze",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName, text }) },
      1500,
    );
  } catch {
    return local();
  }
}

export async function getTariffs() {
  const fallback = tariffData as { tariffs: Tariff[] };
  try {
    return await fetchWithTimeout<{ tariffs: Tariff[] }>("/api/tariffs");
  } catch {
    return fallback;
  }
}

export async function calculateBattery(input: DraftCalculation) {
  const missing = validateDraft(input);
  if (missing.length) throw new Error(`Complete these fields first: ${missing.join(", ")}.`);

  const fallback = runDummyCalculation(input);
  try {
    return await fetchWithTimeout<CalculationResult>(
      "/api/calculate",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
      1200,
    );
  } catch {
    return fallback;
  }
}

export async function getScenarios() {
  if (typeof window === "undefined") return { scenarios: [...seedScenarios] };

  // Browser storage is the source of truth for the prototype. This makes the UI
  // work even if a development HMR/API connection is temporarily unavailable.
  if (hasScenarioStore()) return { scenarios: readScenarioStore() };

  try {
    const response = await fetchWithTimeout<{ scenarios: Scenario[] }>("/api/scenarios", undefined, 800);
    writeScenarioStore(response.scenarios);
    return response;
  } catch {
    writeScenarioStore([...seedScenarios]);
    return { scenarios: readScenarioStore() };
  }
}

export async function getScenario(id: number) {
  const scenarios = (await getScenarios()).scenarios;
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) throw new Error("Scenario not found.");
  return { scenario };
}

export async function saveScenario(input: {
  name: string;
  recommendedBatterySize: number;
  annualBillReduction: number;
  calculationInput?: DraftCalculation;
  calculationResult?: CalculationResult;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Scenario name is required.");
  if (name.length > 80) throw new Error("Scenario name must be 80 characters or fewer.");
  if (!Number.isFinite(input.recommendedBatterySize) || input.recommendedBatterySize <= 0 || input.recommendedBatterySize > 100) throw new Error("Battery size must be between 0 and 100 kWh.");
  if (!Number.isFinite(input.annualBillReduction) || input.annualBillReduction < 0 || input.annualBillReduction > 1_000_000) throw new Error("Annual savings must be between $0 and $1,000,000.");
  const local = createLocalScenario({ ...input, name });
  fireAndForget("/api/scenarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, name }),
  });
  return { ok: true, ...local };
}

export async function updateScenario(id: number, update: { name?: string; batterySize?: number; annualSavings?: number }) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("A valid scenario id is required.");
  if (update.name !== undefined) {
    const name = update.name.trim();
    if (!name) throw new Error("Scenario name cannot be empty.");
    if (name.length > 80) throw new Error("Scenario name must be 80 characters or fewer.");
    update = { ...update, name };
  }
  if (update.batterySize !== undefined && (!Number.isFinite(update.batterySize) || update.batterySize <= 0 || update.batterySize > 100)) throw new Error("Battery size must be between 0 and 100 kWh.");
  if (update.annualSavings !== undefined && (!Number.isFinite(update.annualSavings) || update.annualSavings < 0 || update.annualSavings > 1_000_000)) throw new Error("Annual savings must be between $0 and $1,000,000.");
  const local = updateLocalScenario(id, update);
  if (!local.scenario) throw new Error("Scenario not found.");
  fireAndForget(`/api/scenarios?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  return { ok: true, scenario: local.scenario, scenarios: local.scenarios };
}

export async function renameScenario(id: number, name: string) {
  return updateScenario(id, { name });
}

export async function deleteScenario(id: number) {
  const local = deleteLocalScenario(id);
  if (!local.deleted) throw new Error("Scenario not found.");
  fireAndForget(`/api/scenarios?id=${id}`, { method: "DELETE" });
  return { ok: true, scenarios: local.scenarios };
}
