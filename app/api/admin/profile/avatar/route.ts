import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyBinary, proxyJson } from "@/lib/server/backend";

export async function GET() {
  const response = await adminBackendFetch("/api/v1/accounts/me/avatar/");
  return response.ok ? proxyBinary(response) : proxyJson(response);
}
