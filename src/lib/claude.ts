import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

export interface CategoryResult {
  category:
    | "promotional"
    | "newsletter"
    | "transactional"
    | "social"
    | "updates"
    | "financial"
    | "other";
  confidence: number;
  reasoning: string;
}

export async function categorizeEmail(
  senderEmail: string,
  senderName: string,
  subjectSample: string
): Promise<CategoryResult> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Categorize this email sender into exactly one category.

Sender: ${senderName} <${senderEmail}>
Subject sample: ${subjectSample}

Categories:
- promotional: Sales, deals, discounts, marketing campaigns
- newsletter: Regular content updates, articles, digests
- transactional: Receipts, order confirmations, account notifications
- social: Social network notifications, friend activity
- updates: Product/service updates, changelogs, announcements
- financial: Bank statements, investment updates, payment notifications
- other: Doesn't fit any category above

Respond with JSON only: {"category": "...", "confidence": 0.0-1.0, "reasoning": "one sentence"}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  try {
    return JSON.parse(text) as CategoryResult;
  } catch {
    return { category: "other", confidence: 0.5, reasoning: "Parse error" };
  }
}

export async function generateInboxSummary(data: {
  totalSubs: number;
  newSubs: number;
  unsubscribed: number;
  topDomains: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Write a brief, insightful 2-3 sentence summary of this user's inbox subscription health for the past week. Be conversational and actionable.

Stats:
- Total subscriptions tracked: ${data.totalSubs}
- New subscriptions detected this week: ${data.newSubs}
- Successfully unsubscribed this week: ${data.unsubscribed}
- Top sending domains: ${Object.entries(data.topDomains)
          .slice(0, 5)
          .map(([d, c]) => `${d} (${c})`)
          .join(", ")}
- Category breakdown: ${Object.entries(data.categoryBreakdown)
          .map(([cat, count]) => `${cat}: ${count}`)
          .join(", ")}

Keep the tone helpful and concise. Focus on actionable insights.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function draftUnsubscribeEmail(
  senderEmail: string,
  senderName: string,
  userEmail: string
): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Draft a brief, polite email to unsubscribe from "${senderName}" (${senderEmail}).

The sender should be addressed appropriately. The email should be from ${userEmail}.
Keep it under 50 words. Professional and courteous tone.

Return only the email body text, no subject line.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}
