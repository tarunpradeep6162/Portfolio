// Real Stripe API integration

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function createPaymentIntent(
  amount: number,
  email: string,
  description: string,
  metadata: Record<string, string> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description,
      receipt_email: email,
      metadata: {
        email,
        ...metadata,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    throw error;
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
) {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  } catch (error) {
    console.error("Error confirming payment intent:", error);
    throw error;
  }
}

export async function createCustomer(
  email: string,
  name: string,
  metadata: Record<string, string> = {}
) {
  try {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

export async function createInvoice(
  customerId: string,
  items: Array<{
    description: string;
    amount: number;
  }>,
  dueDate?: Date
) {
  try {
    const invoice = await stripe.invoices.create({
      customer: customerId,
      due_date: dueDate ? Math.floor(dueDate.getTime() / 1000) : undefined,
    });

    // Add line items
    for (const item of items) {
      await stripe.invoiceItems.create({
        invoice: invoice.id,
        customer: customerId,
        description: item.description,
        amount: Math.round(item.amount * 100),
        currency: "usd",
      });
    }

    // Finalize and send
    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    return invoice;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export async function listInvoices(customerId: string) {
  try {
    return await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
  } catch (error) {
    console.error("Error listing invoices:", error);
    throw error;
  }
}

export async function refundCharge(chargeId: string, amount?: number) {
  try {
    return await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  } catch (error) {
    console.error("Error refunding charge:", error);
    throw error;
  }
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    throw error;
  }
}

export async function handlePaymentSucceeded(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    return {
      status: "succeeded",
      amount: paymentIntent.amount / 100,
      email: paymentIntent.receipt_email,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
    throw error;
  }
}

export async function handlePaymentFailed(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    return {
      status: "failed",
      error: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
}
