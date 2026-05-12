import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from("abos_opportunities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (opportunitiesError) throw opportunitiesError;

    const { data: tasks, error: tasksError } = await supabase
      .from("abos_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (tasksError) throw tasksError;

    const { data: experiments, error: experimentsError } = await supabase
      .from("abos_experiments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (experimentsError) throw experimentsError;

    const { data: reports, error: reportsError } = await supabase
      .from("abos_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (reportsError) throw reportsError;

    return NextResponse.json({
      opportunities: opportunities || [],
      tasks: tasks || [],
      experiments: experiments || [],
      reports: reports || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load ABOS state." },
      { status: 500 }
    );
  }
}
