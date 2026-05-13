import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SupabaseMaybeError = {
  code?: string;
  message?: string;
  details?: string;
};

function isMissingTable(error: SupabaseMaybeError | null | undefined) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("42p01") || message.includes("pgrst205") || message.includes("could not find the table") || message.includes("does not exist");
}

export async function GET() {
  const { data: assets, error } = await supabase
    .from("abos_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ assets: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: assets || [] });
}
