import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const FREE_LIMIT = 3;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId." },
        { status: 400 }
      );
    }

    let { data: usage, error } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!usage) {
      const created = await supabase
        .from("usage_limits")
        .insert({
          user_id: userId,
          generation_count: 0,
          is_pro: false
        })
        .select()
        .single();

      if (created.error) {
        return NextResponse.json(
          { error: created.error.message },
          { status: 500 }
        );
      }

      usage = created.data;
    }

    const remaining = usage.is_pro
      ? null
      : Math.max(FREE_LIMIT - usage.generation_count, 0);

    return NextResponse.json({
      userId,
      generationCount: usage.generation_count,
      isPro: usage.is_pro,
      freeLimit: FREE_LIMIT,
      remaining,
      canGenerate: usage.is_pro || usage.generation_count < FREE_LIMIT
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check usage." },
      { status: 500 }
    );
  }
}
