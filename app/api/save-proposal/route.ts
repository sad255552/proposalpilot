import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clientBrief = body.clientBrief || "";
    const service = body.service || "";
    const proposal = body.proposal || "";

    if (!clientBrief.trim() || !service.trim() || !proposal.trim()) {
      return NextResponse.json(
        { error: "Missing client brief, service, or proposal." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        client_brief: clientBrief,
        service,
        proposal
      })
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
      proposal: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save proposal." },
      { status: 500 }
    );
  }
}
