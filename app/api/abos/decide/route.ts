import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function numberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const experimentId = body.experimentId;
    const forcedDecision = body.decision;

    if (!experimentId) {
      return NextResponse.json({ error: "Missing experimentId." }, { status: 400 });
    }

    const metricUpdates: Record<string, number> = {};
    for (const key of ["visitors", "signups", "paid", "revenue"] as const) {
      const parsed = numberOrUndefined(body[key]);
      if (parsed !== undefined) metricUpdates[key] = parsed;
    }

    if (Object.keys(metricUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from("abos_experiments")
        .update(metricUpdates)
        .eq("id", experimentId);

      if (updateError) throw updateError;
    }

    const { data: experiment, error } = await supabase
      .from("abos_experiments")
      .select("*")
      .eq("id", experimentId)
      .single();

    if (error) throw error;

    const visitors = Number(experiment.visitors || 0);
    const signups = Number(experiment.signups || 0);
    const paid = Number(experiment.paid || 0);
    const revenue = Number(experiment.revenue || 0);

    const signupRate = visitors > 0 ? signups / visitors : 0;
    const paidRate = signups > 0 ? paid / signups : 0;

    let decision = "improve";
    let status = "running";

    if (["kill", "improve", "scale"].includes(forcedDecision)) {
      decision = forcedDecision;
      status = forcedDecision === "kill" ? "stopped" : forcedDecision === "scale" ? "winner" : "running";
    } else {
      if (visitors >= 300 && signups < 10) {
        decision = "kill";
        status = "stopped";
      }

      if (visitors >= 300 && signupRate >= 0.1 && paid < 2) {
        decision = "improve";
        status = "running";
      }

      if (visitors >= 300 && paid >= 3 && revenue >= 50) {
        decision = "scale";
        status = "winner";
      }
    }

    const { data: updated, error: decisionError } = await supabase
      .from("abos_experiments")
      .update({ decision, status })
      .eq("id", experimentId)
      .select()
      .single();

    if (decisionError) throw decisionError;

    return NextResponse.json({
      experiment: updated,
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
