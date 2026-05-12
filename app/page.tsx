"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [brief, setBrief] = useState("");
  const [service, setService] = useState("");
  const [proposal, setProposal] = useState("");
  const [title, setTitle] = useState("Waiting for generation");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
    track("page_view");
  }, []);

  async function loadUser() {
    const { data } = await supabaseBrowser.auth.getUser();
    setUser(data.user || null);
  }

  async function track(event: string) {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event })
      });
    } catch {}
  }

  async function generateProposal() {
    if (!brief.trim() || !service.trim()) {
      alert("Add client brief and your service.");
      return;
    }

    setLoading(true);
    setTitle("Generating proposal...");
    setProposal("");

    await track("generate_clicked");

    const { data } = await supabaseBrowser.auth.getUser();

    const res = await fetch("/api/generate-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brief,
        service,
        userId: data.user?.id || ""
      })
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Failed to generate proposal.");
      setTitle("Waiting for generation");
      setLoading(false);
      return;
    }

    setProposal(json.proposal);
    setTitle("AI draft ready to send");
    setLoading(false);
  }

  async function saveProposal() {
    if (!proposal.trim()) {
      alert("Generate a proposal first.");
      return;
    }

    const { data } = await supabaseBrowser.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);
    await track("save_clicked");

    const res = await fetch("/api/save-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.user.id,
        email: data.user.email,
        brief,
        service,
        proposal
      })
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Failed to save proposal.");
      setSaving(false);
      return;
    }

    alert("Proposal saved.");
    setSaving(false);
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-400">ProposalPilot</p>
            <p className="mt-2 text-sm text-zinc-500">
              {user ? "Logged in" : "Turn client briefs into polished proposals"}
            </p>
            {user?.email && <p className="text-xs text-zinc-500">{user.email}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <a href="/pricing" className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-900">
              Pricing
            </a>
            <a href="/dashboard" className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-900">
              Dashboard
            </a>
            <a href="/account" className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-900">
              Account
            </a>
            {user ? (
              <button onClick={logout} className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-900">
                Logout
              </button>
            ) : (
              <a href="/login" className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
                Login
              </a>
            )}
          </div>
        </nav>

        <section className="grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300">
              For freelancers, agencies, and solo service providers
            </div>

            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
              Write client-winning proposals in 60 seconds.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              ProposalPilot turns messy client briefs into clear, persuasive proposals with scope,
              timeline, pricing logic, and next steps — without staring at a blank page.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Feature title="No blank page" />
              <Feature title="Clear structure" />
              <Feature title="Faster replies" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#generator" className="rounded-xl bg-emerald-500 px-6 py-4 text-center font-semibold text-black hover:bg-emerald-400">
                Generate free proposal
              </a>
              <a href="/pricing" className="rounded-xl border border-zinc-800 px-6 py-4 text-center font-semibold hover:bg-zinc-900">
                Upgrade to Pro
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <p className="text-sm text-emerald-400">Example output</p>
            <h2 className="mt-3 text-2xl font-bold">Proposal for Your Project</h2>
            <div className="mt-5 space-y-3 text-sm text-zinc-400">
              <p>Hi there, I can help create a high-converting landing page for your coaching business.</p>
              <p><span className="text-white">Scope:</span> structure, copywriting, design, CTA sections, and delivery-ready final page.</p>
              <p><span className="text-white">Timeline:</span> first draft in 3–5 business days.</p>
              <p><span className="text-white">Next step:</span> confirm goals and target audience.</p>
            </div>
          </div>
        </section>

        <section id="generator" className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="grid gap-5">
            <label className="text-sm text-zinc-300">
              Client brief
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Client needs a landing page for a fitness coaching business..."
                className="mt-3 min-h-36 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
              />
            </label>

            <label className="text-sm text-zinc-300">
              Your service
              <input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Web design, copywriting, automation..."
                className="mt-3 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
              />
            </label>

            <button
              onClick={generateProposal}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Proposal"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-950 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-400">Generated Proposal</p>
              <h2 className="mt-2 text-2xl font-bold">{title}</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(proposal)}
                className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-900"
              >
                Copy
              </button>
              <button
                onClick={saveProposal}
                disabled={saving}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <pre className="mt-5 min-h-44 whitespace-pre-wrap rounded-xl bg-black p-5 text-sm leading-7 text-zinc-100">
            {proposal || "Your AI-generated proposal will appear here."}
          </pre>
        </section>
      </section>
    </main>
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
      {title}
    </div>
  );
}
