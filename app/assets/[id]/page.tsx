import { notFound } from "next/navigation";
import LeadCaptureForm from "@/app/assets/[id]/LeadCaptureForm";
import { ASSET_TYPE_LABELS, type AbosAsset, listFrom, normalizeAsset, stringFrom } from "@/lib/abos/assets";
import { isMissingTable } from "@/lib/abos/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AssetPageProps = {
  params: Promise<{ id: string }>;
};

async function loadAsset(id: string): Promise<AbosAsset | null> {
  const { data, error } = await supabase
    .from("abos_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(error.message);
  }

  return normalizeAsset(data);
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function GenericAsset({ asset }: { asset: AbosAsset }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold text-emerald-400">{ASSET_TYPE_LABELS[asset.type]}</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">{asset.title}</h1>
      <p className="mt-5 text-lg text-zinc-400">{asset.description}</p>
      <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-emerald-300">Content Preview</p>
          <p className="text-xs text-zinc-500">Copy-ready JSON</p>
        </div>
        <pre className="mt-5 max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
          {formatJson(asset.content)}
        </pre>
      </div>
    </div>
  );
}

function LandingPage({ asset }: { asset: AbosAsset }) {
  const content = asset.content;
  const headline = stringFrom(content.headline, asset.title);
  const subheadline = stringFrom(content.subheadline, asset.description);
  const cta = stringFrom(content.cta, "Join the beta");
  const faq = Array.isArray(content.faq) ? content.faq : [];

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="text-sm font-semibold text-emerald-400">Now Validating</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">{headline}</h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-400">{subheadline}</p>
        <LeadCaptureForm assetId={asset.id} cta={cta} />
      </section>

      <section className="border-y border-zinc-900 bg-zinc-950/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <ListBlock title="Pain Points" items={listFrom(content.pain_points)} />
          <ListBlock title="Benefits" items={listFrom(content.benefits)} />
          <ListBlock title="Features" items={listFrom(content.features)} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faq.length === 0 && <p className="text-zinc-500">Questions will be added as validation feedback arrives.</p>}
          {faq.map((item, index) => {
            const question = typeof item === "object" && item && "question" in item ? String(item.question || "") : "";
            const answer = typeof item === "object" && item && "answer" in item ? String(item.answer || "") : "";
            return (
              <div key={`${question}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <h3 className="font-semibold text-emerald-300">{question || "Question"}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{answer || "Answer pending."}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function PricingPage({ asset }: { asset: AbosAsset }) {
  const content = asset.content;
  const plans = Array.isArray(content.plans) ? content.plans : [];
  const guarantee = stringFrom(content.guarantee, "Cancel anytime if this does not fit your workflow.");
  const cta = stringFrom(content.cta, "Start now");

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold text-emerald-400">Pricing</p>
      <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">{asset.title}</h1>
      <p className="mt-5 max-w-3xl text-lg text-zinc-400">{asset.description}</p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {plans.map((plan, index) => {
          const planRecord = typeof plan === "object" && plan !== null ? plan as Record<string, unknown> : {};
          return (
            <div key={`${String(planRecord.name || "Plan")}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="text-2xl font-bold text-emerald-300">{stringFrom(planRecord.name, "Plan")}</h2>
              <p className="mt-4 text-4xl font-bold">${String(planRecord.price ?? "TBD")}</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                {listFrom(planRecord.features).map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              <a href="#checkout" className="mt-7 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black hover:bg-emerald-400">
                {cta}
              </a>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-950 bg-emerald-950/20 p-5 text-emerald-100">
        {guarantee}
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-emerald-300">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
        {items.length === 0 && <li>No items yet.</li>}
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const asset = await loadAsset(id);

  if (!asset) notFound();

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="font-semibold text-emerald-400">ABOS 2030</a>
          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
            {asset.status}
          </span>
        </div>
      </nav>
      {asset.type === "landing_page" ? <LandingPage asset={asset} /> : asset.type === "pricing_page" ? <PricingPage asset={asset} /> : <GenericAsset asset={asset} />}
    </main>
  );
}
