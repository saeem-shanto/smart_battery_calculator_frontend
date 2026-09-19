import type { DraftCalculation } from "./types";
const KEY = "smart-battery-calculator-draft-v5";
const LEGACY_KEYS = ["smart-battery-calculator-draft-v4", "smart-battery-calculator-draft-v3", "smart-battery-calculator-draft"];
export function getDraft(): DraftCalculation {
  if (typeof window === "undefined") return {};
  try { const parsed = JSON.parse(localStorage.getItem(KEY) || "{}"); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
}
export function saveDraft(update: Partial<DraftCalculation>) {
  if (typeof window === "undefined") return;
  const current = getDraft();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...update }));
}
export function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
}
