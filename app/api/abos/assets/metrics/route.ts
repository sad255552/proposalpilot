import { NextResponse } from "next/server";
import { isMissingTable } from "@/lib/abos/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type MetricKey = "visitors" | "leads" | "signups" | "paid" | "revenue";

const METRIC_KEYS: MetricKey[] = ["visitors", "leads", "signups", "paid", "revenue"];

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function numberFrom(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const assetId = getString(body.assetId);

  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
  }

  const metricValues = METRIC_KEYS.reduce<Record<MetricKey, number>>((acc, key) => {
    acc[key] = numberFrom(body[key]);
    return acc;
  }, { visitors: 0, leads: 0, signups: 0, paid: 0, revenue: 0 });

  const payload = {
    asset_id: assetId,
    ...metricValues,
    updated_at: new Date().toISOString()
  };

  const { data: metric, error } = await supabase
    .from("abos_asset_metrics")
    .upsert(payload, { onConflict: "asset_id" })
    .select()
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ warning: "abos_asset_metrics table is missing; metrics were not stored." });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metric });
}
