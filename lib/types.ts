export type CsvSummary = {
  fileName: string;
  rowCount: number;
  intervalCount: number;
  totalKWh: number;
  averageDailyKWh: number;
  detectedColumns: string[];
};

export type UsagePattern = "balanced" | "evening-heavy" | "daytime-heavy";

export type LoadProfile = {
  id: string;
  name: string;
  description: string;
  dailyUsageKWh: number;
  pattern: UsagePattern;
};

export type DraftCalculation = {
  loadMode?: "csv" | "manual" | "sample";
  fileName?: string;
  csvSummary?: CsvSummary;
  manualDailyUsageKWh?: number;
  manualPattern?: UsagePattern;
  sampleProfileId?: string;
  sampleProfile?: string;
  sampleDailyUsageKWh?: number;
  pvSize?: number;
  tariffId?: string;
  tariffType?: string;
  peakRate?: number;
  shoulderRate?: number;
  offPeakRate?: number;
  feedInTariff?: number;
  demandCharge?: number;
  batteryCost?: number;
  replacementCost?: number;
  efficiency?: number;
  depthOfDischarge?: number;
  projectLifetime?: number;
  discountRate?: number;
};

export type SavingsPoint = { size: number; savings: number };

export type CalculationResult = {
  recommendedBatterySize: number;
  annualBillReduction: number;
  annualReductionPercent: number;
  paybackPeriod: number;
  netPresentValue: number;
  withoutBatteryBill: number;
  withBatteryBill: number;
  selfConsumptionBeforePercent: number;
  selfConsumptionAfterPercent: number;
  annualGridImportBeforeKWh: number;
  annualGridImportAfterKWh: number;
  annualLoadKWh: number;
  annualSolarGenerationKWh: number;
  estimatedAnnualExportKWh: number;
  savingsCurve: SavingsPoint[];
  meta: {
    source: string;
    model: string;
    message: string;
  };
};

export type Scenario = {
  id: number;
  name: string;
  date: string;
  batterySize: number;
  annualSavings: number;
  status?: "Completed" | "Draft";
  input?: DraftCalculation;
  result?: CalculationResult;
};

export type Tariff = {
  id: string;
  type: string;
  provider?: string;
  description?: string;
  peak: number;
  shoulder: number;
  offPeak: number;
  feedIn: number;
  demandCharge: number;
  periods: {
    peak: string;
    shoulder: string;
    offPeak: string;
  };
};
