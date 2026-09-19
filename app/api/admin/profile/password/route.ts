import { NextRequest } from "next/server";
import { clearAdminTokens, adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await adminBackendFetch("/api/v1/accounts/me/password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (response.ok) await clearAdminTokens();
  return proxyJson(response);
}
