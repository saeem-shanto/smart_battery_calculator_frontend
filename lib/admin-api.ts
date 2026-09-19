"use client";
import type { AdminCalculationDetail, AdminCalculationRow, AdminSummary, Paginated } from "./types";
async function json<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as any;
  if (response.status === 401) { window.location.replace("/admin/login"); throw new Error("Administrator session expired."); }
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `Request failed with HTTP ${response.status}.`);
  return payload as T;
}
export const getAdminSummary = async () => json<AdminSummary>(await fetch("/api/admin/summary", { cache: "no-store" }));
export async function getAdminCalculations(params = new URLSearchParams()) { return json<Paginated<AdminCalculationRow>>(await fetch(`/api/admin/calculations?${params.toString()}`, { cache: "no-store" })); }
export const getAdminCalculation = async (id: string) => json<AdminCalculationDetail>(await fetch(`/api/admin/calculations/${id}`, { cache: "no-store" }));
export const updateAdminCalculation = async (id: string, body: { postcode?: string; suburb?: string; state?: string; metadata?: Record<string, unknown> }) => json<AdminCalculationDetail>(await fetch(`/api/admin/calculations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
export async function deleteAdminCalculation(id: string) { const r = await fetch(`/api/admin/calculations/${id}`, { method: "DELETE" }); if (r.status !== 204 && !r.ok) await json(r); }
export const deleteAdminFile = async (publicId: string, fileId: string) => json<{ deleted: boolean; kind: string; filename: string; affected_calculation_records: number }>(await fetch(`/api/admin/calculations/${publicId}/files/${fileId}`, { method: "DELETE" }));
