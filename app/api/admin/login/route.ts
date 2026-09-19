import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { setAdminTokens } from "@/lib/server/admin-backend";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body?.password) return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  const response = await backendFetch("/api/v1/admin/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: body.username.trim(), password: body.password }),
  });
  const payload = await response.json().catch(() => null) as { access?: string; refresh?: string; user?: unknown; error?: { message?: string } } | null;
  if (!response.ok || !payload?.access || !payload.refresh) {
    return NextResponse.json({ error: payload?.error?.message || "Invalid administrator credentials." }, { status: response.status || 401 });
  }
  await setAdminTokens(payload.access, payload.refresh);
  return NextResponse.json({ ok: true, user: payload.user });
}
