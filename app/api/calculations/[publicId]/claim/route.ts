import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { userBackendFetch } from "@/lib/server/user-backend";

export async function POST(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const token = request.headers.get("x-calculation-token") || "";
  return proxyJson(await userBackendFetch(`/api/v1/calculations/${publicId}/claim/`, {
    method: "POST",
    headers: { "X-Calculation-Token": token },
  }));
}
