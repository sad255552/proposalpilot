import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || "";

    if (!userId.trim()) {
      return NextResponse.json(
        { error: "Missing userId." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      proposals: data || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load proposals." },
      { status: 500 }
    );
  }
}
