import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { clearUserTokens, getUserRefreshToken } from "@/lib/server/user-backend";

export async function POST() {
  const refresh = await getUserRefreshToken();
  if (refresh) {
    await backendFetch("/api/v1/accounts/auth/logout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }
  await clearUserTokens();
  return NextResponse.json({ ok: true });
}
