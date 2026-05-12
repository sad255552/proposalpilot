import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const taskId = body.taskId;
    const status = body.status || "done";

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
    }

    if (!["todo", "running", "done"].includes(status)) {
      return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from("abos_tasks")
      .update({ status })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update task." },
      { status: 500 }
    );
  }
}
