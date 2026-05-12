import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type TaskPriority = "high" | "medium" | "low";
type TaskCategory = "build" | "marketing" | "measurement" | "improvement";

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
};

function safeJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function pad(items: string[], fallback: string[]): string[] {
  const merged = [...items, ...fallback].filter(Boolean);
  return Array.from(new Set(merged));
}

function taskDraft(
  title: string,
  description: string,
  priority: TaskPriority,
  category: TaskCategory
): TaskDraft {
  return { title, description, priority, category };
}

function buildExecutionTasks(plan: any): TaskDraft[] {
  const mvp = plan?.mvp_plan || {};
  const marketing = plan?.marketing_plan || {};
  const measurement = plan?.measurement_plan || plan?.metrics || {};
  const improvement = plan?.improvement_plan || {};

  const buildSteps = pad(textList(mvp.build_steps), [
    "Create landing page with one clear paid offer",
    "Build signup and waitlist capture flow",
    "Connect Stripe checkout or payment intent for validation"
  ]).slice(0, 3);

  const launchPosts = pad(textList(marketing.launch_posts), [
    "Publish launch post on X with the core pain and promise",
    "Post a value-first launch message in one relevant community",
    "Send cold email to 20 target users with a validation offer"
  ]).slice(0, 3);

  const measurementRules = pad(
    [
      measurement.kill_rule,
      measurement.improve_rule,
      measurement.scale_rule,
      measurement.target_visitors ? `Track visitors until ${measurement.target_visitors}+ visits` : "",
      measurement.target_signups ? `Track signups until ${measurement.target_signups}+ signups` : ""
    ].filter(Boolean).map(String),
    [
      "Measure visitors, signups, paid users, and revenue daily",
      "Compare results against kill, improve, and scale thresholds"
    ]
  ).slice(0, 2);

  const improvementActions = pad(
    Object.values(improvement).flatMap((value) => textList(value)),
    [
      "Improve headline and offer if signup rate is weak",
      "Improve pricing and proof if paid conversion is weak"
    ]
  ).slice(0, 2);

  const tasks: TaskDraft[] = [
    ...buildSteps.map((step, index) =>
      taskDraft(`Build ${index + 1}: ${step}`, step, index === 0 ? "high" : "medium", "build")
    ),
    ...launchPosts.map((post, index) =>
      taskDraft(`Marketing ${index + 1}: Launch distribution`, post, index === 0 ? "high" : "medium", "marketing")
    ),
    ...measurementRules.map((rule, index) =>
      taskDraft(`Measurement ${index + 1}: ${rule.slice(0, 72)}`, rule, "high", "measurement")
    ),
    ...improvementActions.map((action, index) =>
      taskDraft(`Improvement ${index + 1}: ${action.slice(0, 72)}`, action, "medium", "improvement")
    )
  ];

  return tasks;
}

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in Vercel environment." },
        { status: 500 }
      );
    }

    const { data: opportunities, error: opportunitiesError } = await supabase
      .from("abos_opportunities")
      .select("*")
      .order("score", { ascending: false })
      .limit(20);

    if (opportunitiesError) throw opportunitiesError;

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
    "build_steps": ["...", "...", "..."],
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
    const plan = safeJson(raw);

    const selected = opportunities.find(
      (item: any) => item.title?.toLowerCase() === plan.selected_title?.toLowerCase()
    ) || opportunities[0];

    const { data: run, error: runError } = await supabase
      .from("abos_runs")
      .insert({
        status: "planned",
        selected_opportunity_id: selected.id,
        decision: plan.decision || "build",
        mvp_plan: plan.mvp_plan || {},
        marketing_plan: plan.marketing_plan || {},
        metrics: plan.metrics || plan.measurement_plan || {},
        improvement_plan: plan.improvement_plan || {}
      })
      .select()
      .single();

    if (runError) throw runError;

    const { data: experiment, error: experimentError } = await supabase
      .from("abos_experiments")
      .insert({
        opportunity_id: selected.id,
        name: plan.mvp_plan?.product_name || selected.title,
        hypothesis: plan.selected_reason,
        landing_copy: plan.marketing_plan?.positioning || "",
        offer: plan.marketing_plan?.offer || "",
        channel: (plan.marketing_plan?.channels || [])[0] || "manual",
        budget: 0,
        visitors: 0,
        signups: 0,
        paid: 0,
        revenue: 0,
        status: "planned",
        decision: "pending"
      })
      .select()
      .single();

    if (experimentError) throw experimentError;

    const tasks = buildExecutionTasks(plan).map((task) => ({
      run_id: run.id,
      opportunity_id: selected.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      status: "todo"
    }));

    const { data: insertedTasks, error: tasksError } = await supabase
      .from("abos_tasks")
      .insert(tasks)
      .select();

    if (tasksError) throw tasksError;

    return NextResponse.json({ run, plan, experiment, tasks: insertedTasks || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ABOS run failed." },
      { status: 500 }
    );
  }
}
