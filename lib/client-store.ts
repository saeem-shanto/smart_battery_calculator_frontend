"use client";

import seedData from "@/data/mock/scenarios.json";
import type { CalculationResult, DraftCalculation, Scenario } from "@/lib/types";

const STORAGE_KEY = "smart-battery-scenarios-v4";
const seedScenarios = seedData.scenarios as unknown as Scenario[];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sanitizeScenario(value: unknown): Scenario | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = Number(raw.id);
  const batterySize = Number(raw.batterySize);
  const annualSavings = Number(raw.annualSavings);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.trim().length > 80) return null;
  if (typeof raw.date !== "string" || !raw.date.trim()) return null;
  if (!Number.isFinite(batterySize) || batterySize <= 0 || batterySize > 100) return null;
  if (!Number.isFinite(annualSavings) || annualSavings < 0 || annualSavings > 1_000_000) return null;

  return {
    id,
    name: raw.name.trim(),
    date: raw.date,
    batterySize,
    annualSavings,
    status: raw.status === "Draft" ? "Draft" : "Completed",
    input: raw.input && typeof raw.input === "object" ? raw.input as DraftCalculation : undefined,
    result: raw.result && typeof raw.result === "object" ? raw.result as CalculationResult : undefined,
  };
}

export function hasScenarioStore() {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(STORAGE_KEY) !== null; }
  catch { return false; }
}

export function readScenarioStore(): Scenario[] {
  if (typeof window === "undefined") return clone(seedScenarios);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = clone(seedScenarios);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Scenario store is not an array.");
    const clean = parsed.map(sanitizeScenario).filter((scenario): scenario is Scenario => scenario !== null);
    if (!clean.length && parsed.length) throw new Error("Scenario store contains no valid records.");
    if (clean.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return clean;
  } catch {
    const fallback = clone(seedScenarios);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback)); } catch {}
    return fallback;
  }
}

export function writeScenarioStore(scenarios: Scenario[]) {
  if (typeof window === "undefined") return;
  try {
    const clean = scenarios.map(sanitizeScenario).filter((scenario): scenario is Scenario => scenario !== null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent("smart-battery-scenarios-changed"));
  } catch {
    // Storage can be blocked by browser privacy settings; the current page still works.
  }
}

export function resetScenarioStore() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  writeScenarioStore(clone(seedScenarios));
}

function formatDate() {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
}

export function createLocalScenario(input: {
  name: string;
  recommendedBatterySize: number;
  annualBillReduction: number;
  calculationInput?: DraftCalculation;
  calculationResult?: CalculationResult;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Scenario name is required.");
  if (name.length > 80) throw new Error("Scenario name must be 80 characters or fewer.");

  const batterySize = input.calculationResult?.recommendedBatterySize ?? input.recommendedBatterySize;
  const annualSavings = input.calculationResult?.annualBillReduction ?? input.annualBillReduction;
  if (!Number.isFinite(batterySize) || batterySize <= 0 || batterySize > 100) throw new Error("Battery size must be between 0 and 100 kWh.");
  if (!Number.isFinite(annualSavings) || annualSavings < 0 || annualSavings > 1_000_000) throw new Error("Annual savings must be between $0 and $1,000,000.");

  const scenarios = readScenarioStore();
  const id = scenarios.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const scenario: Scenario = {
    id,
    name,
    date: formatDate(),
    batterySize,
    annualSavings,
    status: "Completed",
    input: input.calculationInput,
    result: input.calculationResult,
  };
  const next = [scenario, ...scenarios];
  writeScenarioStore(next);
  return { scenario, scenarios: next };
}

export function updateLocalScenario(id: number, update: { name?: string; batterySize?: number; annualSavings?: number }) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("A valid scenario id is required.");
  const scenarios = readScenarioStore();
  let updated: Scenario | null = null;
  const next = scenarios.map((scenario) => {
    if (scenario.id !== id) return scenario;
    const batterySize = update.batterySize ?? scenario.batterySize;
    const annualSavings = update.annualSavings ?? scenario.annualSavings;
    const name = update.name !== undefined ? update.name.trim() : scenario.name;
    if (!name || name.length > 80) throw new Error("Scenario name must contain 1–80 characters.");
    if (!Number.isFinite(batterySize) || batterySize <= 0 || batterySize > 100) throw new Error("Battery size must be between 0 and 100 kWh.");
    if (!Number.isFinite(annualSavings) || annualSavings < 0 || annualSavings > 1_000_000) throw new Error("Annual savings must be between $0 and $1,000,000.");

    updated = {
      ...scenario,
      name,
      batterySize,
      annualSavings,
      result: scenario.result ? {
        ...scenario.result,
        recommendedBatterySize: batterySize,
        annualBillReduction: annualSavings,
        annualReductionPercent: scenario.result.withoutBatteryBill > 0
          ? Number(((annualSavings / scenario.result.withoutBatteryBill) * 100).toFixed(1))
          : 0,
        withBatteryBill: Math.max(0, scenario.result.withoutBatteryBill - annualSavings),
      } : undefined,
    };
    return updated;
  });
  if (updated) writeScenarioStore(next);
  return { scenario: updated, scenarios: next };
}

export function deleteLocalScenario(id: number) {
  if (!Number.isInteger(id) || id <= 0) return { deleted: false, scenarios: readScenarioStore() };
  const scenarios = readScenarioStore();
  const next = scenarios.filter((scenario) => scenario.id !== id);
  const deleted = next.length !== scenarios.length;
  if (deleted) writeScenarioStore(next);
  return { deleted, scenarios: next };
}
