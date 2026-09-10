import type { CsvSummary, DraftCalculation, LoadProfile, Tariff, UsagePattern } from "@/lib/types";

export type ValidationIssue = {
  field: string;
  message: string;
  level: "error" | "warning";
};

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function validateLoadSolarInput(input: {
  mode: "csv" | "manual" | "sample";
  csvSummary: CsvSummary | null;
  manualDailyUsage: string;
  manualPattern: UsagePattern;
  selectedProfile?: LoadProfile;
  pvSize: string;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pv = Number(input.pvSize);

  if (!input.pvSize.trim()) issues.push({ field: "pvSize", level: "error", message: "PV system size is required." });
  else if (!Number.isFinite(pv)) issues.push({ field: "pvSize", level: "error", message: "PV system size must be a valid number." });
  else if (pv < 1 || pv > 30) issues.push({ field: "pvSize", level: "error", message: "PV system size must be between 1 and 30 kW." });
  else {
    if (pv < 2) issues.push({ field: "pvSize", level: "warning", message: "A PV size below 2 kW is unusually small for a modern residential system." });
    if (pv > 15) issues.push({ field: "pvSize", level: "warning", message: "A PV size above 15 kW is relatively large for a household. Confirm the value is correct." });
  }

  if (input.mode === "csv") {
    if (!input.csvSummary) {
      issues.push({ field: "csv", level: "error", message: "Upload and successfully analyse a CSV file before continuing." });
    } else {
      if (input.csvSummary.rowCount < 2) issues.push({ field: "csv", level: "error", message: "The CSV does not contain enough usage rows." });
      if (input.csvSummary.averageDailyKWh <= 0) issues.push({ field: "csv", level: "error", message: "The CSV produced an invalid average daily usage value." });
      if (input.csvSummary.averageDailyKWh < 3) issues.push({ field: "csv", level: "warning", message: "The analysed usage is below 3 kWh/day. Check that the detected energy column and units are correct." });
      if (input.csvSummary.averageDailyKWh > 80) issues.push({ field: "csv", level: "warning", message: "The analysed usage is above 80 kWh/day. Check for cumulative readings or incorrect units." });
      if (input.csvSummary.intervalCount < 24) issues.push({ field: "csv", level: "warning", message: "The CSV contains limited data, so the demo estimate may be less representative." });
    }
  }

  if (input.mode === "manual") {
    const daily = Number(input.manualDailyUsage);
    if (!input.manualDailyUsage.trim()) issues.push({ field: "manualDailyUsage", level: "error", message: "Average daily electricity usage is required." });
    else if (!Number.isFinite(daily)) issues.push({ field: "manualDailyUsage", level: "error", message: "Average daily electricity usage must be a valid number." });
    else if (daily < 1 || daily > 100) issues.push({ field: "manualDailyUsage", level: "error", message: "Average daily electricity usage must be between 1 and 100 kWh/day." });
    else {
      if (daily < 5) issues.push({ field: "manualDailyUsage", level: "warning", message: "Usage below 5 kWh/day is quite low. Confirm this is a daily value, not an hourly value." });
      if (daily > 50) issues.push({ field: "manualDailyUsage", level: "warning", message: "Usage above 50 kWh/day is high for many households. Confirm the figure and units." });
    }
    if (!input.manualPattern) issues.push({ field: "manualPattern", level: "error", message: "Choose a typical household usage pattern." });
  }

  if (input.mode === "sample" && !input.selectedProfile) {
    issues.push({ field: "sampleProfile", level: "error", message: "Choose a sample load profile." });
  }

  return issues;
}

export function validateTariffInput(input: { tariff?: Tariff; feedIn: string; demand: string }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.tariff?.id) issues.push({ field: "tariff", level: "error", message: "Choose a tariff before continuing." });

  if (input.tariff) {
    const rates = [input.tariff.peak, input.tariff.shoulder, input.tariff.offPeak];
    if (rates.some((value) => !Number.isFinite(value) || value < 0 || value > 2)) {
      issues.push({ field: "tariff", level: "error", message: "The selected tariff contains an invalid usage rate." });
    }
    if (input.tariff.peak < input.tariff.offPeak) {
      issues.push({ field: "tariff", level: "warning", message: "Peak rate is lower than off-peak rate. Confirm this tariff is configured correctly." });
    }
  }

  const feedIn = Number(input.feedIn);
  if (!input.feedIn.trim()) issues.push({ field: "feedIn", level: "error", message: "Feed-in tariff is required. Enter 0 if there is no export payment." });
  else if (!Number.isFinite(feedIn)) issues.push({ field: "feedIn", level: "error", message: "Feed-in tariff must be a valid number." });
  else if (feedIn < 0 || feedIn > 2) issues.push({ field: "feedIn", level: "error", message: "Feed-in tariff must be between $0.00 and $2.00 per kWh." });
  else {
    if (feedIn > 0.5) issues.push({ field: "feedIn", level: "warning", message: "A feed-in tariff above $0.50/kWh is unusually high. Confirm the unit and value." });
    if (input.tariff && feedIn > input.tariff.peak) issues.push({ field: "feedIn", level: "warning", message: "Feed-in tariff is higher than the peak import rate. Confirm this is intentional." });
  }

  const demand = Number(input.demand);
  if (!input.demand.trim()) issues.push({ field: "demand", level: "error", message: "Demand charge is required. Enter 0 if it does not apply." });
  else if (!Number.isFinite(demand)) issues.push({ field: "demand", level: "error", message: "Demand charge must be a valid number." });
  else if (demand < 0 || demand > 100) issues.push({ field: "demand", level: "error", message: "Demand charge must be between $0 and $100 per kW/day." });
  else if (demand > 5) issues.push({ field: "demand", level: "warning", message: "This demand charge is high for a household tariff. Confirm the units are $/kW/day." });

  return issues;
}

export type BatteryFormValues = {
  batteryCost: string;
  replacementCost: string;
  efficiency: string;
  depthOfDischarge: string;
  projectLifetime: string;
  discountRate: string;
};

export function validateBatteryInput(form: BatteryFormValues): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fields: Array<{ key: keyof BatteryFormValues; label: string; min: number; max: number }> = [
    { key: "batteryCost", label: "Battery cost", min: 1, max: 100000 },
    { key: "replacementCost", label: "Battery replacement cost", min: 0, max: 100000 },
    { key: "efficiency", label: "Battery efficiency", min: 50, max: 100 },
    { key: "depthOfDischarge", label: "Depth of discharge", min: 50, max: 100 },
    { key: "projectLifetime", label: "Project lifetime", min: 1, max: 30 },
    { key: "discountRate", label: "Discount rate", min: 0, max: 30 },
  ];

  for (const field of fields) {
    const raw = form[field.key];
    const value = Number(raw);
    if (!raw.trim()) issues.push({ field: field.key, level: "error", message: `${field.label} is required.` });
    else if (!Number.isFinite(value)) issues.push({ field: field.key, level: "error", message: `${field.label} must be a valid number.` });
    else if (value < field.min || value > field.max) issues.push({ field: field.key, level: "error", message: `${field.label} must be between ${field.min} and ${field.max}.` });
  }

  const batteryCost = Number(form.batteryCost);
  const replacementCost = Number(form.replacementCost);
  const efficiency = Number(form.efficiency);
  const dod = Number(form.depthOfDischarge);
  const lifetime = Number(form.projectLifetime);
  const discount = Number(form.discountRate);

  if (Number.isFinite(batteryCost) && batteryCost > 0 && batteryCost < 1000) issues.push({ field: "batteryCost", level: "warning", message: "Battery cost below $1,000 is unusually low. Confirm the total installed cost." });
  if (Number.isFinite(batteryCost) && batteryCost > 30000) issues.push({ field: "batteryCost", level: "warning", message: "Battery cost above $30,000 is high for many residential systems. Confirm the value." });
  if (Number.isFinite(replacementCost) && Number.isFinite(batteryCost) && batteryCost > 0 && replacementCost > batteryCost * 1.5) issues.push({ field: "replacementCost", level: "warning", message: "Replacement cost is more than 150% of the initial battery cost." });
  if (Number.isFinite(efficiency) && efficiency >= 50 && efficiency < 80) issues.push({ field: "efficiency", level: "warning", message: "Efficiency below 80% is relatively low for a modern battery system." });
  if (Number.isFinite(dod) && dod > 95 && dod <= 100) issues.push({ field: "depthOfDischarge", level: "warning", message: "Depth of discharge above 95% can be an aggressive assumption. Confirm the battery specification." });
  if (Number.isFinite(lifetime) && lifetime > 20) issues.push({ field: "projectLifetime", level: "warning", message: "A project lifetime above 20 years extends beyond many battery warranty periods." });
  if (Number.isFinite(discount) && discount > 15) issues.push({ field: "discountRate", level: "warning", message: "A discount rate above 15% will strongly reduce long-term present value." });

  return issues;
}

export function validateDraftDetailed(input: DraftCalculation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.loadMode) issues.push({ field: "loadMode", level: "error", message: "Load profile method is missing." });
  if (input.loadMode === "csv" && !input.csvSummary) issues.push({ field: "csv", level: "error", message: "CSV analysis is missing." });
  if (input.loadMode === "manual" && (!isFiniteNumber(input.manualDailyUsageKWh) || input.manualDailyUsageKWh < 1 || input.manualDailyUsageKWh > 100)) issues.push({ field: "manualDailyUsage", level: "error", message: "Daily electricity usage is missing or outside the allowed range." });
  if (input.loadMode === "sample" && (!input.sampleProfile || !isFiniteNumber(input.sampleDailyUsageKWh) || input.sampleDailyUsageKWh <= 0)) issues.push({ field: "sampleProfile", level: "error", message: "Sample profile is incomplete." });
  if (!isFiniteNumber(input.pvSize) || input.pvSize < 1 || input.pvSize > 30) issues.push({ field: "pvSize", level: "error", message: "PV system size must be between 1 and 30 kW." });
  if (!input.tariffId) issues.push({ field: "tariff", level: "error", message: "Tariff selection is missing." });

  for (const [field, label, value] of [
    ["peakRate", "Peak tariff rate", input.peakRate],
    ["shoulderRate", "Shoulder tariff rate", input.shoulderRate],
    ["offPeakRate", "Off-peak tariff rate", input.offPeakRate],
    ["feedInTariff", "Feed-in tariff", input.feedInTariff],
  ] as const) {
    if (!isFiniteNumber(value) || value < 0 || value > 2) issues.push({ field, level: "error", message: `${label} is missing or invalid.` });
  }
  if (!isFiniteNumber(input.demandCharge) || input.demandCharge < 0 || input.demandCharge > 100) issues.push({ field: "demandCharge", level: "error", message: "Demand charge is missing or invalid." });
  if (!isFiniteNumber(input.batteryCost) || input.batteryCost <= 0 || input.batteryCost > 100000) issues.push({ field: "batteryCost", level: "error", message: "Battery cost is missing or invalid." });
  if (!isFiniteNumber(input.replacementCost) || input.replacementCost < 0 || input.replacementCost > 100000) issues.push({ field: "replacementCost", level: "error", message: "Replacement cost is missing or invalid." });
  if (!isFiniteNumber(input.efficiency) || input.efficiency < 50 || input.efficiency > 100) issues.push({ field: "efficiency", level: "error", message: "Battery efficiency must be between 50% and 100%." });
  if (!isFiniteNumber(input.depthOfDischarge) || input.depthOfDischarge < 50 || input.depthOfDischarge > 100) issues.push({ field: "depthOfDischarge", level: "error", message: "Depth of discharge must be between 50% and 100%." });
  if (!isFiniteNumber(input.projectLifetime) || input.projectLifetime < 1 || input.projectLifetime > 30) issues.push({ field: "projectLifetime", level: "error", message: "Project lifetime must be between 1 and 30 years." });
  if (!isFiniteNumber(input.discountRate) || input.discountRate < 0 || input.discountRate > 30) issues.push({ field: "discountRate", level: "error", message: "Discount rate must be between 0% and 30%." });

  return issues;
}

export const errorsOnly = (issues: ValidationIssue[]) => issues.filter((issue) => issue.level === "error");
export const warningsOnly = (issues: ValidationIssue[]) => issues.filter((issue) => issue.level === "warning");
export const fieldIssue = (issues: ValidationIssue[], field: string, level?: ValidationIssue["level"]) => issues.find((issue) => issue.field === field && (!level || issue.level === level));
