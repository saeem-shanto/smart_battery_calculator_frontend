"use client";

import type { CalculationResponse, OwnedCalculation, UserSummary } from "./types";
import { ApiRequestError } from "./api";

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, unknown> | null;
  };
};

function fieldText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(fieldText).filter(Boolean).join(" ");
  }
  return value == null ? "" : String(value);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | T | null;
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload ? (payload as ErrorPayload).error : undefined;
    const fields = error?.fields && typeof error.fields === "object" ? error.fields : null;
    const details = fields
      ? Object.entries(fields).map(([key, value]) => `${key}: ${fieldText(value)}`).filter((x) => !x.endsWith(": ")).join(" ")
      : "";
    throw new ApiRequestError(
      [error?.message || `Request failed with HTTP ${response.status}.`, details].filter(Boolean).join(" "),
      response.status,
      { code: error?.code, fields },
    );
  }
  if (response.status === 204) return undefined as T;
  if (payload === null) throw new Error("The server returned an empty response.");
  return payload as T;
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  const response = await fetch("/api/account/me", { cache: "no-store" });
  if (response.status === 401) return null;
  return readJson<UserSummary>(response);
}

export async function loginUser(username: string, password: string) {
  return readJson<{ user: UserSummary }>(await fetch("/api/account/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }));
}

export async function registerUser(input: {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password: string;
}) {
  return readJson<{ user: UserSummary }>(await fetch("/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function logoutUser() {
  return readJson<{ ok: boolean }>(await fetch("/api/account/logout", { method: "POST" }));
}

export async function updateProfile(input: {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}) {
  return readJson<UserSummary>(await fetch("/api/account/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file, file.name);
  return readJson<UserSummary>(await fetch("/api/account/me", { method: "PATCH", body: form }));
}

export async function removeAvatar() {
  return readJson<UserSummary>(await fetch("/api/account/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatar: null }),
  }));
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await fetch("/api/account/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) await readJson(response);
}

export async function getOwnedCalculations() {
  const payload = await readJson<OwnedCalculation[] | { results: OwnedCalculation[] }>(
    await fetch("/api/account/me/calculations?page_size=100", { cache: "no-store" }),
  );
  return Array.isArray(payload) ? payload : payload.results || [];
}

export async function claimCalculation(publicId: string, guestToken: string) {
  return readJson<CalculationResponse>(await fetch(`/api/calculations/${publicId}/claim`, {
    method: "POST",
    headers: { "X-Calculation-Token": guestToken },
  }));
}
