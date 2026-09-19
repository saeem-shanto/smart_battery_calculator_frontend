import { backendFetch, proxyJson } from "@/lib/server/backend";
export async function GET() { return proxyJson(await backendFetch("/api/v1/tariffs/")); }
