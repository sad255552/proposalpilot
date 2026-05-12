"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Usage = {
  user_id: string;
  generation_count: number;
  is_pro: boolean;
  email?: string;
  created_at?: string;
  updated_at?: string;
};

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    const { data } = await supabaseBrowser.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setEmail(data.user.email || "");

    const res = await fetch("/api/account/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: data.user.id
      })
    });

    const json = await res.json();

    if (res.ok) {
      setUsage(json.usage);
    } else {
      alert(json.error || "Failed to load account.");
    }

    setLoading(false);
  }

  async function openBillingPortal() {
    const { data } = await supabaseBrowser.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: data.user.id,
        email: data.user.email
      })
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Failed to open billing portal.");
      return;
    }

    window.location.href = json.url;
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <a href="/" className="text-sm text-emerald-400">
          ← Back to generator
        </a>

        <h1 className="mt-8 text-5xl font-bold tracking-tight">
          Account & Billing
        </h1>

        <p className="mt-4 text-zinc-400">
          Manage your ProposalPilot account, plan, and usage.
        </p>

        {loading ? (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
            Loading account...
          </div>
        ) : (
          <div className="mt-10 grid gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm text-zinc-500">Email</p>
              <p className="mt-2 text-xl font-semibold">{email}</p>
            </div>

            <div className="rounded-2xl border border-emerald-900 bg-zinc-950 p-6">
              <p className="text-sm text-emerald-400">Plan</p>

              <h2 className="mt-2 text-3xl font-bold">
                {usage?.is_pro ? "Pro Plan" : "Free Plan"}
              </h2>

              <p className="mt-3 text-zinc-400">
                {usage?.is_pro
                  ? "Unlimited proposal generations are active."
                  : "Free users can generate 3 proposals before upgrading."}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm text-zinc-500">Usage</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Generated"
                  value={String(usage?.generation_count ?? 0)}
                />
                <Metric
                  label="Free limit"
                  value="3"
                />
                <Metric
                  label="Status"
                  value={usage?.is_pro ? "Unlimited" : "Limited"}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/pricing"
                className="rounded-xl bg-emerald-500 px-5 py-4 text-center font-semibold text-black transition hover:bg-emerald-400"
              >
                {usage?.is_pro ? "View pricing" : "Upgrade to Pro"}
              </a>

              {usage?.is_pro && (
                <button
                  onClick={openBillingPortal}
                  className="rounded-xl border border-emerald-700 px-5 py-4 font-semibold text-emerald-300 transition hover:bg-emerald-950"
                >
                  Manage Subscription
                </button>
              )}

              {usage?.is_pro && (
                <button
                  onClick={openBillingPortal}
                  className="rounded-xl border border-emerald-700 px-5 py-4 font-semibold text-emerald-300 transition hover:bg-emerald-950"
                >
                  Manage Subscription
                </button>
              )}

              <a
                href="/dashboard"
                className="rounded-xl border border-zinc-700 px-5 py-4 text-center font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                Open dashboard
              </a>

              <button
                onClick={logout}
                className="rounded-xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
