import { NextResponse } from "next/server";
import { isMissingColumn, isMissingTable } from "@/lib/abos/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({})) as { assetId?: unknown };
  const assetId = getString(body.assetId);

  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
  }

  const publicUrl = `/assets/${assetId}`;
  const { data: asset, error } = await supabase
    .from("abos_assets")
    .update({ status: "published", public_url: publicUrl })
    .eq("id", assetId)
    .select()
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "abos_assets table is missing." }, { status: 500 });
    }

    if (isMissingColumn(error)) {
      return NextResponse.json({ error: "abos_assets.status or abos_assets.public_url column is missing." }, { status: 500 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asset });
}
