import { adminBackendFetch } from "@/lib/server/admin-backend";
import { proxyJson } from "@/lib/server/backend";
export async function GET() { return proxyJson(await adminBackendFetch("/api/v1/admin/summary/")); }
