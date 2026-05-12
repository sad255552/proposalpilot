import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId || "";
      const customerId = String(session.customer || "");

      if (userId) {
        await supabase
          .from("usage_limits")
          .upsert(
            {
              user_id: userId,
              is_pro: true,
              stripe_customer_id: customerId
            },
            { onConflict: "user_id" }
          );
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer || "");

      const shouldStayPro =
        subscription.status === "active" ||
        subscription.status === "trialing";

      if (customerId) {
        await supabase
          .from("usage_limits")
          .update({ is_pro: shouldStayPro })
          .eq("stripe_customer_id", customerId);
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "invoice.payment_failed"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer || "");

      if (customerId) {
        await supabase
          .from("usage_limits")
          .update({ is_pro: false })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Webhook handler failed." },
      { status: 500 }
    );
  }
}
