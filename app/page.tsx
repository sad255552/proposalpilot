"use client";

import { useEffect, useState } from "react";

type Usage = {
  generationCount: number;
  isPro: boolean;
  freeLimit: number;
  remaining: number | null;
  canGenerate: boolean;
};

export default function Home() {
  const [brief, setBrief] = useState("");
  const [service, setService] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem("proposalpilot_user_id");

    if (!storedUserId) {
      storedUserId = generateUserId();
      localStorage.setItem("proposalpilot_user_id", storedUserId);
    }

    setUserId(storedUserId);
    checkUsage(storedUserId);
  }, []);

  async function checkUsage(id = userId) {
    if (!id) return;

    const res = await fetch("/api/usage/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: id
      })
    });

    const data = await res.json();

    if (res.ok) {
      setUsage(data);
    }
  }

  async function incrementUsage(id = userId) {
    if (!id) return;

    await fetch("/api/usage/increment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: id
      })
    });

    await checkUsage(id);
  }

  async function generateProposal() {
    if (!brief.trim() || !service.trim()) {
      alert("Add the client brief and your service first.");
      return;
    }

    await checkUsage();

    if (usage && !usage.canGenerate) {
      alert("Free limit reached. Upgrade to Pro for unlimited proposals.");
      window.location.href = "/pricing";
      return;
    }

    setLoading(true);
    setProposal("");

    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          brief,
          service
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Generation failed.");
        return;
      }

      setProposal(data.proposal);
      await incrementUsage();
    } catch (error) {
      console.error(error);
      alert("Generation failed. Check server logs.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProposal() {
    if (!proposal.trim()) {
      alert("Generate a proposal first.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/save-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientBrief: brief,
          service,
          proposal
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Save failed.");
        return;
      }

      alert("Proposal saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Save failed. Check server logs.");
    } finally {
      setSaving(false);
    }
  }

  async function copyProposal() {
    if (!proposal) {
      alert("Generate a proposal first.");
      return;
    }

    await navigator.clipboard.writeText(proposal);
    alert("Proposal copied.");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              ProposalPilot
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              {usage
                ? usage.isPro
                  ? "Pro plan active · unlimited proposals"
                  : `${usage.remaining} free generations remaining`
                : "Checking usage..."}
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/pricing"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              Pricing
            </a>

            <a
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              Dashboard
            </a>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Write client-winning proposals in 60 seconds.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          ProposalPilot helps freelancers turn a messy client brief into a clear,
          persuasive proposal without wasting hours staring at a blank page.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <MiniCard text="No blank page" />
          <MiniCard text="Clear structure" />
          <MiniCard text="Faster replies" />
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <label className="mb-2 block text-sm text-zinc-300">
            Client brief
          </label>

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Client needs a landing page for a fitness coaching business..."
            className="min-h-40 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <label className="mb-2 mt-4 block text-sm text-zinc-300">
            Your service
          </label>

          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Web design, copywriting, automation..."
            className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={generateProposal}
            disabled={loading || !!usage?.canGenerate === false}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Generating with AI..."
              : usage && !usage.canGenerate
                ? "Upgrade to Pro to continue"
                : "Generate Proposal"}
          </button>

          {usage && !usage.canGenerate && (
            <a
              href="/pricing"
              className="mt-3 block w-full rounded-xl border border-emerald-700 px-5 py-4 text-center font-semibold text-emerald-300 transition hover:bg-emerald-950"
            >
              Upgrade now
            </a>
          )}
        </div>

        <section className="mt-8 rounded-2xl border border-emerald-900 bg-zinc-950 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-400">Generated Proposal</p>
              <h2 className="mt-1 text-2xl font-bold">
                {proposal ? "AI draft ready to send" : "Waiting for generation"}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyProposal}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                Copy
              </button>

              <button
                type="button"
                onClick={saveProposal}
                disabled={saving}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <pre className="min-h-40 whitespace-pre-wrap rounded-xl bg-black p-5 text-sm leading-7 text-zinc-200">
            {loading
              ? "Generating a custom proposal..."
              : proposal || "Your AI-generated proposal will appear here."}
          </pre>
        </section>
      </section>
    </main>
  );
}

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function MiniCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
      {text}
    </div>
  );
}
