import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { setUserTokens } from "@/lib/server/user-backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await backendFetch("/api/v1/accounts/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const payload = await response.json().catch(() => null) as { access?: string; refresh?: string; user?: unknown; error?: unknown } | null;
  if (!response.ok || !payload?.access || !payload.refresh) {
    return NextResponse.json(payload || { error: { message: "Registration failed." } }, { status: response.status || 400 });
  }
  await setUserTokens(payload.access, payload.refresh);
  return NextResponse.json({ user: payload.user }, { status: 201 });
}
