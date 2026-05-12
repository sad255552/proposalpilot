"use client";

import { useEffect, useState } from "react";

export default function ABOSPage() {
  const [state, setState] = useState<any>({});
  const [latestRun, setLatestRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
  }

  async function scanMarket() {
    setLoading(true);
    const res = await fetch("/api/abos/scan", { method: "POST" });
    const json = await res.json();

    if (!res.ok) alert(json.error || "Scan failed");

    await loadState();
    setLoading(false);
  }

  async function runABOS() {
    setLoading(true);
    const res = await fetch("/api/abos/run", { method: "POST" });
    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "ABOS run failed");
    } else {
      setLatestRun(json.run);
    }

    await loadState();
    setLoading(false);
  }

  const opportunities = state.opportunities || [];
  const tasks = state.tasks || [];
  const experiments = state.experiments || [];
  const reports = state.reports || [];

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
              Scans opportunities, chooses the best, plans MVP, prepares launch,
              measures results, kills weak experiments, and scales winners.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={scanMarket} disabled={loading} className="rounded-xl border border-zinc-700 px-5 py-4 font-semibold hover:bg-zinc-900 disabled:opacity-60">
              Scan Market
            </button>

            <button onClick={runABOS} disabled={loading} className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
              {loading ? "Operating..." : "Run ABOS 2030"}
            </button>

            <button onClick={loadState} disabled={loading} className="rounded-xl border border-zinc-700 px-5 py-4 font-semibold hover:bg-zinc-900 disabled:opacity-60">
              Refresh
            </button>
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-5">
          <Metric label="Opportunities" value={String(opportunities.length)} />
          <Metric label="Tasks" value={String(tasks.length)} />
          <Metric label="Experiments" value={String(experiments.length)} />
          <Metric label="Reports" value={String(reports.length)} />
          <Metric label="Mode" value="2030" />
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
                "5. Generate launch campaign",
                "6. Measure visitors, signups, paid users, revenue",
                "7. Improve weak bottlenecks",
                "8. Kill losers",
                "9. Scale winners"
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
