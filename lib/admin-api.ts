"use client";

import type { AdminCalculationDetail, AdminCalculationRow, AdminSummary, Paginated, UserSummary } from "./types";
import { downloadBlob, readJson } from "./api";
import {
  adminFetch,
  clearAuthSession,
  fetchProtectedObjectUrl,
  getAuthSession,
  publicFetch,
  saveAuthSession,
} from "./backend-client";
import { isTwoFactorChallengePayload, toChallengeInfo, type TwoFactorChallengeInfo } from "./security-api";

type AdminAuthPayload = { two_factor_required?: false; access: string; refresh: string; user: UserSummary };

export type AdminLoginResult =
  | { twoFactorRequired: false; user: UserSummary }
  | { twoFactorRequired: true; challenge: TwoFactorChallengeInfo };

async function adminJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAuthSession("admin");
    if (typeof window !== "undefined") window.location.replace("/admin/login");
  }
  return readJson<T>(response);
}

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResult> {
  const payload = await readJson<AdminAuthPayload | Record<string, unknown>>(await publicFetch("/admin/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }));
  if (isTwoFactorChallengePayload(payload)) {
    return { twoFactorRequired: true, challenge: toChallengeInfo(payload) };
  }
  const authenticated = payload as AdminAuthPayload;
  if (!authenticated.access || !authenticated.refresh || !authenticated.user) throw new Error("The backend returned an incomplete admin session.");
  saveAuthSession("admin", { access: authenticated.access, refresh: authenticated.refresh });
  return { twoFactorRequired: false, user: authenticated.user };
}

export async function logoutAdmin() {
  const session = getAuthSession("admin");
  try {
    if (session?.refresh) {
      await publicFetch("/accounts/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      });
    }
  } finally {
    clearAuthSession("admin");
  }
}

export const getAdminSummary = async () => adminJson<AdminSummary>(await adminFetch("/admin/summary/"));

export async function getAdminCalculations(params = new URLSearchParams()) {
  const suffix = params.toString();
  return adminJson<Paginated<AdminCalculationRow>>(await adminFetch(`/admin/calculations/${suffix ? `?${suffix}` : ""}`));
}

export const getAdminCalculation = async (id: string) => adminJson<AdminCalculationDetail>(await adminFetch(`/admin/calculations/${id}/`));

export const updateAdminCalculation = async (
  id: string,
  body: { postcode?: string; suburb?: string; state?: string; metadata?: Record<string, unknown> },
) => adminJson<AdminCalculationDetail>(await adminFetch(`/admin/calculations/${id}/`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}));

export async function deleteAdminCalculation(id: string) {
  const response = await adminFetch(`/admin/calculations/${id}/`, { method: "DELETE" });
  if (response.status !== 204 && !response.ok) await adminJson(response);
}

export const deleteAdminFile = async (publicId: string, fileId: string) => adminJson<{
  deleted: boolean;
  kind: string;
  filename: string;
  affected_calculation_records: number;
}>(await adminFetch(`/admin/calculations/${publicId}/files/${fileId}/`, { method: "DELETE" }));

export async function downloadAdminFile(publicId: string, fileId: string, fallbackName: string) {
  const response = await adminFetch(`/admin/calculations/${publicId}/files/${fileId}/download/`);
  if (!response.ok) await adminJson(response);
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  const filename = match ? decodeURIComponent(match[1].replace(/\"/g, "")) : fallbackName;
  downloadBlob(await response.blob(), filename);
}

export async function getAdminProfile() {
  return adminJson<UserSummary>(await adminFetch("/accounts/me/"));
}

export async function updateAdminProfile(input: { username?: string; email?: string; first_name?: string; last_name?: string }) {
  return adminJson<UserSummary>(await adminFetch("/accounts/me/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function uploadAdminAvatar(file: File) {
  const body = new FormData();
  body.append("avatar", file, file.name);
  return adminJson<UserSummary>(await adminFetch("/accounts/me/", { method: "PATCH", body }));
}

export async function removeAdminAvatar() {
  return adminJson<UserSummary>(await adminFetch("/accounts/me/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatar: null }),
  }));
}

export async function getAdminAvatarObjectUrl() {
  return fetchProtectedObjectUrl("admin", "/accounts/me/avatar/");
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const response = await adminFetch("/accounts/me/password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) await adminJson(response);
  clearAuthSession("admin");
}
