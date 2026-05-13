import { NextResponse } from "next/server";
import { isMissingTable } from "@/lib/abos/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { assetId?: unknown; email?: unknown; source?: unknown };
  const assetId = getString(body.assetId);
  const email = getString(body.email).toLowerCase();
  const source = getString(body.source) || "asset_page";

  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
  }

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const { data: lead, error } = await supabase
    .from("abos_leads")
    .insert({ asset_id: assetId, email, source })
    .select()
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ warning: "abos_leads table is missing; lead was accepted but not stored." });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead });
}
