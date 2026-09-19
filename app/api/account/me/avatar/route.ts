import { proxyBinary, proxyJson } from "@/lib/server/backend";
import { userBackendFetch } from "@/lib/server/user-backend";

export async function GET() {
  const response = await userBackendFetch("/api/v1/accounts/me/avatar/");
  return response.ok ? proxyBinary(response) : proxyJson(response);
}
