export default function SuccessPage() {
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
          Your checkout was completed successfully. You can now continue using ProposalPilot.
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
