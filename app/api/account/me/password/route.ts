import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { clearUserTokens, userBackendFetch } from "@/lib/server/user-backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await userBackendFetch("/api/v1/accounts/me/password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (response.ok) await clearUserTokens();
  return proxyJson(response);
}
