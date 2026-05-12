import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST() {
  try {
    const { data: opportunities } = await supabase
      .from("abos_opportunities")
      .select("*")
      .order("score", { ascending: false })
      .limit(20);

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json(
        { error: "No opportunities found. Run Scan Opportunities first." },
        { status: 400 }
      );
    }

    const prompt = `
You are ABOS 2030, an ethical autonomous SaaS operating system.

Your job:
1. Choose the best opportunity.
2. Create an MVP build plan.
3. Create a launch campaign.
4. Define metrics.
5. Define kill / improve / scale decision rules.
6. Produce a Codex build prompt.
7. Produce a marketing launch prompt.

Do not copy proprietary products. Create original positioning.

Opportunities:
${JSON.stringify(opportunities, null, 2)}

Return valid JSON only:
{
  "selected_title": "...",
  "selected_reason": "...",
  "decision": "build",
  "mvp_plan": {
    "product_name": "...",
    "one_line_promise": "...",
    "target_user": "...",
    "core_features": ["...", "..."],
    "technical_stack": ["Next.js", "Supabase", "Stripe", "OpenAI"],
    "build_steps": ["...", "..."],
    "codex_prompt": "..."
  },
  "marketing_plan": {
    "positioning": "...",
    "offer": "...",
    "channels": ["X", "Reddit", "Facebook Groups", "Cold Email"],
    "launch_posts": ["...", "...", "..."],
    "cold_email": "...",
    "marketing_prompt": "..."
  },
  "metrics": {
    "target_visitors": 300,
    "target_signups": 30,
    "target_paid": 3,
    "target_revenue": 57,
    "kill_rule": "...",
    "improve_rule": "...",
    "scale_rule": "..."
  },
  "improvement_plan": {
    "if_low_visitors": ["...", "..."],
    "if_low_signups": ["...", "..."],
    "if_low_paid": ["...", "..."],
    "if_winner": ["...", "..."]
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const plan = JSON.parse(cleaned);

    const selected = opportunities.find(
      (item: any) =>
        item.title?.toLowerCase() === plan.selected_title?.toLowerCase()
    ) || opportunities[0];

    const { data: run, error: runError } = await supabase
      .from("abos_runs")
      .insert({
        status: "planned",
        selected_opportunity_id: selected.id,
        decision: plan.decision || "build",
        mvp_plan: plan.mvp_plan || {},
        marketing_plan: plan.marketing_plan || {},
        metrics: plan.metrics || {},
        improvement_plan: plan.improvement_plan || {}
      })
      .select()
      .single();

    if (runError) throw runError;

    await supabase.from("abos_experiments").insert({
      opportunity_id: selected.id,
      name: plan.mvp_plan?.product_name || selected.title,
      hypothesis: plan.selected_reason,
      landing_copy: plan.marketing_plan?.positioning || "",
      offer: plan.marketing_plan?.offer || "",
      channel: (plan.marketing_plan?.channels || [])[0] || "manual",
      budget: 0,
      status: "planned",
      decision: "pending"
    });

    return NextResponse.json({ run, plan });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ABOS run failed." },
      { status: 500 }
    );
  }
}
