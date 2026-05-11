export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold text-emerald-400">
          ProposalPilot
        </p>

        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Write client-winning proposals in 60 seconds.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          ProposalPilot helps freelancers turn a messy client brief into a clear,
          persuasive proposal without wasting hours staring at a blank page.
        </p>

        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <label className="mb-2 block text-sm text-zinc-300">
            Client brief
          </label>

          <textarea
            placeholder="Client needs a landing page for a fitness coaching business..."
            className="min-h-40 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <label className="mb-2 mt-4 block text-sm text-zinc-300">
            Your service
          </label>

          <input
            placeholder="Web design, copywriting, automation..."
            className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-emerald-500"
          />

          <button className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black">
            Generate Proposal
          </button>
        </div>
      </section>
    </main>
  );
}
