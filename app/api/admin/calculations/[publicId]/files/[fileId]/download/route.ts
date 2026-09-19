import { NextRequest } from "next/server";
import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyBinary, proxyJson } from "@/lib/server/backend";
export async function GET(_: NextRequest, context: { params: Promise<{ publicId: string; fileId: string }> }) {
  const { publicId, fileId } = await context.params;
  const response = await adminBackendFetch(`/api/v1/admin/calculations/${publicId}/files/${fileId}/download/`);
  return response.ok ? proxyBinary(response) : proxyJson(response);
}
