import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Stripe checkout placeholder. Real checkout will be connected next.",
    plan: "ProposalPilot Pro",
    price: "$19/month"
  });
}
