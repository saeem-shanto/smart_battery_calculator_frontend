import { NextRequest } from "next/server";
import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";
export async function DELETE(_: NextRequest, context: { params: Promise<{ publicId: string; fileId: string }> }) {
  const { publicId, fileId } = await context.params;
  return proxyJson(await adminBackendFetch(`/api/v1/admin/calculations/${publicId}/files/${fileId}/`, { method: "DELETE" }));
}
