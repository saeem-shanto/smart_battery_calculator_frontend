import { cookies } from "next/headers";
import { backendFetch } from "./backend";

export const USER_ACCESS_COOKIE = "smart_battery_user_access";
export const USER_REFRESH_COOKIE = "smart_battery_user_refresh";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setUserTokens(access: string, refresh?: string) {
  const store = await cookies();
  store.set(USER_ACCESS_COOKIE, access, cookieOptions(30 * 60));
  if (refresh) store.set(USER_REFRESH_COOKIE, refresh, cookieOptions(24 * 60 * 60));
}

export async function clearUserTokens() {
  const store = await cookies();
  store.set(USER_ACCESS_COOKIE, "", cookieOptions(0));
  store.set(USER_REFRESH_COOKIE, "", cookieOptions(0));
}

export async function getUserRefreshToken() {
  const store = await cookies();
  return store.get(USER_REFRESH_COOKIE)?.value || null;
}

async function refreshAccessToken() {
  const store = await cookies();
  const refresh = store.get(USER_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const response = await backendFetch("/api/v1/accounts/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    await clearUserTokens();
    return null;
  }

  const payload = await response.json().catch(() => null) as { access?: string; refresh?: string } | null;
  if (!payload?.access) {
    await clearUserTokens();
    return null;
  }

  await setUserTokens(payload.access, payload.refresh || refresh);
  return payload.access;
}

async function getAccessToken() {
  const store = await cookies();
  return store.get(USER_ACCESS_COOKIE)?.value || (await refreshAccessToken());
}

export async function userBackendFetch(path: string, init?: RequestInit) {
  let access = await getAccessToken();
  if (!access) {
    return new Response(
      JSON.stringify({ error: { code: "not_authenticated", message: "Sign in is required." } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${access}`);
  let response = await backendFetch(path, { ...init, headers });
  if (response.status !== 401) return response;

  access = await refreshAccessToken();
  if (!access) return response;
  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set("Authorization", `Bearer ${access}`);
  return backendFetch(path, { ...init, headers: retryHeaders });
}

export async function optionalUserBackendFetch(path: string, init?: RequestInit) {
  let access = await getAccessToken();
  if (!access) return backendFetch(path, init);

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${access}`);
  let response = await backendFetch(path, { ...init, headers });
  if (response.status !== 401) return response;

  access = await refreshAccessToken();
  if (!access) return backendFetch(path, init);
  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set("Authorization", `Bearer ${access}`);
  return backendFetch(path, { ...init, headers: retryHeaders });
}
