"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function PricingPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabaseBrowser.auth.getUser();

      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email || "");
      }
    }

    loadUser();
  }, []);

  function startCheckout() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    window.location.href = `/api/checkout?user_id=${encodeURIComponent(userId)}`;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <a href="/" className="text-sm text-emerald-400">
          ← Back to generator
        </a>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-emerald-400">
            ProposalPilot Pricing
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">
            Start winning more clients.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Generate better proposals faster, save your drafts, and reuse your best work.
          </p>

          <p className="mt-4 text-sm text-zinc-500">
            {email ? `Logged in as ${email}` : "Login required before checkout"}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-emerald-900 bg-zinc-950 p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-sm text-emerald-400">Pro Plan</p>
            <h2 className="mt-2 text-5xl font-black">$19</h2>
            <p className="mt-2 text-zinc-400">per month</p>
          </div>

          <ul className="space-y-3 text-zinc-300">
            <li className="rounded-xl bg-black p-3">Unlimited AI proposal drafts</li>
            <li className="rounded-xl bg-black p-3">Saved proposal history</li>
            <li className="rounded-xl bg-black p-3">Copy and export TXT</li>
            <li className="rounded-xl bg-black p-3">Reusable proposal workflow</li>
            <li className="rounded-xl bg-black p-3">Best for freelancers and small agencies</li>
          </ul>

          <button
            type="button"
            onClick={startCheckout}
            className="mt-8 block w-full rounded-xl bg-emerald-500 px-5 py-4 text-center font-semibold text-black transition hover:bg-emerald-400"
          >
            {userId ? "Upgrade to Pro" : "Login to upgrade"}
          </button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Secure checkout powered by Stripe.
          </p>
        </div>
      </section>
    </main>
  );
}
