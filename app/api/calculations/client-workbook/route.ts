import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/server/backend";
import { optionalUserBackendFetch } from "@/lib/server/user-backend";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  return proxyJson(await optionalUserBackendFetch("/api/v1/calculations/client-workbook/", {
    method: "POST",
    body: form,
  }));
}
