import type { CalculationResult, DraftCalculation, SavingsPoint, UsagePattern } from "@/lib/types";
import { validateDraftDetailed } from "@/lib/validation";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals = 0) => Number(value.toFixed(decimals));

export function validateDraft(input: DraftCalculation) {
  return validateDraftDetailed(input)
    .filter((issue) => issue.level === "error")
    .map((issue) => issue.message);
}

function patternFor(input: DraftCalculation): UsagePattern {
  if (input.loadMode === "manual") return input.manualPattern ?? "balanced";
  const name = input.sampleProfile?.toLowerCase() ?? "";
  if (name.includes("evening")) return "evening-heavy";
  if (name.includes("daytime")) return "daytime-heavy";
  return "balanced";
}

export function runDummyCalculation(input: DraftCalculation): CalculationResult {
  const dailyUsage = input.loadMode === "csv"
    ? clamp(input.csvSummary?.averageDailyKWh ?? 18, 4, 80)
    : input.loadMode === "manual"
      ? clamp(input.manualDailyUsageKWh ?? 18, 4, 80)
      : clamp(input.sampleDailyUsageKWh ?? 18, 4, 80);

  const pattern = patternFor(input);
  const pvSize = clamp(input.pvSize ?? 6.6, 1, 30);
  const peak = input.peakRate ?? 0.45;
  const shoulder = input.shoulderRate ?? 0.28;
  const offPeak = input.offPeakRate ?? 0.16;
  const feedIn = input.feedInTariff ?? 0.06;
  const weightedRate = peak * 0.35 + shoulder * 0.4 + offPeak * 0.25;

  const annualLoadKWh = dailyUsage * 365;
  const annualSolarGenerationKWh = pvSize * 4.2 * 365;
  const loadFactor = clamp(dailyUsage / 18, 0.55, 2.5);
  const pvFactor = Math.pow(clamp(pvSize / 6.6, 0.45, 1.8), 0.45);
  const tariffFactor = clamp(weightedRate / 0.3095, 0.65, 1.6);
  const profileFactor = pattern === "evening-heavy" ? 1.12 : pattern === "daytime-heavy" ? 0.9 : 1;
  const scale = Math.pow(loadFactor, 0.65) * pvFactor * tariffFactor * profileFactor;

  const supplyCharge = 415;
  const solarCreditAdjustment = Math.min(annualSolarGenerationKWh * feedIn * 0.08, 260);
  const withoutBatteryBill = Math.max(450, annualLoadKWh * weightedRate + supplyCharge - solarCreditAdjustment);

  const baseSavings: Record<number, number> = { 5: 520, 10: 1050, 15: 1130, 20: 1215, 25: 1280 };
  const sizes = [5, 10, 15, 20, 25];
  const savingsCurve: SavingsPoint[] = sizes.map((size) => ({
    size,
    savings: round(Math.min(baseSavings[size] * scale, withoutBatteryBill * 0.65)),
  }));

  const score = (pvSize / 6.6 + dailyUsage / 18) / 2;
  let recommendedIndex = score < 0.75 ? 0 : score < 1.35 ? 1 : score < 1.8 ? 2 : score < 2.3 ? 3 : 4;
  const batteryCost = input.batteryCost ?? 8000;
  if (batteryCost > 12000) recommendedIndex = Math.max(0, recommendedIndex - 1);
  if (batteryCost < 5500) recommendedIndex = Math.min(4, recommendedIndex + 1);

  const recommendedBatterySize = sizes[recommendedIndex];
  const annualBillReduction = savingsCurve[recommendedIndex].savings;
  const withBatteryBill = Math.max(0, withoutBatteryBill - annualBillReduction);
  const annualReductionPercent = withoutBatteryBill > 0 ? (annualBillReduction / withoutBatteryBill) * 100 : 0;

  const scaledBatteryCost = batteryCost * (recommendedBatterySize / 10);
  const efficiencyFactor = clamp((input.efficiency ?? 90) / 90, 0.7, 1.1);
  const dodFactor = clamp((input.depthOfDischarge ?? 90) / 90, 0.7, 1.1);
  const adjustedSavings = Math.max(1, annualBillReduction * efficiencyFactor * dodFactor);
  const paybackPeriod = scaledBatteryCost / adjustedSavings;
  const years = input.projectLifetime ?? 15;
  const discount = input.discountRate ?? 6;
  const replacement = (input.replacementCost ?? batteryCost) * (years > 12 ? 0.003125 : 0);
  const netPresentValue = adjustedSavings * years * clamp(1 - discount / 100, 0.55, 1) - scaledBatteryCost - replacement;

  let selfConsumptionBeforePercent = 38;
  if (pattern === "daytime-heavy") selfConsumptionBeforePercent += 12;
  if (pattern === "evening-heavy") selfConsumptionBeforePercent -= 5;
  selfConsumptionBeforePercent = round(clamp(selfConsumptionBeforePercent + (6.6 - pvSize) * 0.7, 22, 70));
  const selfConsumptionAfterPercent = round(clamp(selfConsumptionBeforePercent + recommendedBatterySize * 3.4, selfConsumptionBeforePercent, 92));

  const annualGridImportBeforeKWh = round(annualLoadKWh * clamp(0.8 - (pvSize - 6.6) * 0.018, 0.4, 0.92));
  const annualGridImportAfterKWh = round(annualGridImportBeforeKWh * clamp(1 - recommendedBatterySize * 0.041, 0.35, 0.9));
  const estimatedAnnualExportKWh = round(Math.max(0, annualSolarGenerationKWh * (1 - selfConsumptionBeforePercent / 100)));

  return {
    recommendedBatterySize,
    annualBillReduction,
    annualReductionPercent: round(annualReductionPercent, 1),
    paybackPeriod: round(paybackPeriod, 1),
    netPresentValue: round(netPresentValue),
    withoutBatteryBill: round(withoutBatteryBill),
    withBatteryBill: round(withBatteryBill),
    selfConsumptionBeforePercent,
    selfConsumptionAfterPercent,
    annualGridImportBeforeKWh,
    annualGridImportAfterKWh,
    annualLoadKWh: round(annualLoadKWh),
    annualSolarGenerationKWh: round(annualSolarGenerationKWh),
    estimatedAnnualExportKWh,
    savingsCurve,
    meta: {
      source: "dummy API / browser fallback",
      model: "mock-optimizer-v4",
      message: "Demonstration values only. The frontend is fully wired; replace the dummy calculation endpoint with the validated optimisation backend later.",
    },
  };
}
