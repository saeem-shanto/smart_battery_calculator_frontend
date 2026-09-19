import { NextRequest } from "next/server";
import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyJson(await adminBackendFetch(`/api/v1/admin/calculations/${query ? `?${query}` : ""}`));
}
