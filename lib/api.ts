"use client";
import type {
  BackendTariff,
  CalculationResponse,
  DraftCalculation,
  WorkbookValidationResponse,
} from "./types";

const PUBLIC_BACKEND = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "").replace(/\/$/, "");
const url = (backendPath: string, proxyPath: string) =>
  PUBLIC_BACKEND ? `${PUBLIC_BACKEND}${backendPath}` : proxyPath;

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

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | T | null;
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? (payload as ErrorPayload).error
      : undefined;
    const fields = error?.fields && typeof error.fields === "object" ? error.fields : null;
    const details = fields
      ? Object.entries(fields)
          .map(([key, value]) => `${key}: ${fieldText(value)}`)
          .filter((value) => !value.endsWith(": "))
          .join(" ")
      : "";
    const message = [error?.message || `Request failed with HTTP ${response.status}.`, details].filter(Boolean).join(" ");
    throw new ApiRequestError(message, response.status, { code: error?.code, fields });
  }
  if (payload === null) throw new Error("The server returned an empty response.");
  return payload as T;
}

export async function getHealth() {
  return readJson<{ status: string; calculation_engine: string }>(
    await fetch(url("/api/v1/health/", "/api/system/health"), { cache: "no-store" }),
  );
}

export async function getReadiness() {
  return readJson<{ status: string; engine: { ready: boolean; octave_version?: string | null } }>(
    await fetch(url("/api/v1/ready/", "/api/system/ready"), { cache: "no-store" }),
  );
}

export async function getTariffs() {
  return readJson<BackendTariff[]>(
    await fetch(url("/api/v1/tariffs/", "/api/tariffs"), { cache: "no-store" }),
  );
}

export async function validateClientWorkbook(file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  return readJson<WorkbookValidationResponse>(
    await fetch(url("/api/v1/profiles/client-workbook/validate/", "/api/profiles/client-workbook/validate"), {
      method: "POST",
      body: form,
    }),
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
    JSON.stringify({ frontend: "nextjs", workflow: "client_workbook", retention_requested: Boolean(draft.retainData) }),
  );
  form.append("battery_installed_cost_per_kwh", String(draft.batteryInstalledCostPerKwh ?? 1000));
  return readJson<CalculationResponse>(
    await fetch("/api/calculations/client-workbook", {
      method: "POST",
      body: form,
    }),
  );
}

export async function getCalculation(publicId: string, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("X-Calculation-Token", token);
  return readJson<CalculationResponse>(
    await fetch(`/api/calculations/${publicId}`, { headers, cache: "no-store" }),
  );
}

export async function deleteCalculation(publicId: string, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("X-Calculation-Token", token);
  const response = await fetch(`/api/calculations/${publicId}`, { method: "DELETE", headers });
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
  const response = await fetch(
    `/api/calculations/${publicId}/files/${fileId}/download`,
    { headers },
  );
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

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
