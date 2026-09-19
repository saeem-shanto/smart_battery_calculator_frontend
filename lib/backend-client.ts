"use client";

export type AuthRole = "user" | "admin";

type StoredSession = {
  access: string;
  refresh: string;
};

type RefreshPayload = {
  access?: string;
  refresh?: string;
};

const USER_SESSION_KEY = "smart_battery_user_session_v1";
const ADMIN_SESSION_KEY = "smart_battery_admin_session_v1";

function normaliseBase(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute http(s) URL.");
  }
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
export const API_BASE_URL = configuredBase
  ? normaliseBase(configuredBase)
  : (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api/v1" : "");

export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required for the production frontend build.");
  }
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}

function storageKey(role: AuthRole): string {
  return role === "admin" ? ADMIN_SESSION_KEY : USER_SESSION_KEY;
}

export function getAuthSession(role: AuthRole): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(storageKey(role));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.access !== "string" || typeof parsed.refresh !== "string") return null;
    if (!parsed.access || !parsed.refresh) return null;
    return { access: parsed.access, refresh: parsed.refresh };
  } catch {
    return null;
  }
}

export function hasAuthSession(role: AuthRole): boolean {
  return Boolean(getAuthSession(role));
}

export function saveAuthSession(role: AuthRole, session: StoredSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey(role), JSON.stringify(session));
}

export function clearAuthSession(role: AuthRole): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(storageKey(role));
}

const refreshLocks: Partial<Record<AuthRole, Promise<string | null>>> = {};

async function refreshAccess(role: AuthRole): Promise<string | null> {
  const existing = refreshLocks[role];
  if (existing) return existing;

  const task = (async () => {
    const session = getAuthSession(role);
    if (!session?.refresh) return null;

    const path = role === "admin" ? "/admin/auth/token/refresh/" : "/accounts/auth/token/refresh/";
    let response: Response;
    try {
      response = await fetch(apiUrl(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
        cache: "no-store",
      });
    } catch (error) {
      // Preserve the existing session on transport failure. A temporary backend
      // outage must not silently turn an authenticated workflow into guest mode.
      throw error;
    }

    const payload = (await response.json().catch(() => null)) as RefreshPayload | null;
    if (!response.ok || !payload?.access) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        clearAuthSession(role);
      }
      return null;
    }

    saveAuthSession(role, {
      access: payload.access,
      refresh: payload.refresh || session.refresh,
    });
    return payload.access;
  })();

  refreshLocks[role] = task;
  try {
    return await task;
  } finally {
    delete refreshLocks[role];
  }
}

function withBearer(init: RequestInit, access: string): RequestInit {
  const headers = new Headers(init.headers || undefined);
  headers.set("Authorization", `Bearer ${access}`);
  return { ...init, headers };
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  try {
    return await fetch(url, { ...init, cache: init.cache ?? "no-store" });
  } catch (error) {
    throw new Error(
      "Could not reach the Django backend. Check backend availability, HTTPS and CORS configuration.",
      { cause: error },
    );
  }
}

export async function publicFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return rawFetch(path, init);
}

export async function authenticatedFetch(
  role: AuthRole,
  path: string,
  init: RequestInit = {},
  options: { optional?: boolean } = {},
): Promise<Response> {
  const optional = options.optional === true;
  const initialSession = getAuthSession(role);

  if (!initialSession) {
    if (optional) return rawFetch(path, init);
    return rawFetch(path, init); // backend returns the canonical 401 payload
  }

  let access = initialSession.access;
  let response = await rawFetch(path, withBearer(init, access));
  if (response.status !== 401) return response;

  const refreshed = await refreshAccess(role);
  if (!refreshed) return response;
  access = refreshed;
  response = await rawFetch(path, withBearer(init, access));
  return response;
}

export const userFetch = (path: string, init: RequestInit = {}) => authenticatedFetch("user", path, init);
export const optionalUserFetch = (path: string, init: RequestInit = {}) => authenticatedFetch("user", path, init, { optional: true });
export const adminFetch = (path: string, init: RequestInit = {}) => authenticatedFetch("admin", path, init);

export async function fetchProtectedObjectUrl(role: AuthRole, path: string): Promise<string> {
  const response = await authenticatedFetch(role, path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Protected file request failed with HTTP ${response.status}.`);
  return URL.createObjectURL(await response.blob());
}

export function revokeObjectUrl(value: string | null | undefined): void {
  if (value?.startsWith("blob:")) URL.revokeObjectURL(value);
}
