import { NextRequest, NextResponse } from "next/server";
import { analyzeCsvText } from "@/lib/server/csv-analyzer";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { fileName?: string; text?: string } | null;
  if (!body?.fileName || typeof body.text !== "string") {
    return NextResponse.json({ error: "fileName and CSV text are required." }, { status: 400 });
  }
  try {
    return NextResponse.json(analyzeCsvText(body.fileName, body.text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not analyze CSV.";
    const status = message.includes("5 MB") ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
