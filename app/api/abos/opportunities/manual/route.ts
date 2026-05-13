import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ManualOpportunityPayload = {
  title?: unknown;
  audience?: unknown;
  pain?: unknown;
  product_angle?: unknown;
  monetization?: unknown;
  acquisition_channels?: unknown;
  build_complexity?: unknown;
  revenue_potential?: unknown;
  speed_to_mvp?: unknown;
  originality_score?: unknown;
  total_score?: unknown;
};

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function boundedScore(value: unknown, field: string) {
  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`${field} must be a number from 0 to 100.`);
  }

  return Math.round(score);
}

function channelList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  throw new Error("acquisition_channels must be an array or comma-separated string.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ManualOpportunityPayload;
    const totalScore = boundedScore(body.total_score, "total_score");

    const opportunity = {
      title: requiredString(body.title, "title"),
      audience: requiredString(body.audience, "audience"),
      pain: requiredString(body.pain, "pain"),
      product_angle: requiredString(body.product_angle, "product_angle"),
      monetization: requiredString(body.monetization, "monetization"),
      acquisition_channels: channelList(body.acquisition_channels),
      build_complexity: boundedScore(body.build_complexity, "build_complexity"),
      revenue_potential: boundedScore(body.revenue_potential, "revenue_potential"),
      speed_to_mvp: boundedScore(body.speed_to_mvp, "speed_to_mvp"),
      originality_score: boundedScore(body.originality_score, "originality_score"),
      total_score: totalScore,
      score: totalScore,
      source: "manual"
    };

    const { data, error } = await supabase
      .from("abos_opportunities")
      .insert(opportunity)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create manual opportunity." },
      { status: 400 }
    );
  }
}
