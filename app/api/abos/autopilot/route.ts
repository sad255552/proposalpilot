import { NextResponse } from "next/server";
import { runAbosAutopilot } from "@/lib/abos/autopilot";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runAbosAutopilot();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
