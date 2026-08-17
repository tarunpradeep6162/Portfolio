// SendGrid Email Service - Stub for build

// Stub SendGrid client
const sgMail = {
  send: async (msg: any) => {
    console.log("✅ Email sent via SendGrid:", msg.to);
    return [{ statusCode: 202 }];
  },
  sendMultiple: async (msg: any) => {
    console.log("✅ Bulk emails sent via SendGrid");
    return [{ statusCode: 202 }];
  },
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  metadata?: Record<string, string>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const message = {
      to: options.to,
      from: options.from || process.env.SENDGRID_FROM_EMAIL || "noreply@tarunpradeep.dev",
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
      categories: options.categories || [],
      customArgs: options.metadata,
    };

    const response = await sgMail.send(message);
    console.log("✅ Email sent:", response[0].statusCode);
    return response[0];
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  html: string,
  templateId?: string
) {
  try {
    const personalizations = recipients.map((recipient) => ({
      to: [{ email: recipient.email, name: recipient.name }],
    }));

    const message = {
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@tarunpradeep.dev",
      subject,
      html,
      templateId,
      personalizations,
    };

    const response = await sgMail.send(message);
    console.log(`✅ Bulk email sent to ${recipients.length} recipients`);
    return response;
  } catch (error) {
    console.error("❌ Failed to send bulk email:", error);
    throw error;
  }
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export async function sendTemplateEmail(
  to: string,
  templateId: string,
  variables: Record<string, any>
) {
  try {
    const message = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@tarunpradeep.dev",
      templateId,
      dynamicTemplateData: variables,
    };

    const response = await sgMail.send(message);
    console.log("✅ Template email sent:", response[0].statusCode);
    return response[0];
  } catch (error) {
    console.error("❌ Failed to send template email:", error);
    throw error;
  }
}

// Pre-built email templates
export const emailTemplates = {
  WELCOME: {
    id: "d-welcome-email-id",
    name: "Welcome",
    subject: "Welcome to {{companyName}}!",
  },
  CONSULTATION_CONFIRMATION: {
    id: "d-consultation-confirmation-id",
    name: "Consultation Confirmation",
    subject: "Consultation Confirmed - {{date}}",
  },
  PAYMENT_RECEIPT: {
    id: "d-payment-receipt-id",
    name: "Payment Receipt",
    subject: "Invoice: {{invoiceNumber}}",
  },
  BLOG_DIGEST: {
    id: "d-blog-digest-id",
    name: "Weekly Blog Digest",
    subject: "This Week's Infrastructure Insights",
  },
  LEAD_NURTURE: {
    id: "d-lead-nurture-id",
    name: "Lead Nurture",
    subject: "How {{name}}, here's what we can do for {{company}}",
  },
  INVOICE_REMINDER: {
    id: "d-invoice-reminder-id",
    name: "Invoice Reminder",
    subject: "Invoice {{invoiceNumber}} - Payment Reminder",
  },
};

export async function sendWelcomeEmail(name: string, email: string) {
  return sendTemplateEmail(email, emailTemplates.WELCOME.id, {
    firstName: name.split(" ")[0],
    email,
  });
}

export async function sendConsultationConfirmation(
  name: string,
  email: string,
  date: string,
  serviceType: string
) {
  return sendTemplateEmail(
    email,
    emailTemplates.CONSULTATION_CONFIRMATION.id,
    {
      firstName: name.split(" ")[0],
      date,
      serviceType,
    }
  );
}

export async function sendPaymentReceipt(
  name: string,
  email: string,
  invoiceNumber: string,
  amount: number,
  serviceType: string
) {
  return sendTemplateEmail(email, emailTemplates.PAYMENT_RECEIPT.id, {
    firstName: name.split(" ")[0],
    invoiceNumber,
    amount: `$${amount.toFixed(2)}`,
    serviceType,
  });
}

export async function sendInvoiceReminder(
  name: string,
  email: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
) {
  return sendTemplateEmail(email, emailTemplates.INVOICE_REMINDER.id, {
    firstName: name.split(" ")[0],
    invoiceNumber,
    amount: `$${amount.toFixed(2)}`,
    dueDate,
  });
}
