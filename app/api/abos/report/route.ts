import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function cleanJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

const ABOS_REPORT_SKILL_RULES = `
Apply the reusable ABOS skill rules from:
- /abos-skills/daily-report.md for factual summary, wins, risks, and next actions.
- /abos-skills/experiment-decision.md for experiment status, threshold interpretation, and decision language.
- /abos-skills/autopilot-operator.md for the next operating decision and safety-aware prioritization.
`;

function fallbackReport(payload: any) {
  const run = payload.run;
  const tasks = payload.tasks || [];
  const experiments = payload.experiments || [];
  const opportunities = payload.opportunities || [];
  const done = tasks.filter((task: any) => task.status === "done").length;
  const todo = tasks.filter((task: any) => task.status !== "done").length;
  const topOpportunity = opportunities[0]?.title || run?.mvp_plan?.product_name || "latest selected opportunity";

  return {
    title: "ABOS Daily Operating Report",
    summary: `ABOS selected ${topOpportunity}. Current loop has ${opportunities.length} opportunities, ${experiments.length} experiments, ${tasks.length} execution tasks, ${done} done and ${todo} pending.`,
    wins: [
      `Generated ${opportunities.length} market opportunities`,
      `Created ${experiments.length} experiment(s)`,
      `Prepared ${tasks.length} execution tasks`
    ],
    risks: [
      todo > 0 ? `${todo} tasks still need execution` : "No pending execution tasks",
      experiments.some((item: any) => Number(item.visitors || 0) === 0) ? "Some experiments still have zero traffic" : "Experiment traffic is being tracked"
    ],
    next_actions: tasks.slice(0, 5).map((task: any) => task.title) || ["Run the next ABOS execution cycle"]
  };
}

export async function POST() {
  try {
    const { data: runs, error: runsError } = await supabase
      .from("abos_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (runsError) throw runsError;

    const latestRun = runs?.[0] || null;

    const [{ data: opportunities, error: opportunitiesError }, { data: experiments, error: experimentsError }, { data: tasks, error: tasksError }] = await Promise.all([
      supabase.from("abos_opportunities").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("abos_experiments").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("abos_tasks").select("*").order("created_at", { ascending: false }).limit(50)
    ]);

    if (opportunitiesError) throw opportunitiesError;
    if (experimentsError) throw experimentsError;
    if (tasksError) throw tasksError;

    const payload = {
      run: latestRun,
      opportunities: opportunities || [],
      experiments: experiments || [],
      tasks: tasks || []
    };

    let report = fallbackReport(payload);

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Create a concise ABOS operating report from this data.

${ABOS_REPORT_SKILL_RULES}

Return valid JSON only with this shape: {"title":"ABOS Daily Operating Report","summary":"...","wins":["..."],"risks":["..."],"next_actions":["..."]}. Data: ${JSON.stringify(payload)}`
            }
          ],
          temperature: 0.3
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(cleanJson(raw));
        report = {
          title: parsed.title || report.title,
          summary: parsed.summary || report.summary,
          wins: Array.isArray(parsed.wins) ? parsed.wins : report.wins,
          risks: Array.isArray(parsed.risks) ? parsed.risks : report.risks,
          next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions : report.next_actions
        };
      } catch (error) {
        report = fallbackReport(payload);
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("abos_reports")
      .insert({
        title: report.title,
        summary: report.summary,
        wins: report.wins,
        risks: report.risks,
        next_actions: report.next_actions
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ report: inserted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate ABOS report." },
      { status: 500 }
    );
  }
}
