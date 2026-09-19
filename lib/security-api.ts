"use client";

import type { AuthRole } from "./backend-client";
import type { UserSummary } from "./types";
import { readJson } from "./api";
import { authenticatedFetch, publicFetch, saveAuthSession } from "./backend-client";

export type TwoFactorChallengeInfo = {
  challengeId: string;
  expiresIn: number;
  resendAfter: number;
  maskedEmail: string;
};

type ChallengePayload = {
  two_factor_required: true;
  challenge_id: string;
  expires_in: number;
  resend_after: number;
  masked_email: string;
};

type AuthPayload = {
  two_factor_required?: false;
  access: string;
  refresh: string;
  user: UserSummary;
};

function challengeFromPayload(payload: ChallengePayload): TwoFactorChallengeInfo {
  return {
    challengeId: payload.challenge_id,
    expiresIn: payload.expires_in,
    resendAfter: payload.resend_after,
    maskedEmail: payload.masked_email,
  };
}

export function isTwoFactorChallengePayload(value: unknown): value is ChallengePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return payload.two_factor_required === true && typeof payload.challenge_id === "string";
}

export function toChallengeInfo(value: ChallengePayload): TwoFactorChallengeInfo {
  return challengeFromPayload(value);
}

export async function verifyLoginTwoFactor(role: AuthRole, challengeId: string, code: string) {
  const payload = await readJson<AuthPayload>(await publicFetch("/accounts/auth/2fa/verify/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId, code }),
  }));
  if (!payload.access || !payload.refresh || !payload.user) {
    throw new Error("The backend returned an incomplete authenticated session.");
  }
  if (role === "admin" && !payload.user.is_staff) {
    throw new Error("Administrator access is required.");
  }
  saveAuthSession(role, { access: payload.access, refresh: payload.refresh });
  return payload.user;
}

export async function resendTwoFactorCode(challengeId: string) {
  const payload = await readJson<ChallengePayload>(await publicFetch("/accounts/auth/2fa/resend/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId }),
  }));
  return challengeFromPayload(payload);
}

export async function beginTwoFactorEnable(role: AuthRole, currentPassword: string) {
  const response = await authenticatedFetch(role, "/accounts/me/two-factor/enable/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword }),
  });
  return challengeFromPayload(await readJson<ChallengePayload>(response));
}

export async function verifyTwoFactorEnable(role: AuthRole, challengeId: string, code: string) {
  return readJson<UserSummary>(await authenticatedFetch(role, "/accounts/me/two-factor/enable/verify/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId, code }),
  }));
}

export async function disableTwoFactor(role: AuthRole, currentPassword: string) {
  return readJson<UserSummary>(await authenticatedFetch(role, "/accounts/me/two-factor/disable/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword }),
  }));
}

export async function requestPasswordReset(email: string) {
  return readJson<{ detail: string }>(await publicFetch("/accounts/auth/password-reset/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }));
}

export async function confirmPasswordReset(input: {
  uid: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const response = await publicFetch("/accounts/auth/password-reset/confirm/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: input.uid,
      token: input.token,
      new_password: input.newPassword,
      confirm_password: input.confirmPassword,
    }),
  });
  if (!response.ok) await readJson(response);
}
