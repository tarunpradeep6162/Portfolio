// Integrations Index - Conditionally load based on available packages

export { stripe } from "./stripe";
export { openai } from "./openai";
export { sendSlackNotification } from "./slack";

// Export a configuration checker to determine which services are available
export const availableServices = {
  stripe: !!process.env.STRIPE_SECRET_KEY,
  sendgrid: !!process.env.SENDGRID_API_KEY,
  twilio: !!process.env.TWILIO_ACCOUNT_SID,
  openai: !!process.env.OPENAI_API_KEY,
  slack: !!process.env.SLACK_WEBHOOK_URL,
  nextauth: !!process.env.NEXTAUTH_SECRET,
  database: !!process.env.DATABASE_URL,
};

export const isProduction = process.env.NODE_ENV === "production";
