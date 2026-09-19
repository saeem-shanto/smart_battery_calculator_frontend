import { NextRequest } from "next/server";
import { proxyBinary, proxyJson } from "@/lib/server/backend";
import { optionalUserBackendFetch } from "@/lib/server/user-backend";

export async function GET(request: NextRequest, context: { params: Promise<{ publicId: string; fileId: string }> }) {
  const { publicId, fileId } = await context.params;
  const headers = new Headers();
  const token = request.headers.get("x-calculation-token");
  if (token) headers.set("X-Calculation-Token", token);
  const response = await optionalUserBackendFetch(`/api/v1/calculations/${publicId}/files/${fileId}/download/`, { headers });
  return response.ok ? proxyBinary(response) : proxyJson(response);
}
