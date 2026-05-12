"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [status, setStatus] = useState("Activating Pro access...");

  useEffect(() => {
    async function activatePro() {
      try {
        const userId = localStorage.getItem("proposalpilot_user_id");

        if (!userId) {
          setStatus("Payment completed. Open the generator to continue.");
          return;
        }

        const res = await fetch("/api/usage/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId })
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus(data.error || "Payment completed, but Pro activation failed.");
          return;
        }

        setStatus("Pro access activated successfully.");
      } catch (error) {
        console.error(error);
        setStatus("Payment completed, but Pro activation failed.");
      }
    }

    activatePro();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20 text-center">
        <p className="text-sm font-semibold text-emerald-400">
          Payment successful
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Welcome to ProposalPilot Pro.
        </h1>

        <p className="mt-6 text-lg text-zinc-400">
          {status}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-black transition hover:bg-emerald-400"
          >
            Generate proposal
          </a>

          <a
            href="/dashboard"
            className="rounded-xl border border-zinc-700 px-6 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            Open dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
