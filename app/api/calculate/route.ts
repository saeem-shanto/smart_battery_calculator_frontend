import { NextRequest, NextResponse } from "next/server";
import type { DraftCalculation } from "@/lib/types";
import { runDummyCalculation, validateDraft } from "@/lib/server/dummy-calculator";

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null) as DraftCalculation | null;
  if (!input) {
    return NextResponse.json({ error: "A calculation request body is required." }, { status: 400 });
  }
  const missing = validateDraft(input);
  if (missing.length) {
    return NextResponse.json({ error: `Complete these fields first: ${missing.join(", ")}.`, missing }, { status: 400 });
  }

  return NextResponse.json({ ...runDummyCalculation(input), inputEcho: input });
}
