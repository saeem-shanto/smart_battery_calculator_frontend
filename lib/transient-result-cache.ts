"use client";

import type { CalculationResponse, DraftCalculation } from "./types";

const KEY = "smart_battery_transient_result_v1";
const ATTEMPT_KEY = "smart_battery_transient_attempt_v1";

type CachedTransient = {
  fingerprint: string;
  response: CalculationResponse;
};

export function transientFingerprint(draft: DraftCalculation): string {
  return JSON.stringify({
    inputMode: draft.inputMode || "upload",
    generatedInput: draft.inputMode === "generated" ? draft.generatedInput : undefined,
    inputFileName: draft.inputFileName || "",
    inputFileSize: draft.inputFileSize || 0,
    postcode: draft.postcode || "",
    suburb: draft.suburb || "",
    state: draft.state || "",
    batteryInstalledCostPerKwh: draft.batteryInstalledCostPerKwh ?? 1000,
    retainData: Boolean(draft.retainData),
  });
}

export function getCachedTransientResult(fingerprint: string): CalculationResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTransient;
    if (parsed.fingerprint !== fingerprint || !parsed.response || parsed.response.retained) return null;
    return parsed.response;
  } catch {
    return null;
  }
}

export function saveCachedTransientResult(fingerprint: string, response: CalculationResponse): void {
  if (typeof window === "undefined" || response.retained) return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ fingerprint, response } satisfies CachedTransient));
  } catch {
    // If browser storage is unavailable/full, results still remain visible for
    // the current render; only refresh recovery is unavailable.
  }
}

export function markTransientAttempt(fingerprint: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(ATTEMPT_KEY, fingerprint); } catch { /* ignore */ }
}

export function hasTransientAttempt(fingerprint: string): boolean {
  if (typeof window === "undefined") return false;
  try { return window.sessionStorage.getItem(ATTEMPT_KEY) === fingerprint; } catch { return false; }
}

export function clearCachedTransientResult(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  window.sessionStorage.removeItem(ATTEMPT_KEY);
}
