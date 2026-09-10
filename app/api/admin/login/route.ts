import { NextRequest, NextResponse } from "next/server";

const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "123";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }
  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: { username: DEMO_USERNAME, role: "Administrator" } });
  response.cookies.set("smart_battery_admin", "demo-admin", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
