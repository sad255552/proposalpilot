"use client";

import { useEffect, useMemo, useState } from "react";

type ExperimentInput = {
  visitors?: string;
  signups?: string;
  paid?: string;
  revenue?: string;
};

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

type AbosAsset = {
  id?: string;
  type: AssetType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  status: string;
  public_url?: string | null;
};

type AutopilotStatus = "idle" | "running" | "completed" | "failed";

type AutopilotResult = {
  success?: boolean;
  opportunities_created?: number;
  run_id?: string | null;
  tasks_created?: number;
  report_id?: string | null;
  assets_created?: number;
  warnings?: string[];
  error?: string;
};

const ASSET_COPY_LABELS: Record<AssetType, string> = {
  landing_page: "Copy Landing Page",
  pricing_page: "Copy Pricing Page",
  lead_magnet: "Copy Lead Magnet",
  email_sequence: "Copy Email Sequence",
  social_posts: "Copy Social Posts",
  cold_email_sequence: "Copy Cold Emails",
  mvp_build_prompt: "Copy MVP Build Prompt",
  product_requirements_doc: "Copy PRD",
  onboarding_flow: "Copy Onboarding Flow",
  ad_creatives: "Copy Ad Creatives"
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  landing_page: "Landing Page",
  pricing_page: "Pricing Page",
  lead_magnet: "Lead Magnet",
  email_sequence: "Email Sequence",
  social_posts: "Social Posts",
  cold_email_sequence: "Cold Emails",
  mvp_build_prompt: "MVP Build Prompt",
  product_requirements_doc: "PRD",
  onboarding_flow: "Onboarding Flow",
  ad_creatives: "Ad Creatives"
};

function asList(value: any): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function isAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && value in ASSET_COPY_LABELS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAsset(value: unknown): AbosAsset | null {
  if (!isRecord(value) || !isAssetType(value.type)) return null;

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: value.type,
    title: typeof value.title === "string" ? value.title : ASSET_TYPE_LABELS[value.type],
    description: typeof value.description === "string" ? value.description : "",
    content: isRecord(value.content) ? value.content : {},
    status: typeof value.status === "string" ? value.status : "draft",
    public_url: typeof value.public_url === "string" ? value.public_url : null
  };
}

function previewContent(content: Record<string, unknown>) {
  return JSON.stringify(content, null, 2);
}

export default function ABOSPage() {
  const [state, setState] = useState<any>({});
  const [latestRun, setLatestRun] = useState<any>(null);
  const [assets, setAssets] = useState<AbosAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const [publishingAssetId, setPublishingAssetId] = useState<string | null>(null);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus>("idle");
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [experimentInputs, setExperimentInputs] = useState<Record<string, ExperimentInput>>({});

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const stateRes = await fetch("/api/abos/state");
    const stateJson = await stateRes.json();
    setState(stateJson || {});

    const runsRes = await fetch("/api/abos/runs");
    if (runsRes.ok) {
      const runsJson = await runsRes.json();
      setLatestRun(runsJson.runs?.[0] || null);
    }

    await loadAssets();
  }

  async function loadAssets() {
    const assetsRes = await fetch("/api/abos/assets");
    if (!assetsRes.ok) {
      setAssets([]);
      return;
    }

    const assetsJson = await assetsRes.json();
    const normalizedAssets = Array.isArray(assetsJson.assets)
      ? assetsJson.assets.map(normalizeAsset).filter((asset: AbosAsset | null): asset is AbosAsset => Boolean(asset))
      : [];

    setAssets(normalizedAssets);
  }

  async function scanMarket() {
    setLoading(true);

    try {
      const res = await fetch("/api/abos/scan", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Scan failed");
      }

      await loadState();
    } catch (error: any) {
      alert(error.message || "Scan request failed");
    } finally {
      setLoading(false);
    }
  }

  async function runABOS() {
    setLoading(true);

    try {
      const res = await fetch("/api/abos/run", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "ABOS run failed");
      } else {
        setLatestRun(json.run);
      }

      await loadState();
    } catch (error: any) {
      alert(error.message || "ABOS run request failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    setReportLoading(true);

    try {
      const res = await fetch("/api/abos/report", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Report generation failed");
      }

      await loadState();
    } catch (error: any) {
      alert(error.message || "Report request failed");
    } finally {
      setReportLoading(false);
    }
  }

  async function generateAssets() {
    setAssetLoading(true);

    try {
      const res = await fetch("/api/abos/assets/generate", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Asset generation failed");
      } else {
        const normalizedAssets = Array.isArray(json.assets)
          ? json.assets.map(normalizeAsset).filter((asset: AbosAsset | null): asset is AbosAsset => Boolean(asset))
          : [];
        setAssets(normalizedAssets);

        if (Array.isArray(json.warnings) && json.warnings.length > 0) {
          alert(`Assets generated with warnings:\n${json.warnings.join("\n")}`);
        }
      }

      await loadState();
    } catch (error: any) {
      alert(error.message || "Asset generation request failed");
    } finally {
      setAssetLoading(false);
    }
  }

  async function publishAsset(assetId?: string) {
    if (!assetId) {
      alert("Cannot publish an asset without an id.");
      return;
    }

    setPublishingAssetId(assetId);

    try {
      const res = await fetch("/api/abos/assets/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId })
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Asset publish failed");
        return;
      }

      await loadAssets();
    } catch (error: any) {
      alert(error.message || "Asset publish request failed");
    } finally {
      setPublishingAssetId(null);
    }
  }

  async function runAutopilot() {
    setAutopilotStatus("running");
    setAutopilotResult(null);

    try {
      const res = await fetch("/api/abos/autopilot", { method: "POST" });
      const json = await res.json();
      setAutopilotResult(json);
      setAutopilotStatus(res.ok ? "completed" : "failed");
      await loadState();
    } catch (error: any) {
      setAutopilotStatus("failed");
      setAutopilotResult({ success: false, error: error.message || "Autopilot request failed" });
    }
  }

  async function markTaskDone(taskId: string) {
    const res = await fetch("/api/abos/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: "done" })
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Task update failed");
      return;
    }

    await loadState();
  }

  function updateExperimentInput(experimentId: string, key: keyof ExperimentInput, value: string) {
    setExperimentInputs((current) => ({
      ...current,
      [experimentId]: {
        ...(current[experimentId] || {}),
        [key]: value
      }
    }));
  }

  async function decideExperiment(experiment: any, decision?: "kill" | "improve" | "scale") {
    const input = experimentInputs[experiment.id] || {};

    const payload = {
      experimentId: experiment.id,
      decision,
      visitors: input.visitors ?? experiment.visitors ?? 0,
      signups: input.signups ?? experiment.signups ?? 0,
      paid: input.paid ?? experiment.paid ?? 0,
      revenue: input.revenue ?? experiment.revenue ?? 0
    };

    const res = await fetch("/api/abos/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Decision failed");
      return;
    }

    await loadState();
  }

  const opportunities = state.opportunities || [];
  const tasks = state.tasks || [];
  const experiments = state.experiments || [];
  const reports = state.reports || [];
  const latestReport = reports[0];
  const publishedAssets = assets.filter((asset) => asset.status === "published" || Boolean(asset.public_url)).length;
  const operatingScore = useMemo(() => {
    const opportunityScore = Math.min(opportunities.length, 10) * 2;
    const taskScore = Math.min(tasks.length, 20);
    const doneTaskScore = Math.min(tasks.filter((task: any) => task.status === "done").length, 20);
    const reportScore = Math.min(reports.length, 5) * 4;
    const assetScore = Math.min(assets.length, 10) * 2;
    const publishedScore = Math.min(publishedAssets, 10) * 2;
    const winnerScore = Math.min(
      experiments.filter((experiment: any) => experiment.decision === "scale" || experiment.status === "winner").length,
      2
    ) * 10;

    return Math.min(100, Math.round(opportunityScore + taskScore + doneTaskScore + reportScore + assetScore + publishedScore + winnerScore));
  }, [assets.length, experiments, opportunities.length, publishedAssets, reports.length, tasks]);

  const groupedAssets = useMemo(() => {
    return assets.reduce((acc: Record<AssetType, AbosAsset[]>, asset) => {
      acc[asset.type] = acc[asset.type] || [];
      acc[asset.type].push(asset);
      return acc;
    }, {} as Record<AssetType, AbosAsset[]>);
  }, [assets]);

  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc: Record<string, any[]>, task: any) => {
      const category = task.category || "other";
      acc[category] = acc[category] || [];
      acc[category].push(task);
      return acc;
    }, {});
  }, [tasks]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <a href="/" className="text-sm text-emerald-400">← Back to ProposalPilot</a>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">ABOS 2030</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-7xl">
              Autonomous Business Operating System
            </h1>
            <p className="mt-5 max-w-3xl text-zinc-400">
              Scans opportunities, chooses the best, plans MVP, creates execution tasks,
              launches experiments, measures results, reports daily, and decides kill / improve / scale.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={scanMarket} disabled={loading} className="rounded-xl border border-zinc-700 px-5 py-4 font-semibold hover:bg-zinc-900 disabled:opacity-60">
              Scan Market
            </button>

            <button onClick={runABOS} disabled={loading} className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
              {loading ? "Operating..." : "Run ABOS 2030"}
            </button>

            <button onClick={generateReport} disabled={reportLoading} className="rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200 disabled:opacity-60">
              {reportLoading ? "Generating..." : "Generate Report"}
            </button>

            <button onClick={generateAssets} disabled={assetLoading || loading} className="rounded-xl border border-emerald-700 px-5 py-4 font-semibold text-emerald-200 hover:bg-emerald-950/30 disabled:opacity-60">
              {assetLoading ? "Generating..." : "Generate SaaS Assets"}
            </button>

            <button onClick={loadState} disabled={loading} className="rounded-xl border border-zinc-700 px-5 py-4 font-semibold hover:bg-zinc-900 disabled:opacity-60">
              Refresh
            </button>
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-7">
          <Metric label="Opportunities" value={String(opportunities.length)} />
          <Metric label="Tasks" value={String(tasks.length)} />
          <Metric label="Experiments" value={String(experiments.length)} />
          <Metric label="Reports" value={String(reports.length)} />
          <Metric label="Assets" value={String(assets.length)} />
          <Metric label="Operating Score" value={`${operatingScore}/100`} />
          <Metric label="Mode" value="2030" />
        </section>

        <section className="mt-10 rounded-3xl border border-emerald-950 bg-zinc-950 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Autopilot</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Runs the daily loop: market scan, ABOS plan, report, and SaaS asset generation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-zinc-800 px-3 py-2 text-xs uppercase tracking-wide text-zinc-400">
                {autopilotStatus}
              </span>
              <button onClick={runAutopilot} disabled={autopilotStatus === "running"} className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
                {autopilotStatus === "running" ? "Running Autopilot..." : "Run Daily Autopilot"}
              </button>
            </div>
          </div>

          {autopilotResult && (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="grid gap-3 md:grid-cols-5">
                <MiniMetric label="Opportunities" value={String(autopilotResult.opportunities_created ?? 0)} />
                <MiniMetric label="Tasks" value={String(autopilotResult.tasks_created ?? 0)} />
                <MiniMetric label="Assets" value={String(autopilotResult.assets_created ?? 0)} />
                <MiniMetric label="Run" value={autopilotResult.run_id || "none"} />
                <MiniMetric label="Report" value={autopilotResult.report_id || "none"} />
              </div>

              {autopilotResult.error && (
                <p className="mt-4 rounded-xl border border-red-950 bg-red-950/20 p-3 text-sm text-red-300">
                  {autopilotResult.error}
                </p>
              )}

              {Array.isArray(autopilotResult.warnings) && autopilotResult.warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-yellow-950 bg-yellow-950/20 p-3 text-sm text-yellow-200">
                  <p className="font-semibold">Warnings</p>
                  <ul className="mt-2 space-y-1">
                    {autopilotResult.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-bold">Decision Pipeline</h2>

            <div className="mt-6 grid gap-3">
              {[
                "1. Scan market opportunities",
                "2. Rank by pain, speed, monetization, acquisition, originality",
                "3. Select the best opportunity",
                "4. Generate MVP build plan",
                "5. Create execution tasks",
                "6. Generate launch campaign",
                "7. Measure visitors, signups, paid users, revenue",
                "8. Generate daily operating report",
                "9. Decide: kill, improve, or scale"
              ].map((step) => (
                <div key={step} className="rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-950 bg-zinc-950 p-6">
            <h2 className="text-2xl font-bold">Latest Autonomous Run</h2>

            {!latestRun ? (
              <p className="mt-6 text-zinc-500">
                No ABOS 2030 run yet. Click Scan Market, then Run ABOS 2030.
              </p>
            ) : (
              <div className="mt-6 grid gap-5">
                <Box title="Decision" body={latestRun.decision || "pending"} />
                <Box title="MVP Plan" body={JSON.stringify(latestRun.mvp_plan, null, 2)} />
                <Box title="Marketing Plan" body={JSON.stringify(latestRun.marketing_plan, null, 2)} />
                <Box title="Metrics" body={JSON.stringify(latestRun.metrics || latestRun.measurement_plan, null, 2)} />
                <Box title="Improvement Plan" body={JSON.stringify(latestRun.improvement_plan, null, 2)} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">SaaS Digital Asset Factory</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Complete launch assets generated from the latest selected opportunity and ABOS run.
              </p>
            </div>

            <button onClick={generateAssets} disabled={assetLoading || loading} className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
              {assetLoading ? "Generating SaaS Assets..." : "Generate SaaS Assets"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {assets.length === 0 && (
              <p className="text-zinc-500">No assets yet. Generate SaaS assets after ABOS has selected an opportunity.</p>
            )}

            {Object.entries(groupedAssets).map(([type, items]) => (
              <div key={type} className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-emerald-400">
                    {ASSET_TYPE_LABELS[type as AssetType] || type}
                  </h3>
                  <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
                    {items.length}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {items.map((asset, index) => (
                    <AssetCard
                      key={asset.id || `${asset.type}-${index}`}
                      asset={asset}
                      publishing={publishingAssetId === asset.id}
                      onPublish={publishAsset}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Execution Tasks</h2>
            <span className="rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-400">
              {tasks.filter((task: any) => task.status === "done").length}/{tasks.length} done
            </span>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {tasks.length === 0 && <p className="text-zinc-500">No tasks yet. Run ABOS 2030 to create execution tasks.</p>}

            {Object.entries(groupedTasks).map(([category, items]) => (
              <div key={category} className="rounded-2xl border border-zinc-800 bg-black p-5">
                <h3 className="text-lg font-bold capitalize text-emerald-400">{category}</h3>
                <div className="mt-4 grid gap-3">
                  {(items as any[]).map((task: any) => (
                    <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="mt-2 text-sm text-zinc-500">{task.description}</p>
                        </div>
                        <span className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-zinc-300">{task.priority}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wide text-zinc-500">{task.status}</span>
                        {task.status !== "done" && (
                          <button onClick={() => markTaskDone(task.id)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400">
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold">Experiments</h2>

          <div className="mt-6 grid gap-4">
            {experiments.length === 0 && <p className="text-zinc-500">No experiments yet. Run ABOS 2030.</p>}

            {experiments.map((experiment: any) => {
              const input = experimentInputs[experiment.id] || {};

              return (
                <div key={experiment.id} className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{experiment.name}</h3>
                      <p className="mt-2 text-sm text-zinc-500">{experiment.hypothesis}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-zinc-900 px-3 py-2">decision: {experiment.decision || "pending"}</span>
                      <span className="rounded-lg bg-zinc-900 px-3 py-2">status: {experiment.status || "planned"}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    {(["visitors", "signups", "paid", "revenue"] as const).map((key) => (
                      <label key={key} className="text-sm text-zinc-400">
                        <span className="capitalize">{key}</span>
                        <input
                          type="number"
                          value={input[key] ?? String(experiment[key] ?? 0)}
                          onChange={(event) => updateExperimentInput(experiment.id, key, event.target.value)}
                          className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-emerald-500"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => decideExperiment(experiment)} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold hover:bg-zinc-900">
                      Auto Decide
                    </button>
                    <button onClick={() => decideExperiment(experiment, "kill")} className="rounded-xl border border-red-950 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-950/30">
                      Decide Kill
                    </button>
                    <button onClick={() => decideExperiment(experiment, "improve")} className="rounded-xl border border-yellow-950 px-4 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-950/30">
                      Decide Improve
                    </button>
                    <button onClick={() => decideExperiment(experiment, "scale")} className="rounded-xl border border-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-950/30">
                      Decide Scale
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Reports</h2>
            <button onClick={generateReport} disabled={reportLoading} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-60">
              Generate Report
            </button>
          </div>

          {!latestReport ? (
            <p className="mt-6 text-zinc-500">No reports yet. Generate the first daily operating report.</p>
          ) : (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-sm text-emerald-400">{latestReport.title || "ABOS Daily Operating Report"}</p>
              <p className="mt-3 text-zinc-300">{latestReport.summary}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <ReportList title="Wins" items={asList(latestReport.wins)} />
                <ReportList title="Risks" items={asList(latestReport.risks)} />
                <ReportList title="Next Actions" items={asList(latestReport.next_actions)} />
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold">Top Opportunities</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {opportunities.length === 0 && (
              <p className="text-zinc-500">No opportunities yet. Click Scan Market.</p>
            )}

            {opportunities.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-emerald-400">{item.audience}</p>
                    <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                  </div>
                  <div className="rounded-xl bg-emerald-500 px-3 py-2 font-bold text-black">
                    {item.total_score || item.score || 0}
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-400">
                  <span className="text-zinc-200">Pain:</span> {item.pain}
                </p>

                <p className="mt-3 text-sm text-zinc-400">
                  <span className="text-zinc-200">Angle:</span> {item.product_angle}
                </p>

                <p className="mt-3 text-sm text-zinc-400">
                  <span className="text-zinc-200">Monetization:</span> {item.monetization}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function Box({ title, body }: { title: string; body: string }) {
  async function copy() {
    await navigator.clipboard.writeText(body || "");
    alert("Copied");
  }

  return (
    <div className="rounded-xl bg-black p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-400">{title}</p>
        <button onClick={copy} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs hover:bg-zinc-900">
          Copy
        </button>
      </div>

      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-300">
        {body}
      </pre>
    </div>
  );
}

function AssetCard({
  asset,
  publishing,
  onPublish
}: {
  asset: AbosAsset;
  publishing: boolean;
  onPublish: (assetId?: string) => void;
}) {
  const body = previewContent(asset.content);
  const publicUrl = asset.public_url || (asset.status === "published" && asset.id ? `/assets/${asset.id}` : "");

  async function copy() {
    await navigator.clipboard.writeText(body || "");
    alert("Copied");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="font-semibold">{asset.title}</h4>
          <p className="mt-2 text-sm text-zinc-500">{asset.description}</p>
        </div>

        <span className={`w-fit rounded-lg px-3 py-2 text-xs uppercase tracking-wide ${asset.status === "published" ? "bg-emerald-950 text-emerald-200" : "bg-zinc-900 text-zinc-300"}`}>
          {asset.status}
        </span>
      </div>

      {publicUrl && (
        <div className="mt-4 rounded-lg border border-emerald-950 bg-emerald-950/20 p-3 text-xs text-emerald-200">
          <p>Public URL: {publicUrl}</p>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-semibold text-emerald-300 hover:text-emerald-200">
            Open Public Page
          </a>
        </div>
      )}

      <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-900 bg-black p-3 text-xs leading-6 text-zinc-300">
        {body}
      </pre>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={copy} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-900">
          {ASSET_COPY_LABELS[asset.type]}
        </button>
        <button onClick={() => onPublish(asset.id)} disabled={publishing || !asset.id} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-60">
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-zinc-950 p-4">
      <h3 className="font-semibold text-emerald-400">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-400">
        {items.length === 0 && <li>No items yet.</li>}
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
