import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type AssetType =
  | "landing_page"
  | "pricing_page"
  | "lead_magnet"
  | "email_sequence"
  | "social_posts"
  | "cold_email_sequence"
  | "mvp_build_prompt"
  | "product_requirements_doc"
  | "onboarding_flow"
  | "ad_creatives";

type AssetStatus = "draft";

type JsonRecord = Record<string, unknown>;

type AbosRun = {
  id: string;
  selected_opportunity_id?: string | null;
  mvp_plan?: JsonRecord | null;
  marketing_plan?: JsonRecord | null;
  metrics?: JsonRecord | null;
  improvement_plan?: JsonRecord | null;
};

type AbosOpportunity = {
  id: string;
  title?: string | null;
  audience?: string | null;
  pain?: string | null;
  product_angle?: string | null;
  monetization?: string | null;
};

type AbosAsset = {
  type: AssetType;
  title: string;
  description: string;
  content: JsonRecord;
  status: AssetStatus;
};

type SupabaseMaybeError = {
  code?: string;
  message?: string;
  details?: string;
};

const ASSET_TYPES: AssetType[] = [
  "landing_page",
  "pricing_page",
  "lead_magnet",
  "email_sequence",
  "social_posts",
  "cold_email_sequence",
  "mvp_build_prompt",
  "product_requirements_doc",
  "onboarding_flow",
  "ad_creatives"
];

function isMissingTable(error: SupabaseMaybeError | null | undefined) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("42p01") || message.includes("pgrst205") || message.includes("could not find the table") || message.includes("does not exist");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "Unknown error");
  }
  return "Unknown error";
}

function cleanJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

function stringFrom(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function listFrom(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item)).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }
  return fallback;
}

function contextFrom(run: AbosRun, opportunity: AbosOpportunity | null) {
  const mvpPlan = run.mvp_plan || {};
  const marketingPlan = run.marketing_plan || {};
  const productName = stringFrom(mvpPlan.product_name, opportunity?.title || "ABOS SaaS MVP");
  const targetUser = stringFrom(mvpPlan.target_user, opportunity?.audience || "small business operators");
  const problem = stringFrom(opportunity?.pain, "manual work slows growth and follow-up");
  const solution = stringFrom(
    mvpPlan.one_line_promise,
    stringFrom(opportunity?.product_angle, `A focused SaaS workflow for ${targetUser}`)
  );
  const offer = stringFrom(marketingPlan.offer, "Start with the beta and validate the workflow this week.");
  const coreFeatures = listFrom(mvpPlan.core_features, [
    "Guided workflow setup",
    "AI-assisted asset generation",
    "Progress tracking",
    "Conversion-focused recommendations"
  ]);

  return { productName, targetUser, problem, solution, offer, coreFeatures };
}

function fallbackAssets(run: AbosRun, opportunity: AbosOpportunity | null): AbosAsset[] {
  const context = contextFrom(run, opportunity);
  const { productName, targetUser, problem, solution, offer, coreFeatures } = context;

  return [
    {
      type: "landing_page",
      title: `${productName} Landing Page`,
      description: `Conversion-focused landing page for ${targetUser}.`,
      status: "draft",
      content: {
        headline: solution,
        subheadline: `${productName} helps ${targetUser} move from ${problem.toLowerCase()} to a measurable operating workflow.`,
        pain_points: [
          problem,
          "Manual follow-up and setup consume time that should go to revenue work.",
          "Existing tools are broader than the first job that needs validation."
        ],
        benefits: [
          "Launch a focused workflow quickly",
          "Measure intent before expanding scope",
          "Turn repeatable steps into a simple operating system"
        ],
        features: coreFeatures,
        cta: "Join the beta",
        faq: [
          {
            question: `Who is ${productName} for?`,
            answer: `${productName} is for ${targetUser} who need a focused SaaS workflow instead of another broad tool.`
          },
          {
            question: "What happens after signup?",
            answer: "Early users get access to the core workflow, onboarding help, and product updates as the MVP improves."
          }
        ]
      }
    },
    {
      type: "pricing_page",
      title: `${productName} Pricing Page`,
      description: "Starter and Pro pricing draft for demand validation.",
      status: "draft",
      content: {
        plans: [
          {
            name: "Starter",
            price: 19,
            features: ["Core workflow", "Basic AI assistance", "Email support"]
          },
          {
            name: "Pro",
            price: 49,
            features: ["Advanced workflow templates", "Priority support", "Team-ready exports"]
          }
        ],
        guarantee: "Cancel anytime during the beta if the workflow does not save meaningful time.",
        cta: "Start with Starter"
      }
    },
    {
      type: "lead_magnet",
      title: `${productName} Validation Checklist`,
      description: "Checklist lead magnet for capturing qualified early users.",
      status: "draft",
      content: {
        format: "checklist",
        title: `${productName}: 10-Point Workflow Validation Checklist`,
        items: [
          "Define the one painful workflow to improve",
          "Write the before-and-after promise",
          "Pick one measurable activation event",
          "Draft the first paid offer",
          "Identify 25 reachable prospects",
          "Publish the landing page",
          "Send the first outreach batch",
          "Track visitors, signups, and replies",
          "Review objections after 48 hours",
          "Decide whether to improve, scale, or pause"
        ]
      }
    },
    {
      type: "email_sequence",
      title: `${productName} Nurture Email Sequence`,
      description: "Three-email sequence for new leads.",
      status: "draft",
      content: {
        emails: [
          {
            subject: `Welcome to ${productName}`,
            body: `Thanks for joining. ${productName} is built for ${targetUser} who want to solve: ${problem}. The first step is to confirm the workflow you want to improve.`
          },
          {
            subject: "The workflow gap we are fixing",
            body: `Most tools try to do too much. ${productName} focuses on ${solution}. Reply with the step that currently takes the most time.`
          },
          {
            subject: "Ready to try the beta?",
            body: `${offer} If that fits your current workflow, start with the beta and send feedback after your first run.`
          }
        ]
      }
    },
    {
      type: "social_posts",
      title: `${productName} Social Launch Posts`,
      description: "Launch copy for X, LinkedIn, and Facebook.",
      status: "draft",
      content: {
        x_posts: [
          `${targetUser}: if ${problem.toLowerCase()} is costing you time, I am testing ${productName}. It focuses on one workflow: ${solution}`,
          `Building ${productName} for ${targetUser}. The goal is simple: less manual work, faster validation, clearer next steps.`
        ],
        linkedin_posts: [
          `I am testing ${productName}, a focused SaaS workflow for ${targetUser}. It is designed around a specific pain: ${problem}. Early users can help shape the MVP.`,
          `The best MVPs prove one promise. For ${productName}, that promise is: ${solution}. I am looking for early feedback from ${targetUser}.`
        ],
        facebook_posts: [
          `Question for ${targetUser}: how are you currently handling ${problem.toLowerCase()}? I am testing a small tool called ${productName}.`,
          `Beta testers wanted for ${productName}. It helps with ${solution}. Comment or message if this workflow matters to you.`
        ]
      }
    },
    {
      type: "cold_email_sequence",
      title: `${productName} Cold Email Sequence`,
      description: "Three-step ethical outreach sequence.",
      status: "draft",
      content: {
        emails: [
          {
            subject: `Question about ${problem.toLowerCase()}`,
            body: `Hi {{name}}, I am testing ${productName} for ${targetUser}. It helps with ${solution}. Is this a workflow you are trying to improve right now?`
          },
          {
            subject: `Worth a look, {{name}}?`,
            body: `Following up once. The beta is focused on one outcome: helping ${targetUser} reduce the pain around ${problem.toLowerCase()}. Open to a short look?`
          },
          {
            subject: "Should I close the loop?",
            body: `No worries if now is not the right time. If ${problem.toLowerCase()} becomes a priority, I can send the ${productName} beta link.`
          }
        ]
      }
    },
    {
      type: "mvp_build_prompt",
      title: `${productName} MVP Build Prompt`,
      description: "Implementation prompt for Codex.",
      status: "draft",
      content: {
        prompt: `Build an MVP for ${productName}. Target user: ${targetUser}. Problem: ${problem}. Promise: ${solution}. Core features: ${coreFeatures.join(", ")}. Include landing page, signup capture, pricing validation, basic onboarding, and event tracking. Keep scope narrow and production-safe.`
      }
    },
    {
      type: "product_requirements_doc",
      title: `${productName} Product Requirements Doc`,
      description: "PRD draft for the MVP.",
      status: "draft",
      content: {
        product_name: productName,
        target_user: targetUser,
        problem,
        solution,
        core_features: coreFeatures,
        user_stories: [
          `As a ${targetUser}, I want to understand the product promise quickly so I can decide whether it fits my problem.`,
          `As a ${targetUser}, I want to sign up for the beta so I can try the workflow.`,
          `As an operator, I want to track activation and conversion so I can decide whether to improve or scale.`
        ],
        data_model: ["users", "leads", "experiments", "events", "subscriptions"],
        api_routes: ["/api/signup", "/api/checkout", "/api/events", "/api/onboarding"],
        success_metrics: ["visitor_to_signup_rate", "signup_to_paid_rate", "activation_rate", "monthly_recurring_revenue"]
      }
    },
    {
      type: "onboarding_flow",
      title: `${productName} Onboarding Flow`,
      description: "Activation-focused onboarding plan.",
      status: "draft",
      content: {
        steps: [
          "Confirm the user's role and primary workflow",
          "Ask for the current bottleneck",
          "Generate the first recommended setup",
          "Prompt the user to complete one activation action",
          "Show next best action and upgrade path"
        ],
        activation_event: "User completes the first workflow setup",
        upgrade_trigger: "User wants repeated workflows, exports, or priority support"
      }
    },
    {
      type: "ad_creatives",
      title: `${productName} Ad Creative Drafts`,
      description: "Hooks, primary text, headlines, and CTAs for paid tests.",
      status: "draft",
      content: {
        hooks: [
          `Still dealing with ${problem.toLowerCase()}?`,
          `A focused workflow for ${targetUser}`,
          `Validate the workflow before you buy another broad tool`
        ],
        primary_texts: [
          `${productName} helps ${targetUser} solve ${problem.toLowerCase()} with a focused MVP workflow.`,
          `Try ${productName} if you need ${solution.toLowerCase()} without adding operational complexity.`
        ],
        headlines: [`${productName} for ${targetUser}`, "Launch the workflow faster", "Turn pain into a tested process"],
        cta: ["Join the beta", "Start now", "See the workflow"]
      }
    }
  ];
}

function isAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && ASSET_TYPES.includes(value as AssetType);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAssets(value: unknown): AbosAsset[] {
  const rawAssets = isRecord(value) && Array.isArray(value.assets) ? value.assets : value;
  if (!Array.isArray(rawAssets)) return [];

  const assets = rawAssets
    .filter(isRecord)
    .map((asset) => ({
      type: isAssetType(asset.type) ? asset.type : null,
      title: stringFrom(asset.title, ""),
      description: stringFrom(asset.description, ""),
      content: isRecord(asset.content) ? asset.content : {},
      status: "draft" as const
    }))
    .filter((asset): asset is AbosAsset => Boolean(asset.type && asset.title && asset.description));

  const types = new Set(assets.map((asset) => asset.type));
  return ASSET_TYPES.every((type) => types.has(type)) ? assets : [];
}

async function logEvent(event: string, payload: JsonRecord) {
  const { error } = await supabase.from("abos_logs").insert({ event, payload });
  if (error && !isMissingTable(error)) {
    return error.message;
  }
  return null;
}

async function generateWithOpenAI(run: AbosRun, opportunity: AbosOpportunity | null) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const prompt = `
You are ABOS 2030, an ethical SaaS Digital Asset Factory.

Generate a complete SaaS digital asset bundle from the latest selected opportunity/run.
Use the ABOS skill rules in /abos-skills/mvp-builder.md, /abos-skills/marketing-launch.md, /abos-skills/daily-report.md, and /abos-skills/autopilot-operator.md.

Do not fabricate proof, customers, revenue, testimonials, urgency, or guarantees.
Do not recommend spam, deception, or unsafe automation.

Latest run:
${JSON.stringify(run, null, 2)}

Selected opportunity:
${JSON.stringify(opportunity, null, 2)}

Return valid JSON only with this shape:
{
  "assets": [
    {"type":"landing_page","title":"...","description":"...","content":{"headline":"...","subheadline":"...","pain_points":["..."],"benefits":["..."],"features":["..."],"cta":"...","faq":[{"question":"...","answer":"..."}]},"status":"draft"},
    {"type":"pricing_page","title":"...","description":"...","content":{"plans":[{"name":"Starter","price":19,"features":["..."]},{"name":"Pro","price":49,"features":["..."]}],"guarantee":"...","cta":"..."},"status":"draft"},
    {"type":"lead_magnet","title":"...","description":"...","content":{"format":"checklist","title":"...","items":["..."]},"status":"draft"},
    {"type":"email_sequence","title":"...","description":"...","content":{"emails":[{"subject":"...","body":"..."}]},"status":"draft"},
    {"type":"social_posts","title":"...","description":"...","content":{"x_posts":["..."],"linkedin_posts":["..."],"facebook_posts":["..."]},"status":"draft"},
    {"type":"cold_email_sequence","title":"...","description":"...","content":{"emails":[{"subject":"...","body":"..."}]},"status":"draft"},
    {"type":"mvp_build_prompt","title":"...","description":"...","content":{"prompt":"..."},"status":"draft"},
    {"type":"product_requirements_doc","title":"...","description":"...","content":{"product_name":"...","target_user":"...","problem":"...","solution":"...","core_features":["..."],"user_stories":["..."],"data_model":["..."],"api_routes":["..."],"success_metrics":["..."]},"status":"draft"},
    {"type":"onboarding_flow","title":"...","description":"...","content":{"steps":["..."],"activation_event":"...","upgrade_trigger":"..."},"status":"draft"},
    {"type":"ad_creatives","title":"...","description":"...","content":{"hooks":["..."],"primary_texts":["..."],"headlines":["..."],"cta":["..."]},"status":"draft"}
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(cleanJson(raw)) as unknown;
  const assets = normalizeAssets(parsed);

  if (assets.length === 0) {
    throw new Error("OpenAI returned an invalid asset bundle.");
  }

  return assets;
}

function assetTaskDrafts(run: AbosRun, opportunity: AbosOpportunity | null) {
  const opportunityId = opportunity?.id || run.selected_opportunity_id || null;

  return [
    ["Review landing page copy", "Review the generated landing page and approve copy for publishing.", "marketing"],
    ["Publish pricing page", "Publish the Starter and Pro pricing page draft.", "marketing"],
    ["Package lead magnet", "Turn the generated checklist into a downloadable lead magnet.", "marketing"],
    ["Schedule social posts", "Schedule the generated posts across the selected channels.", "marketing"],
    ["Send cold email sequence", "Send the ethical cold email sequence to a targeted prospect list.", "marketing"],
    ["Build MVP from prompt", "Use the generated MVP build prompt to implement the first product version.", "build"],
    ["Review PRD", "Review the generated product requirements document before implementation.", "build"],
    ["Create onboarding screens", "Create onboarding screens from the generated onboarding flow.", "build"],
    ["Launch ad creative test", "Launch a small ad creative test with the generated hooks and headlines.", "measurement"]
  ].map(([title, description, category]) => ({
    run_id: run.id,
    opportunity_id: opportunityId,
    title,
    description,
    priority: "medium",
    category,
    status: "todo"
  }));
}

export async function POST() {
  const logs: string[] = [];
  const warnings: string[] = [];

  try {
    const { data: runs, error: runsError } = await supabase
      .from("abos_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (runsError) throw runsError;

    const latestRun = (runs?.[0] || null) as AbosRun | null;
    if (!latestRun) {
      return NextResponse.json({ error: "No ABOS run found. Run ABOS 2030 first." }, { status: 400 });
    }

    const startedLog = await logEvent("assets_generate_started", { run_id: latestRun.id });
    if (startedLog) warnings.push(`Log insert failed: ${startedLog}`);
    else logs.push("assets_generate_started");

    let selectedOpportunity: AbosOpportunity | null = null;
    if (latestRun.selected_opportunity_id) {
      const { data: opportunity, error: opportunityError } = await supabase
        .from("abos_opportunities")
        .select("*")
        .eq("id", latestRun.selected_opportunity_id)
        .maybeSingle();

      if (opportunityError && !isMissingTable(opportunityError)) throw opportunityError;
      selectedOpportunity = (opportunity || null) as AbosOpportunity | null;
    }

    let source: "openai" | "fallback" = "openai";
    let assets: AbosAsset[];

    try {
      assets = await generateWithOpenAI(latestRun, selectedOpportunity);
    } catch (error) {
      source = "fallback";
      warnings.push(`OpenAI asset generation failed; used fallback assets. ${errorMessage(error)}`);
      assets = fallbackAssets(latestRun, selectedOpportunity);
    }

    const generatedLog = await logEvent("assets_generated", {
      run_id: latestRun.id,
      source,
      count: assets.length
    });
    if (generatedLog) warnings.push(`Log insert failed: ${generatedLog}`);
    else logs.push("assets_generated");

    let insertedAssets: unknown[] = [];
    const { data: assetRows, error: assetsError } = await supabase
      .from("abos_assets")
      .insert(assets)
      .select();

    if (assetsError) {
      if (isMissingTable(assetsError)) {
        warnings.push("abos_assets table is missing; returned generated assets without persistence.");
      } else {
        warnings.push(`Asset insert failed: ${assetsError.message}`);
      }
    } else {
      insertedAssets = assetRows || [];
      const insertedLog = await logEvent("assets_inserted", {
        run_id: latestRun.id,
        count: insertedAssets.length
      });
      if (insertedLog) warnings.push(`Log insert failed: ${insertedLog}`);
      else logs.push("assets_inserted");
    }

    const taskDrafts = assetTaskDrafts(latestRun, selectedOpportunity);
    const { data: taskRows, error: tasksError } = await supabase
      .from("abos_tasks")
      .insert(taskDrafts)
      .select();

    if (tasksError) {
      if (isMissingTable(tasksError)) {
        warnings.push("abos_tasks table is missing; asset follow-up tasks were not stored.");
      } else {
        warnings.push(`Task insert failed: ${tasksError.message}`);
      }
    } else {
      const taskLog = await logEvent("asset_tasks_created", {
        run_id: latestRun.id,
        count: taskRows?.length || 0
      });
      if (taskLog) warnings.push(`Log insert failed: ${taskLog}`);
      else logs.push("asset_tasks_created");
    }

    return NextResponse.json({
      assets: insertedAssets.length > 0 ? insertedAssets : assets,
      generated_assets: assets,
      tasks: taskRows || [],
      source,
      logs,
      warnings
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error), logs, warnings },
      { status: 500 }
    );
  }
}
