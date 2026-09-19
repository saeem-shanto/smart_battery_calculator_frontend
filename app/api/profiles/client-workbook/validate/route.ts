import { NextRequest } from "next/server";
import { backendFetch, proxyJson } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  return proxyJson(
    await backendFetch("/api/v1/profiles/client-workbook/validate/", {
      method: "POST",
      body: form,
    }),
  );
}
