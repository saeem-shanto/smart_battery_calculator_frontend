import type { DraftCalculation } from "./types";

const KEY = "smart-battery-calculator-draft-v4";
const LEGACY_KEYS = ["smart-battery-calculator-draft-v3", "smart-battery-calculator-draft"];

export function getDraft(): DraftCalculation {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}") as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as DraftCalculation : {};
  } catch {
    return {};
  }
}

export function saveDraft(update: Partial<DraftCalculation>) {
  if (typeof window === "undefined") return;
  try {
    const current = getDraft();
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...update }));
  } catch {
    // Keep the page usable even if browser storage is restricted.
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    // Ignore storage errors in restricted/private browser contexts.
  }
}
