"use client";

export default function ProposalActions({
  proposal,
  filename
}: {
  proposal: string;
  filename: string;
}) {
  async function copyProposal() {
    await navigator.clipboard.writeText(proposal);
    alert("Proposal copied.");
  }

  function exportTxt() {
    const blob = new Blob([proposal], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${filename || "proposal"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={copyProposal}
        className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
      >
        Copy
      </button>

      <button
        onClick={exportTxt}
        className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
      >
        Export TXT
      </button>
    </div>
  );
}
