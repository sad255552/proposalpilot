"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("shfuertes79@gmail.com");
  const [password, setPassword] = useState("test123456");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      alert("Enter email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabaseBrowser.auth.signUp({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. You can login now.");
    }

    setLoading(false);
  }

  async function login() {
    if (!email.trim() || !password.trim()) {
      alert("Enter email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/";
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-20">
        <a href="/" className="text-sm text-emerald-400">
          ← Back
        </a>

        <h1 className="mt-8 text-5xl font-bold tracking-tight">
          Login to ProposalPilot
        </h1>

        <p className="mt-4 text-zinc-400">
          Use email and password to access your proposals and Pro plan.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <label className="mb-2 block text-sm text-zinc-300">
            Email
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <label className="mb-2 mt-4 block text-sm text-zinc-300">
            Password
          </label>

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Minimum 6 characters"
            className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <button
            onClick={login}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <button
            onClick={signUp}
            disabled={loading}
            className="mt-3 w-full rounded-xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
          >
            Create account
          </button>

          {message && (
            <p className="mt-4 rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
