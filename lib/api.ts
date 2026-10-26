"use client";
import type {
  BackendTariff,
  CalculationResponse,
  DraftCalculation,
  WorkbookValidationResponse,
} from "./types";
import { optionalUserFetch, publicFetch } from "./backend-client";
import { validV1Inputs } from "./algorithm-v1";

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, unknown> | null;
    request_id?: string | null;
  };
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, unknown> | null;

  constructor(message: string, status: number, options?: { code?: string; fields?: Record<string, unknown> | null }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = options?.code;
    this.fields = options?.fields;
  }
}

function fieldText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(fieldText).filter(Boolean).join(" ");
  return value == null ? "" : String(value);
}

export function getApiFieldMessage(error: unknown, field: string): string | null {
  if (!(error instanceof ApiRequestError) || !error.fields || !(field in error.fields)) return null;
  return fieldText(error.fields[field]) || null;
}

export async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | T | null;
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? (payload as ErrorPayload).error
      : undefined;
    const fields = error?.fields && typeof error.fields === "object" ? error.fields : null;
    // Keep field details structured on ApiRequestError.fields. Do not append raw
    // backend field names (for example `non_field_errors`) to the user-facing
    // message; field-aware forms render those messages beside the right input.
    const message = error?.message || `Request failed with HTTP ${response.status}.`;
    throw new ApiRequestError(message, response.status, { code: error?.code, fields });
  }
  if (response.status === 204) return undefined as T;
  if (payload === null) throw new Error("The server returned an empty response.");
  return payload as T;
}

export async function getHealth() {
  return readJson<{ status: string; calculation_engine: string }>(
    await publicFetch("/health/"),
  );
}

export async function getReadiness() {
  return readJson<{ status: string; engine: { ready: boolean; octave_version?: string | null } }>(
    await publicFetch("/ready/"),
  );
}

export async function getTariffs() {
  return readJson<BackendTariff[]>(await publicFetch("/tariffs/"));
}

export async function validateClientWorkbook(file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  return readJson<WorkbookValidationResponse>(
    await publicFetch("/profiles/client-workbook/validate/", { method: "POST", body: form }),
  );
}

export async function runWorkbookCalculation(draft: DraftCalculation, file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("retain_data", String(Boolean(draft.retainData)));
  if (draft.postcode) form.append("postcode", draft.postcode);
  if (draft.suburb) form.append("suburb", draft.suburb);
  if (draft.state) form.append("state", draft.state);
  form.append(
    "metadata",
    JSON.stringify({ frontend: "nextjs-direct-api", workflow: "client_workbook", retention_requested: Boolean(draft.retainData) }),
  );
  if (draft.algorithmVersion !== "batt_cal_v1" || !validV1Inputs(draft.v1Inputs)) {
    throw new Error("Finish configuring the updated MATLAB inputs in Steps 2 and 3.");
  }
  const v1 = draft.v1Inputs;
  form.append("settings", JSON.stringify({
    battery_capacity_kwh: v1.batteryCapacityKwh,
    pv_capacity_kw: v1.pvCapacityKw,
    interest_rate_percent: v1.interestRatePercent,
    installation_cost_aud: v1.installationCostAud,
    loan_period_years: v1.loanPeriodYears,
    daily_supply_charge_aud: v1.dailySupplyChargeAud,
    retail_tariff_24h: v1.retailTariff24h,
    feed_in_tariff_24h: v1.feedInTariff24h,
  }));
  return readJson<CalculationResponse>(
    await optionalUserFetch("/calculations/client-workbook-v1/", { method: "POST", body: form }),
  );
}

export async function getCalculation(publicId: string, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("X-Calculation-Token", token);
  return readJson<CalculationResponse>(
    await optionalUserFetch(`/calculations/${publicId}/`, { headers }),
  );
}

export async function deleteCalculation(publicId: string, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("X-Calculation-Token", token);
  const response = await optionalUserFetch(`/calculations/${publicId}/`, { method: "DELETE", headers });
  if (!response.ok) await readJson(response);
}

export async function downloadCalculationFile(
  publicId: string,
  fileId: string,
  token: string | null | undefined,
  fallbackName: string,
) {
  const headers = new Headers();
  if (token) headers.set("X-Calculation-Token", token);
  const response = await optionalUserFetch(`/calculations/${publicId}/files/${fileId}/download/`, { headers });
  if (!response.ok) await readJson(response);
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  const filename = match ? decodeURIComponent(match[1].replace(/\"/g, "")) : fallbackName;
  downloadBlob(blob, filename);
}

export function downloadTransientCsv(base64Data: string, filename: string, contentType = "text/csv") {
  const binary = window.atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  downloadBlob(new Blob([bytes], { type: contentType }), filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Generate and execute a full-year calculation in one backend request.
 *  No annual file is transferred to or from the browser.
 */
export async function runGeneratedCalculation(draft: DraftCalculation) {
  const generated = draft.generatedInput;
  if (!generated || !draft.postcode || !draft.state || generated.loadProfile24h.length !== 24) {
    throw new Error("Generated inputs are incomplete. Return to Step 1 to enter your postcode and 24 hourly values.");
  }
  if (!validV1Inputs(draft.v1Inputs)) {
    throw new Error("Complete your battery, solar, tariff and financial inputs before calculating.");
  }
  const v1 = draft.v1Inputs;
  const payload = {
    postcode: draft.postcode,
    state: draft.state,
    suburb: draft.suburb || "",
    load_profile_24h: generated.loadProfile24h,
    year: generated.year,
    tilt: generated.tilt,
    azimuth: generated.azimuth,
    system_loss: generated.systemLoss,
    retain_data: Boolean(draft.retainData),
    battery_capacity_kwh: v1.batteryCapacityKwh,
    pv_capacity_kw: v1.pvCapacityKw,
    interest_rate_percent: v1.interestRatePercent,
    installation_cost_aud: v1.installationCostAud,
    loan_period_years: v1.loanPeriodYears,
    daily_supply_charge_aud: v1.dailySupplyChargeAud,
    retail_tariff_24h: v1.retailTariff24h,
    feed_in_tariff_24h: v1.feedInTariff24h,
  };
  return readJson<CalculationResponse>(await optionalUserFetch("/calculations/generated-annual-v1/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}
