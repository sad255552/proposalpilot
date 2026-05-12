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

    const { data: usage, error } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!usage.is_pro && usage.generation_count >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "Free limit reached.",
          canGenerate: false
        },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("usage_limits")
      .update({
        generation_count: usage.generation_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usage: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to increment usage." },
      { status: 500 }
    );
  }
}
