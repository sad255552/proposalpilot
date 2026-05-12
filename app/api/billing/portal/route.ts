import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || "";
    const email = body.email || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId." },
        { status: 400 }
      );
    }

    const { data: usage, error: usageError } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (usageError) {
      return NextResponse.json(
        { error: usageError.message },
        { status: 500 }
      );
    }

    let customerId = usage?.stripe_customer_id;

    if (!customerId && email) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;

        await supabase
          .from("usage_limits")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", userId);
      }
    }

    if (!customerId && email) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });

      customerId = customer.id;

      await supabase
        .from("usage_limits")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Could not create or find Stripe customer." },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://proposalpilot-kohl.vercel.app";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/account`
    });

    return NextResponse.json({
      url: portalSession.url
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to open billing portal." },
      { status: 500 }
    );
  }
}
