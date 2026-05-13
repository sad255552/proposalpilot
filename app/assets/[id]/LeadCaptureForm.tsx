"use client";

import { useState } from "react";

export default function LeadCaptureForm({ assetId, cta }: { assetId: string; cta: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "failed">("idle");
  const [message, setMessage] = useState("");

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/abos/assets/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, email, source: "asset_page" })
      });
      const json = await response.json() as { warning?: string; error?: string };

      if (!response.ok) {
        setStatus("failed");
        setMessage(json.error || "Lead capture failed.");
        return;
      }

      setStatus("success");
      setEmail("");
      setMessage(json.warning || "You are on the list.");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Lead capture failed.");
    }
  }

  return (
    <form onSubmit={submitLead} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="min-h-12 flex-1 rounded-xl border border-emerald-900 bg-black px-4 text-white outline-none focus:border-emerald-400"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-12 rounded-xl bg-emerald-500 px-5 font-bold text-black hover:bg-emerald-400 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : cta}
      </button>
      {message && (
        <p className={`sm:basis-full text-sm ${status === "failed" ? "text-red-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
