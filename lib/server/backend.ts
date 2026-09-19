import { NextResponse } from "next/server";

const rawBase = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:8000";
export const BACKEND_API_URL = rawBase.replace(/\/$/, "");

export function backendUrl(path: string) {
  return `${BACKEND_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function backendFetch(path: string, init?: RequestInit) {
  return fetch(backendUrl(path), { ...init, cache: "no-store" });
}

export async function proxyJson(response: Response) {
  if (response.status === 204 || response.status === 205) return new NextResponse(null, { status: response.status });
  const text = await response.text();
  const payload = text ? safeJson(text) : null;
  if (payload !== null) return NextResponse.json(payload, { status: response.status });
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "text/plain" },
  });
}

export async function proxyBinary(response: Response) {
  const body = await response.arrayBuffer();
  const headers = new Headers();
  for (const key of ["content-type", "content-disposition", "content-length", "cache-control"]) {
    const value = response.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");
  return new NextResponse(body, { status: response.status, headers });
}

function safeJson(text: string): unknown | null {
  try { return JSON.parse(text); } catch { return null; }
}
