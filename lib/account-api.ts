"use client";

import type { CalculationResponse, OwnedCalculation, UserSummary } from "./types";
import { ApiRequestError, readJson } from "./api";
import {
  clearAuthSession,
  fetchProtectedObjectUrl,
  getAuthSession,
  publicFetch,
  saveAuthSession,
  userFetch,
} from "./backend-client";

type AuthPayload = {
  access: string;
  refresh: string;
  user: UserSummary;
};

function ensureAuthPayload(value: AuthPayload): AuthPayload {
  if (!value?.access || !value?.refresh || !value?.user) {
    throw new Error("The backend returned an incomplete authentication response.");
  }
  return value;
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  if (!getAuthSession("user")) return null;
  const response = await userFetch("/accounts/me/");
  if (response.status === 401) {
    clearAuthSession("user");
    return null;
  }
  return readJson<UserSummary>(response);
}

export async function loginUser(username: string, password: string) {
  const payload = ensureAuthPayload(await readJson<AuthPayload>(await publicFetch("/accounts/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })));
  saveAuthSession("user", { access: payload.access, refresh: payload.refresh });
  return { user: payload.user };
}

export async function registerUser(input: {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password: string;
}) {
  const payload = ensureAuthPayload(await readJson<AuthPayload>(await publicFetch("/accounts/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })));
  saveAuthSession("user", { access: payload.access, refresh: payload.refresh });
  return { user: payload.user };
}

export async function logoutUser() {
  const session = getAuthSession("user");
  try {
    if (session?.refresh) {
      await publicFetch("/accounts/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      });
    }
  } finally {
    clearAuthSession("user");
  }
  return { ok: true };
}

export async function updateProfile(input: {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}) {
  return readJson<UserSummary>(await userFetch("/accounts/me/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file, file.name);
  return readJson<UserSummary>(await userFetch("/accounts/me/", { method: "PATCH", body: form }));
}

export async function removeAvatar() {
  return readJson<UserSummary>(await userFetch("/accounts/me/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatar: null }),
  }));
}

export async function getUserAvatarObjectUrl() {
  return fetchProtectedObjectUrl("user", "/accounts/me/avatar/");
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await userFetch("/accounts/me/password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) await readJson(response);
  clearAuthSession("user");
}

export async function getOwnedCalculations() {
  const payload = await readJson<OwnedCalculation[] | { results: OwnedCalculation[] }>(
    await userFetch("/accounts/me/calculations/?page_size=100"),
  );
  return Array.isArray(payload) ? payload : payload.results || [];
}

export async function claimCalculation(publicId: string, guestToken: string) {
  return readJson<CalculationResponse>(await userFetch(`/calculations/${publicId}/claim/`, {
    method: "POST",
    headers: { "X-Calculation-Token": guestToken },
  }));
}

export { ApiRequestError };
