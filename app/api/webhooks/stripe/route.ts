import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, handlePaymentSucceeded, handlePaymentFailed } from "@/lib/payments/stripe-api";
import { sendSlackNotification } from "@/lib/integrations/slack";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const event = verifyWebhookSignature(body, signature);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log("✅ Payment succeeded:", paymentIntent.id);

        // Handle payment success
        const result = await handlePaymentSucceeded(paymentIntent.id);

        // Send Slack notification
        await sendSlackNotification({
          type: "payment_received",
          title: "Payment Received",
          message: `Payment of $${result.amount} received from ${result.email}`,
          metadata: {
            Email: result.email || "N/A",
            Amount: `$${result.amount}`,
            Intent: paymentIntent.id,
          },
        });

        // TODO: Save to database, send confirmation email, update project status
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.log("❌ Payment failed:", paymentIntent.id);

        const result = await handlePaymentFailed(paymentIntent.id);

        // Send Slack notification
        await sendSlackNotification({
          type: "payment_received",
          title: "Payment Failed",
          message: `Payment failed: ${result.error}`,
          metadata: {
            Error: result.error || "Unknown error",
            Intent: paymentIntent.id,
          },
        });

        // TODO: Notify customer, retry logic
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        console.log("✅ Invoice paid:", invoice.id);

        // TODO: Update invoice status in database
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log("❌ Invoice payment failed:", invoice.id);

        // TODO: Send payment reminder
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        console.log("📝 Subscription updated:", subscription.id);

        // TODO: Handle subscription changes
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
}
