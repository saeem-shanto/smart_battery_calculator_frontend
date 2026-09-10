import initial from "@/data/mock/scenarios.json";
import type { CalculationResult, DraftCalculation, Scenario } from "@/lib/types";

type GlobalWithScenarioStore = typeof globalThis & { __smartBatteryDummyScenarios?: Scenario[] };
const root = globalThis as GlobalWithScenarioStore;

function cloneSeed() {
  return JSON.parse(JSON.stringify(initial.scenarios)) as Scenario[];
}

function store() {
  if (!root.__smartBatteryDummyScenarios) root.__smartBatteryDummyScenarios = cloneSeed();
  return root.__smartBatteryDummyScenarios;
}

function setStore(scenarios: Scenario[]) {
  root.__smartBatteryDummyScenarios = scenarios;
}

function formatDemoDate() {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
}

export async function listScenarios() {
  return store().map((scenario) => ({ ...scenario, status: scenario.status ?? "Completed" as const }));
}

export async function getScenario(id: number) {
  return (await listScenarios()).find((scenario) => scenario.id === id) ?? null;
}

export async function createScenario(input: {
  name?: string;
  recommendedBatterySize?: number;
  annualBillReduction?: number;
  calculationInput?: DraftCalculation;
  calculationResult?: CalculationResult;
}) {
  const scenarios = await listScenarios();
  const id = scenarios.reduce((max, scenario) => Math.max(max, scenario.id), 0) + 1;
  const scenario: Scenario = {
    id,
    name: input.name?.trim() || `Scenario ${id}`,
    date: formatDemoDate(),
    batterySize: Number(input.calculationResult?.recommendedBatterySize ?? input.recommendedBatterySize ?? 10),
    annualSavings: Number(input.calculationResult?.annualBillReduction ?? input.annualBillReduction ?? 0),
    status: "Completed",
    input: input.calculationInput,
    result: input.calculationResult,
  };
  const next = [scenario, ...scenarios];
  setStore(next);
  return { scenario, scenarios: next };
}

export async function updateScenario(id: number, input: Partial<Pick<Scenario, "name" | "batterySize" | "annualSavings">>) {
  const scenarios = await listScenarios();
  let updated: Scenario | null = null;
  const next = scenarios.map((scenario) => {
    if (scenario.id !== id) return scenario;
    const batterySize = input.batterySize !== undefined && Number.isFinite(Number(input.batterySize)) ? Number(input.batterySize) : scenario.batterySize;
    const annualSavings = input.annualSavings !== undefined && Number.isFinite(Number(input.annualSavings)) ? Number(input.annualSavings) : scenario.annualSavings;
    const changed: Scenario = {
      ...scenario,
      ...(input.name !== undefined ? { name: input.name.trim() || scenario.name } : {}),
      batterySize,
      annualSavings,
      ...(scenario.result ? { result: {
        ...scenario.result,
        recommendedBatterySize: batterySize,
        annualBillReduction: annualSavings,
        annualReductionPercent: scenario.result.withoutBatteryBill > 0 ? Number(((annualSavings / scenario.result.withoutBatteryBill) * 100).toFixed(1)) : 0,
        withBatteryBill: Math.max(0, scenario.result.withoutBatteryBill - annualSavings),
      } } : {}),
    };
    updated = changed;
    return changed;
  });
  if (updated) setStore(next);
  return { scenario: updated, scenarios: next };
}

export async function deleteScenario(id: number) {
  const scenarios = await listScenarios();
  const existed = scenarios.some((scenario) => scenario.id === id);
  const next = scenarios.filter((scenario) => scenario.id !== id);
  if (existed) setStore(next);
  return { deleted: existed, scenarios: next };
}
