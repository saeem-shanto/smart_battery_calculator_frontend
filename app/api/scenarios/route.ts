import { NextRequest, NextResponse } from "next/server";
import { createScenario, deleteScenario, getScenario, listScenarios, updateScenario } from "@/lib/server/mock-store";

function getId(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("id");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateScenarioFields(body: Record<string, unknown>, partial = false) {
  const errors: string[] = [];
  if (!partial || "name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) errors.push("Scenario name is required.");
    else if (body.name.trim().length > 80) errors.push("Scenario name must be 80 characters or fewer.");
  }
  if ("recommendedBatterySize" in body) {
    const value = Number(body.recommendedBatterySize);
    if (!Number.isFinite(value) || value <= 0 || value > 100) errors.push("Recommended battery size must be between 0 and 100 kWh.");
  }
  if ("batterySize" in body) {
    const value = Number(body.batterySize);
    if (!Number.isFinite(value) || value <= 0 || value > 100) errors.push("Battery size must be between 0 and 100 kWh.");
  }
  if ("annualBillReduction" in body) {
    const value = Number(body.annualBillReduction);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) errors.push("Annual bill reduction must be between $0 and $1,000,000.");
  }
  if ("annualSavings" in body) {
    const value = Number(body.annualSavings);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) errors.push("Annual savings must be between $0 and $1,000,000.");
  }
  return errors;
}

export async function GET(request: NextRequest) {
  const id = getId(request);
  if (request.nextUrl.searchParams.has("id")) {
    if (!id) return NextResponse.json({ error: "A valid scenario id is required." }, { status: 400 });
    const scenario = await getScenario(id);
    if (!scenario) return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
    return NextResponse.json({ scenario });
  }
  return NextResponse.json({ scenarios: await listScenarios() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Scenario data is required." }, { status: 400 });
  const errors = validateScenarioFields(body);
  if (errors.length) return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
  const response = await createScenario(body as Parameters<typeof createScenario>[0]);
  return NextResponse.json({ ok: true, ...response }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const id = getId(request);
  if (!id) return NextResponse.json({ error: "A valid scenario id is required." }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Update data is required." }, { status: 400 });
  const errors = validateScenarioFields(body, true);
  if (errors.length) return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
  const response = await updateScenario(id, body as Parameters<typeof updateScenario>[1]);
  if (!response.scenario) return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  return NextResponse.json({ ok: true, ...response });
}

export async function DELETE(request: NextRequest) {
  const id = getId(request);
  if (!id) return NextResponse.json({ error: "A valid scenario id is required." }, { status: 400 });
  const response = await deleteScenario(id);
  if (!response.deleted) return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  return NextResponse.json({ ok: true, scenarios: response.scenarios });
}
