// SMS marketing integration with Twilio

import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(phoneNumber: string, message: string) {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log("✅ SMS sent:", sms.sid);
    return sms;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    throw error;
  }
}

export async function sendBulkSMS(
  recipients: Array<{ phone: string; name: string }>,
  message: string
) {
  try {
    const results = await Promise.all(
      recipients.map((recipient) =>
        sendSMS(recipient.phone, message).catch((err) => {
          console.error(`Failed to send to ${recipient.phone}:`, err);
          return null;
        })
      )
    );

    const successful = results.filter((r) => r !== null).length;
    console.log(
      `✅ Sent ${successful}/${recipients.length} SMS messages`
    );

    return results;
  } catch (error) {
    console.error("❌ Bulk SMS error:", error);
    throw error;
  }
}

export async function sendConsultationReminder(
  phoneNumber: string,
  name: string,
  consultationDate: string
) {
  const message = `Hi ${name}, reminder: your consultation is on ${consultationDate}. Reply CONFIRM to confirm or call us for reschedule.`;
  return sendSMS(phoneNumber, message);
}

export async function sendPaymentReminder(
  phoneNumber: string,
  invoiceNumber: string,
  amount: number
) {
  const message = `Invoice #${invoiceNumber} for $${amount} is due. Pay now: [link]`;
  return sendSMS(phoneNumber, message);
}

export async function sendMarketingMessage(
  phoneNumber: string,
  message: string,
  campaignId?: string
) {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      tags: campaignId ? [campaignId] : [],
    });

    return sms;
  } catch (error) {
    console.error("❌ Failed to send marketing SMS:", error);
    throw error;
  }
}

// SMS opt-in management
export async function handleSMSOptIn(phoneNumber: string) {
  // TODO: Save to database as opted-in
  console.log(`📱 SMS opt-in for ${phoneNumber}`);
}

export async function handleSMSOptOut(phoneNumber: string) {
  // TODO: Save to database as opted-out
  console.log(`📱 SMS opt-out for ${phoneNumber}`);
}

// SMS analytics
export interface SMSMetrics {
  sent: number;
  delivered: number;
  failed: number;
  clickRate: number;
  conversionRate: number;
}

export async function getSMSMetrics(campaignId: string): Promise<SMSMetrics> {
  // TODO: Query Twilio for campaign metrics
  return {
    sent: 0,
    delivered: 0,
    failed: 0,
    clickRate: 0,
    conversionRate: 0,
  };
}
