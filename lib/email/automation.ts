// Email automation and sequences

import { sendWelcomeEmail, sendConsultationConfirmation, sendPaymentReceipt, sendInvoiceReminder } from "./sendgrid";
import { sendSlackNotification } from "@/lib/integrations/slack";

export interface AutomationTrigger {
  type:
    | "newsletter_signup"
    | "consultation_booked"
    | "payment_received"
    | "invoice_sent"
    | "project_started";
  data: Record<string, any>;
}

export async function triggerEmailAutomation(trigger: AutomationTrigger) {
  try {
    switch (trigger.type) {
      case "newsletter_signup":
        await handleNewsletterSignup(trigger.data as any);
        break;

      case "consultation_booked":
        await handleConsultationBooked(trigger.data as any);
        break;

      case "payment_received":
        await handlePaymentReceived(trigger.data as any);
        break;

      case "invoice_sent":
        await handleInvoiceSent(trigger.data as any);
        break;

      case "project_started":
        await handleProjectStarted(trigger.data as any);
        break;
    }
  } catch (error) {
    console.error("Automation error:", error);
    throw error;
  }
}

async function handleNewsletterSignup(data: {
  email: string;
  name: string;
}) {
  console.log("📧 Newsletter signup automation triggered");

  // Send welcome email immediately
  await sendWelcomeEmail(data.name, data.email);

  // Schedule follow-up emails
  scheduleFollowUp(data.email, "lead_nurture_1", 2); // 2 days
  scheduleFollowUp(data.email, "lead_nurture_2", 7); // 7 days
  scheduleFollowUp(data.email, "case_study", 14); // 14 days

  // Send Slack notification
  await sendSlackNotification({
    type: "lead_capture",
    title: "New Newsletter Subscriber",
    message: `${data.name} subscribed to the newsletter`,
    metadata: {
      Email: data.email,
      Name: data.name,
    },
  });
}

async function handleConsultationBooked(data: {
  email: string;
  name: string;
  date: string;
  serviceType: string;
}) {
  console.log("📅 Consultation booked automation triggered");

  // Send confirmation email
  await sendConsultationConfirmation(
    data.name,
    data.email,
    data.date,
    data.serviceType
  );

  // Schedule reminder emails
  scheduleFollowUp(data.email, "consultation_reminder_1d", 1); // 1 day before
  scheduleFollowUp(data.email, "consultation_reminder_1h", 0.04); // 1 hour before

  // Send Slack notification
  await sendSlackNotification({
    type: "consultation_booked",
    title: "Consultation Booked",
    message: `${data.name} booked a consultation for ${data.serviceType}`,
    metadata: {
      Email: data.email,
      Name: data.name,
      Service: data.serviceType,
      Date: data.date,
    },
  });
}

async function handlePaymentReceived(data: {
  email: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  serviceType: string;
}) {
  console.log("💰 Payment received automation triggered");

  // Send payment receipt
  await sendPaymentReceipt(
    data.name,
    data.email,
    data.invoiceNumber,
    data.amount,
    data.serviceType
  );

  // Schedule project kickoff email
  scheduleFollowUp(data.email, "project_kickoff", 1);

  // Send Slack notification
  await sendSlackNotification({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment of $${data.amount} received from ${data.name}`,
    metadata: {
      Email: data.email,
      Name: data.name,
      Amount: `$${data.amount}`,
      Invoice: data.invoiceNumber,
    },
  });
}

async function handleInvoiceSent(data: {
  email: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
}) {
  console.log("📄 Invoice sent automation triggered");

  // Schedule payment reminders
  const dueDateMs = new Date(data.dueDate).getTime();
  const now = Date.now();
  const daysUntilDue = Math.floor((dueDateMs - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDue > 3) {
    scheduleFollowUp(data.email, "payment_reminder_3d", daysUntilDue - 3);
  }
  scheduleFollowUp(data.email, "payment_reminder_1d", daysUntilDue - 1);
  scheduleFollowUp(data.email, "payment_reminder_overdue", daysUntilDue + 1);

  // Send Slack notification
  await sendSlackNotification({
    type: "consultation_booked",
    title: "Invoice Sent",
    message: `Invoice ${data.invoiceNumber} sent to ${data.name}`,
    metadata: {
      Email: data.email,
      Amount: `$${data.amount}`,
      DueDate: data.dueDate,
    },
  });
}

async function handleProjectStarted(data: {
  email: string;
  name: string;
  projectName: string;
  duration: string;
}) {
  console.log("🚀 Project started automation triggered");

  // Send project kickoff email
  // Schedule weekly check-in emails
  // Schedule mid-project status update
  // Schedule project completion survey

  // Send Slack notification
  await sendSlackNotification({
    type: "lead_capture",
    title: "Project Started",
    message: `Project "${data.projectName}" started with ${data.name}`,
    metadata: {
      Email: data.email,
      Project: data.projectName,
      Duration: data.duration,
    },
  });
}

function scheduleFollowUp(email: string, templateId: string, daysDelay: number) {
  // TODO: Implement scheduling with a job queue (Bull, Inngest, etc.)
  console.log(`⏱️ Scheduled ${templateId} for ${email} in ${daysDelay} days`);
}

// Email marketing metrics
export interface EmailMetrics {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

export async function getEmailMetrics(
  templateId: string
): Promise<EmailMetrics> {
  // TODO: Query SendGrid for metrics
  return {
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    bounced: 0,
    unsubscribed: 0,
  };
}

// A/B test email variants
export interface EmailVariant {
  id: string;
  subject: string;
  bodyHtml: string;
  weight: number;
}

export async function createEmailABTest(
  name: string,
  variants: EmailVariant[]
) {
  // TODO: Implement A/B testing for emails
  console.log(`Created email A/B test: ${name}`);
}
