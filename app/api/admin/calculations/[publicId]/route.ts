import { NextRequest } from "next/server";
import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";

export async function GET(_: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  return proxyJson(await adminBackendFetch(`/api/v1/admin/calculations/${publicId}/`));
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const body = await request.text();
  return proxyJson(await adminBackendFetch(`/api/v1/admin/calculations/${publicId}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body }));
}
export async function DELETE(_: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  return proxyJson(await adminBackendFetch(`/api/v1/admin/calculations/${publicId}/`, { method: "DELETE" }));
}
