import { isCompleteBatteryResult, type CalculationResponse, type LocalCalculation } from "./types";

const KEY = "smart-battery-calculation-history-v1";

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(entry: unknown): LocalCalculation | null {
  if (!entry || typeof entry !== "object") return null;
  const value = entry as Partial<Record<keyof LocalCalculation, unknown>>;
  const batterySizeKwh = finiteNumber(value.batterySizeKwh);
  const annualSavingsAud = finiteNumber(value.annualSavingsAud);
  const netPaymentAud = finiteNumber(value.netPaymentAud);

  if (
    typeof value.publicId !== "string" || !value.publicId ||
    typeof value.accessToken !== "string" || !value.accessToken ||
    batterySizeKwh === null || annualSavingsAud === null || netPaymentAud === null
  ) return null;

  return {
    publicId: value.publicId,
    accessToken: value.accessToken,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date(0).toISOString(),
    inputFilename: typeof value.inputFilename === "string" && value.inputFilename ? value.inputFilename : "Uploaded workbook",
    postcode: typeof value.postcode === "string" ? value.postcode : "",
    suburb: typeof value.suburb === "string" ? value.suburb : "",
    state: typeof value.state === "string" ? value.state : "",
    batterySizeKwh,
    annualSavingsAud,
    netPaymentAud,
    status: typeof value.status === "string" ? value.status : "completed",
  };
}

export function listCalculationHistory(): LocalCalculation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    const clean = raw.map(normalize).filter((item): item is LocalCalculation => item !== null);
    if (clean.length !== raw.length) localStorage.setItem(KEY, JSON.stringify(clean));
    return clean;
  } catch {
    return [];
  }
}

export function saveCalculationHistory(response: CalculationResponse, token: string) {
  if (typeof window === "undefined" || !response.retained || !response.public_id || !token || !isCompleteBatteryResult(response.result)) return;
  const item: LocalCalculation = {
    publicId: response.public_id,
    accessToken: token,
    createdAt: response.created_at,
    inputFilename: response.input_filename || "Uploaded workbook",
    postcode: response.postcode || "",
    suburb: response.suburb || "",
    state: response.state || "",
    batterySizeKwh: response.result.optimal_battery_size_kwh,
    annualSavingsAud: response.result.estimated_annual_bill_reduction_aud,
    netPaymentAud: response.result.net_annual_payment_aud,
    status: response.status,
  };
  const items = listCalculationHistory().filter((entry) => entry.publicId !== item.publicId);
  localStorage.setItem(KEY, JSON.stringify([item, ...items].slice(0, 50)));
}

export function getHistoryItem(publicId: string) {
  return listCalculationHistory().find((item) => item.publicId === publicId) || null;
}

export function removeHistoryItem(publicId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(listCalculationHistory().filter((item) => item.publicId !== publicId)));
  }
}
