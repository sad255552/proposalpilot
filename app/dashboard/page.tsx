import { supabase } from "@/lib/supabase";
import ProposalActions from "@/components/ProposalActions";

type Proposal = {
  id: string;
  client_brief: string;
  service: string;
  proposal: string;
  created_at: string;
};

export default async function DashboardPage() {
  const { data: proposals, error } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <a href="/" className="text-sm text-emerald-400">
            ← Back
          </a>
          <h1 className="mt-8 text-4xl font-bold">Dashboard</h1>
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="/" className="text-sm text-emerald-400">
              ← Back to generator
            </a>

            <h1 className="mt-6 text-5xl font-bold tracking-tight">
              Saved Proposals
            </h1>

            <p className="mt-4 text-zinc-400">
              Review, copy, and export generated proposal drafts.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-center font-semibold text-black transition hover:bg-emerald-400"
          >
            New Proposal
          </a>
        </div>

        {!proposals || proposals.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No proposals saved yet.
          </div>
        ) : (
          <div className="grid gap-5">
            {proposals.map((proposal: Proposal) => (
              <div
                key={proposal.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              >
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-emerald-400">
                      {proposal.service}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {proposal.client_brief}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-600">
                      Saved: {new Date(proposal.created_at).toLocaleString()}
                    </p>
                  </div>

                  <ProposalActions
                    proposal={proposal.proposal}
                    filename={proposal.service
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")}
                  />
                </div>

                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black p-5 text-sm leading-7 text-zinc-300">
                  {proposal.proposal}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
