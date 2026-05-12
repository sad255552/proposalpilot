import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET in .env.local." },
      { status: 500 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId =
        session.metadata?.user_id ||
        session.client_reference_id;

      if (!userId) {
        return NextResponse.json(
          { error: "Missing user_id in Stripe session metadata." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("usage_limits")
        .upsert(
          {
            user_id: userId,
            is_pro: true,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "user_id"
          }
        );

      if (error) {
        console.error("Supabase upgrade error:", error.message);

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      console.log(`Pro access activated for user: ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error.message);

    return NextResponse.json(
      { error: error.message || "Webhook handler failed." },
      { status: 500 }
    );
  }
}
