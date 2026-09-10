import { NextResponse } from "next/server";
import profileData from "@/data/mock/load-profiles.json";

export async function GET() {
  return NextResponse.json(profileData);
}
