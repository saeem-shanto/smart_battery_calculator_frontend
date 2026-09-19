import { cookies } from "next/headers";
import { backendFetch } from "./backend";

export const ADMIN_ACCESS_COOKIE = "smart_battery_admin_access";
export const ADMIN_REFRESH_COOKIE = "smart_battery_admin_refresh";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setAdminTokens(access: string, refresh?: string) {
  const store = await cookies();
  store.set(ADMIN_ACCESS_COOKIE, access, cookieOptions(30 * 60));
  if (refresh) store.set(ADMIN_REFRESH_COOKIE, refresh, cookieOptions(24 * 60 * 60));
}

export async function clearAdminTokens() {
  const store = await cookies();
  store.set(ADMIN_ACCESS_COOKIE, "", cookieOptions(0));
  store.set(ADMIN_REFRESH_COOKIE, "", cookieOptions(0));
}

async function refreshAccessToken() {
  const store = await cookies();
  const refresh = store.get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const response = await backendFetch("/api/v1/admin/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    await clearAdminTokens();
    return null;
  }
  const payload = await response.json() as { access?: string; refresh?: string };
  if (!payload.access) return null;
  await setAdminTokens(payload.access, payload.refresh || refresh);
  return payload.access;
}

export async function adminBackendFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  let access = store.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!access) access = await refreshAccessToken() || undefined;
  if (!access) return new Response(JSON.stringify({ error: { code: "not_authenticated", message: "Administrator login is required." } }), { status: 401, headers: { "Content-Type": "application/json" } });

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${access}`);
  let response = await backendFetch(path, { ...init, headers });
  if (response.status !== 401) return response;

  access = await refreshAccessToken() || undefined;
  if (!access) return response;
  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set("Authorization", `Bearer ${access}`);
  response = await backendFetch(path, { ...init, headers: retryHeaders });
  return response;
}
