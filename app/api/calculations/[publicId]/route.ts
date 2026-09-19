import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { optionalUserBackendFetch } from "@/lib/server/user-backend";

function headers(request: NextRequest) {
  const h = new Headers();
  const token = request.headers.get("x-calculation-token");
  if (token) h.set("X-Calculation-Token", token);
  return h;
}

export async function GET(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  return proxyJson(await optionalUserBackendFetch(`/api/v1/calculations/${publicId}/`, { headers: headers(request) }));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  return proxyJson(await optionalUserBackendFetch(`/api/v1/calculations/${publicId}/`, {
    method: "DELETE",
    headers: headers(request),
  }));
}
