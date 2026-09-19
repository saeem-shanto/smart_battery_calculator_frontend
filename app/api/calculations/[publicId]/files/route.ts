import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { optionalUserBackendFetch } from "@/lib/server/user-backend";

export async function GET(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const headers = new Headers();
  const token = request.headers.get("x-calculation-token");
  if (token) headers.set("X-Calculation-Token", token);
  return proxyJson(await optionalUserBackendFetch(`/api/v1/calculations/${publicId}/files/`, { headers }));
}
