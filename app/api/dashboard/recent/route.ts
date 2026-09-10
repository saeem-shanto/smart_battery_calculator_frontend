import { NextResponse } from "next/server";
import { listScenarios } from "@/lib/server/mock-store";

export async function GET() {
  return NextResponse.json({ scenarios: (await listScenarios()).slice(0, 3) });
}
