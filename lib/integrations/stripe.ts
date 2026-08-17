// Stripe API Integration - Stub for build

class StripeStub {
  private apiVersion: string;

  constructor(secretKey: string, options?: any) {
    this.apiVersion = options?.apiVersion || "2024-06-20";
    if (!secretKey) {
      console.warn("Stripe not configured. Using stub implementation.");
    }
  }

  paymentIntents = {
    create: async (params: any) => ({
      id: "pi_stub_123",
      amount: params.amount,
      currency: params.currency || "usd",
      status: "requires_payment_method",
      client_secret: "pi_stub_123_secret",
      receipt_email: params.receipt_email,
      metadata: params.metadata || {},
    }),
    retrieve: async (intentId: string) => ({
      id: intentId,
      status: "succeeded",
      amount: 10000,
      currency: "usd",
      receipt_email: "customer@example.com",
      metadata: {},
      last_payment_error: { message: "No error" },
    }),
    confirm: async (intentId: string, params: any) => ({
      id: intentId,
      status: "succeeded",
      amount: 10000,
    }),
  };

  customers = {
    create: async (params: any) => ({
      id: "cus_stub_123",
      email: params.email,
      name: params.name,
    }),
  };

  invoices = {
    create: async (params: any) => ({
      id: "in_stub_123",
      customer: params.customer,
      amount_due: params.amount_due || 0,
      status: "draft",
    }),
    list: async (params: any) => ({
      data: [],
    }),
    finalizeInvoice: async (invoiceId: string) => ({
      id: invoiceId,
      status: "open",
    }),
    sendInvoice: async (invoiceId: string) => ({
      id: invoiceId,
      status: "sent",
    }),
  };

  invoiceItems = {
    create: async (params: any) => ({
      id: "ii_stub_123",
      invoice: params.invoice,
      customer: params.customer,
      description: params.description,
      amount: params.amount,
      currency: params.currency || "usd",
    }),
  };

  refunds = {
    create: async (params: any) => ({
      id: "re_stub_123",
      charge: params.charge,
      amount: params.amount,
      status: "succeeded",
    }),
  };

  webhooks = {
    constructEvent: (body: any, sig: string, secret: string) => ({
      type: "charge.succeeded",
      data: { object: { id: "ch_stub_123" } },
    }),
  };

  webhookEndpoints = {
    createSignedRequest: (body: any, secret: string) => ({
      id: "we_stub_123",
      url: "https://example.com/webhook",
      enabled_events: ["payment_intent.succeeded"],
    }),
  };
}

export function createStripeClient(secretKey?: string) {
  return new StripeStub(secretKey || process.env.STRIPE_SECRET_KEY || "");
}

export const stripe = createStripeClient();

// Stripe namespace for type checking
export namespace Stripe {
  export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    receipt_email?: string;
    metadata?: Record<string, any>;
    last_payment_error?: any;
  }
  export interface Event {
    type: string;
    data: { object: any };
  }
}
