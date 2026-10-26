/** UI schema for the client's updated batt_cal_v1.m (calculated exclusively in Django). */
export type AlgorithmV1Inputs = {
  batteryCapacityKwh: number;
  pvCapacityKw: number;
  retailTariff24h: number[];
  feedInTariff24h: number[];
  interestRatePercent: number;
  installationCostAud: number;
  loanPeriodYears: number;
  dailySupplyChargeAud: number;
};

// Defaults are transcribed from batt_cal_v1.m, not current electricity prices.
export const V1_RETAIL_DEFAULTS = [
  .33, .165, .165, .165, .165, .165, .165, .165, .165, .33, .33, .33,
  .22, .22, .33, .33, .33, .33, .33, .33, .33, .33, .33, .33,
];
export const V1_FEED_IN_DEFAULTS = [
  .03, .03, .03, .03, .03, 0, 0, 0, 0, 0, 0, 0,
  .02, .02, .03, .03, .03, .03, .03, .03, .03, .03, .03, .03,
];

export const V1_DEFAULTS: AlgorithmV1Inputs = {
  batteryCapacityKwh: 15,
  pvCapacityKw: 6,
  retailTariff24h: [...V1_RETAIL_DEFAULTS],
  feedInTariff24h: [...V1_FEED_IN_DEFAULTS],
  interestRatePercent: 2,
  installationCostAud: 8000,
  loanPeriodYears: 10,
  dailySupplyChargeAud: 1.01,
};

export type V1NumericField = "batteryCapacityKwh" | "pvCapacityKw" | "interestRatePercent" | "installationCostAud" | "loanPeriodYears" | "dailySupplyChargeAud";
export const V1_RULES: Record<V1NumericField, { min: number; max: number; step: number; label: string; unit: string }> = {
  batteryCapacityKwh: { min: 1, max: 50, step: .5, label: "Battery capacity", unit: "kWh" },
  pvCapacityKw: { min: .5, max: 30, step: .5, label: "Solar PV capacity", unit: "kW" },
  interestRatePercent: { min: 0, max: 20, step: .1, label: "Annual interest rate", unit: "%" },
  installationCostAud: { min: 0, max: 100000, step: 100, label: "Total installation cost", unit: "AUD" },
  loanPeriodYears: { min: 1, max: 30, step: 1, label: "Loan period", unit: "years" },
  dailySupplyChargeAud: { min: 0, max: 5, step: .01, label: "Daily supply charge", unit: "AUD/day" },
};

/** Rejects empty input (Number("") alone would incorrectly be treated as zero). */
export function numericError(raw: string, field: V1NumericField): string {
  const rule = V1_RULES[field];
  if (!raw.trim()) return `Enter ${rule.label.toLowerCase()}.`;
  const value = Number(raw);
  if (!Number.isFinite(value)) return `Enter a valid number for ${rule.label.toLowerCase()}.`;
  if (value < rule.min || value > rule.max) return `${rule.label} must be between ${rule.min} and ${rule.max} ${rule.unit}.`;
  if (field === "loanPeriodYears" && !Number.isInteger(value)) return "Loan period must be a whole number of years.";
  return "";
}

export function tariffError(values: string[], label: string): string {
  if (values.length !== 24) return `${label} must contain 24 hourly values.`;
  if (values.some(v => !v.trim() || !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 5)) {
    return `${label}: enter 24 values between $0 and $5 per kWh.`;
  }
  return "";
}

export function validV1Inputs(inputs: AlgorithmV1Inputs | undefined): inputs is AlgorithmV1Inputs {
  if (!inputs) return false;
  const numericFields: V1NumericField[] = ["batteryCapacityKwh", "pvCapacityKw", "interestRatePercent", "installationCostAud", "loanPeriodYears", "dailySupplyChargeAud"];
  return numericFields.every(field => !numericError(String(inputs[field]), field)) &&
    Array.isArray(inputs.retailTariff24h) && Array.isArray(inputs.feedInTariff24h) &&
    !tariffError(inputs.retailTariff24h.map(String), "Retail tariff") &&
    !tariffError(inputs.feedInTariff24h.map(String), "Feed-in tariff");
}

export function dailyConsumption(loads: number[]): number | null {
  if (loads.length !== 24 || loads.some(v => !Number.isFinite(v) || v < 0)) return null;
  return loads.reduce((sum, v) => sum + v, 0);
}


/** Human-readable 24-hour tariff slot, using the same hour index as MATLAB. */
export function hourRange(hour: number): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError("Hour index must be an integer from 0 to 23.");
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hour)}:00–${pad((hour + 1) % 24)}:00`;
}
