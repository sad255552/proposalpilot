import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const experimentId = body.experimentId;

    if (!experimentId) {
      return NextResponse.json({ error: "Missing experimentId." }, { status: 400 });
    }

    const { data: experiment, error } = await supabase
      .from("abos_experiments")
      .select("*")
      .eq("id", experimentId)
      .single();

    if (error) throw error;

    const visitors = experiment.visitors || 0;
    const signups = experiment.signups || 0;
    const paid = experiment.paid || 0;
    const revenue = Number(experiment.revenue || 0);

    const signupRate = visitors > 0 ? signups / visitors : 0;
    const paidRate = signups > 0 ? paid / signups : 0;

    let decision = "improve";
    let status = "running";

    if (visitors >= 300 && signups < 10) {
      decision = "kill";
      status = "stopped";
    }

    if (visitors >= 300 && signupRate >= 0.1 && paid < 2) {
      decision = "improve_offer";
      status = "running";
    }

    if (visitors >= 300 && paid >= 3 && revenue >= 50) {
      decision = "scale";
      status = "winner";
    }

    await supabase
      .from("abos_experiments")
      .update({ decision, status })
      .eq("id", experimentId);

    return NextResponse.json({
      decision,
      status,
      signupRate,
      paidRate
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Decision failed." },
      { status: 500 }
    );
  }
}
