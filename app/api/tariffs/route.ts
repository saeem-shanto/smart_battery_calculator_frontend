import { NextResponse } from "next/server";
import tariffData from "@/data/mock/tariffs.json";

export async function GET() {
  return NextResponse.json(tariffData);
}
