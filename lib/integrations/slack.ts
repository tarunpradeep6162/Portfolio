// Slack Integration - Stub for build

export interface SlackNotificationParams {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function sendSlackNotification(
  params: SlackNotificationParams
): Promise<void> {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("Slack webhook not configured");
      return;
    }

    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${params.type.toUpperCase()}: ${params.title}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: params.message,
          },
        },
      ],
    };

    if (params.metadata && Object.keys(params.metadata).length > 0) {
      const metadataText = Object.entries(params.metadata)
        .map(([key, value]) => `• *${key}:* ${value}`)
        .join("\n");

      payload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: metadataText,
        },
      });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("✅ Slack notification sent:", params.title);
  } catch (error) {
    console.error("❌ Failed to send Slack notification:", error);
  }
}
