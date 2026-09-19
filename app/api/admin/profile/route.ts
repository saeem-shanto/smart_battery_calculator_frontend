import { NextRequest } from "next/server";
import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";

export async function GET() {
  return proxyJson(await adminBackendFetch("/api/v1/accounts/me/"));
}

export async function PATCH(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return proxyJson(await adminBackendFetch("/api/v1/accounts/me/", { method: "PATCH", body: form }));
  }
  const body = await request.text();
  return proxyJson(await adminBackendFetch("/api/v1/accounts/me/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  }));
}
