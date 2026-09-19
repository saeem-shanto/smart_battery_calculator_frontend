import { NextResponse } from "next/server";
import { clearAdminTokens } from "@/lib/server/admin-backend";
export async function POST() { await clearAdminTokens(); return NextResponse.json({ ok: true }); }
