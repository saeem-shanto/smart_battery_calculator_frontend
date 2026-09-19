import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { userBackendFetch } from "@/lib/server/user-backend";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyJson(await userBackendFetch(`/api/v1/accounts/me/calculations/${query ? `?${query}` : ""}`));
}
