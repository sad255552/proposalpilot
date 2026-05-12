import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    const { data, error } = await supabase
      .from("usage_limits")
      .upsert(
        {
          user_id: userId,
          is_pro: true,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id"
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usage: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upgrade user." },
      { status: 500 }
    );
  }
}
