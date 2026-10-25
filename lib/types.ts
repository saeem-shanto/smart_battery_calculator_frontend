export type WorkbookValidationResponse = {
  valid: boolean;
  original_name: string;
  detected_format: string;
  row_count: number;
  profile_is_full_year: boolean;
  warnings: string[];
};

export type GeneratedInput = {
  loadProfile24h: number[];
  year: number;
  tilt: number;
  azimuth: number;
  systemLoss: number;
};

export type DraftCalculation = {
  inputMode?: "generated" | "upload";
  generatedInput?: GeneratedInput;

  inputFileName?: string;
  inputFileSize?: number;
  postcode?: string;
  suburb?: string;
  state?: string;
  /** Legacy v1.3 field kept only so older browser drafts do not crash. */
  consent?: boolean;
  /** Explicit backend-retention choice. False means process transiently and do not persist server-side. */
  retainData?: boolean;
  workbookValidation?: WorkbookValidationResponse;
  batteryInstalledCostPerKwh?: number;
  publicId?: string;
  accessToken?: string;
};

export type BatteryCalculationResult = {
  optimal_battery_size_kwh: number;
  net_annual_payment_aud: number;
  baseline_annual_payment_aud: number;
  estimated_annual_bill_reduction_aud: number;
  estimated_annual_bill_reduction_percent: number;
  export_to_grid_kwh_year: number;
  import_from_grid_kwh_year: number;
  energy_balance_import_minus_export_kwh_year: number;
  annual_load_kwh: number;
  annual_pv_generation_kwh: number;
  self_consumption_percent: number;
  baseline_self_consumption_percent: number;
  battery_annual_payment_rate_aud_per_kwh_year: number;
  battery_upfront_cost_aud: number;
  simple_payback_years: number | null;
  average_retail_price_aud_per_kwh: number;
  average_feed_in_tariff_aud_per_kwh: number;
  annual_demand_charge_aud: number;
  pv_size_kw: number;
  optimizer_success: boolean;
  optimizer_exitflag: number;
  objective_value: number;
  engine: string;
  algorithm_source: string;
  algorithm_sha256: string;
  profile_duration_hours: number;
  profile_is_full_year: boolean;
};

export type CalculationFile = {
  id: string;
  kind: "input_workbook" | "legacy_csv" | string;
  filename: string;
  original_filename?: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  download_path: string;
  delete_path?: string;
};

export type TransientCsv = {
  filename: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  base64_data: string;
};

export type CalculationResponse = {
  public_id: string | null;
  access_token?: string | null;
  retained: boolean;
  status: string;
  postcode: string;
  suburb: string;
  state: string;
  metadata: Record<string, unknown>;
  input_filename: string | null;
  result: BatteryCalculationResult | Partial<BatteryCalculationResult>;
  assumptions: string[];
  warnings: string[];
  algorithm_version: string;
  runtime_ms: number;
  files: CalculationFile[];
  transient_csv?: TransientCsv | null;
  created_at: string;
};

export type LocalCalculation = {
  publicId: string;
  accessToken: string;
  createdAt: string;
  inputFilename: string;
  postcode: string;
  suburb: string;
  state: string;
  batterySizeKwh: number;
  annualSavingsAud: number;
  netPaymentAud: number;
  status: string;
};

export type BackendTariff = {
  id: string;
  name: string;
  provider?: string;
  kind: string;
  flat_import_rate?: number | null;
  peak_import_rate?: number | null;
  shoulder_import_rate?: number | null;
  offpeak_import_rate?: number | null;
  feed_in_rate: number;
  daily_supply_charge?: number | null;
  demand_charge_rate_per_kw_day?: number | null;
  peak_start_hour?: number | null;
  peak_end_hour?: number | null;
  shoulder_start_hour?: number | null;
  shoulder_end_hour?: number | null;
  notes?: string;
};

export type AdminCalculationRow = {
  public_id: string;
  postcode: string;
  suburb: string;
  state: string;
  status: string;
  input_filename: string | null;
  input_sha256: string | null;
  has_input_file: boolean;
  has_csv_file: boolean;
  optimal_battery_size_kwh: number | null;
  net_annual_payment_aud: number | null;
  estimated_annual_bill_reduction_aud: number | null;
  algorithm_version: string;
  runtime_ms: number;
  created_at: string;
  updated_at: string;
};

export type AdminCalculationDetail = {
  public_id: string;
  postcode: string;
  suburb: string;
  state: string;
  metadata: Record<string, unknown>;
  status: string;
  source_mode: string;
  input_filename: string | null;
  input_sha256: string | null;
  input_payload: Record<string, unknown>;
  result_payload: Partial<BatteryCalculationResult>;
  assumptions: string[];
  warnings: string[];
  algorithm_version: string;
  runtime_ms: number;
  error_code: string;
  error_message: string;
  files: CalculationFile[];
  created_at: string;
  updated_at: string;
};

export type AdminSummary = {
  calculations: { today: number; last_7_days: number; last_30_days: number; all_time: number };
  source_modes: { source_mode: string; count: number }[];
  average_runtime_ms: number;
  feedback: { last_30_days: number; average_rating: number | null };
  recent: AdminCalculationRow[];
};

export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };


export type UserSummary = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  is_staff: boolean;
  avatar_download_path: string | null;
  two_factor_enabled: boolean;
};

export type OwnedCalculation = {
  public_id: string;
  status: string;
  postcode: string;
  suburb: string;
  state: string;
  metadata: Record<string, unknown>;
  input_filename: string | null;
  result: BatteryCalculationResult | Partial<BatteryCalculationResult>;
  algorithm_version: string;
  runtime_ms: number;
  files: CalculationFile[];
  created_at: string;
  updated_at: string;
};

export function isCompleteBatteryResult(value: unknown): value is BatteryCalculationResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  const finite = (key: string) => { const candidate = result[key]; return typeof candidate === "number" && Number.isFinite(candidate); };
  const text = (key: string) => typeof result[key] === "string" && Boolean(result[key]);
  const numericFields = [
    "optimal_battery_size_kwh",
    "net_annual_payment_aud",
    "baseline_annual_payment_aud",
    "estimated_annual_bill_reduction_aud",
    "estimated_annual_bill_reduction_percent",
    "export_to_grid_kwh_year",
    "import_from_grid_kwh_year",
    "annual_load_kwh",
    "annual_pv_generation_kwh",
    "self_consumption_percent",
    "baseline_self_consumption_percent",
    "battery_upfront_cost_aud",
    "pv_size_kw",
    "profile_duration_hours",
  ];
  if (!numericFields.every(finite)) return false;
  if (!(result.simple_payback_years === null || finite("simple_payback_years"))) return false;
  return text("engine") && text("algorithm_source") && text("algorithm_sha256");
}
