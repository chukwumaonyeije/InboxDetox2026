import { prisma } from "./prisma";

export interface UnsubscribeResult {
  success: boolean;
  method: string;
  error?: string;
  pending?: boolean;
}

export async function executeUnsubscribe(
  userId: string,
  subscriptionId: string
): Promise<UnsubscribeResult> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    return { success: false, method: "none", error: "Subscription not found" };
  }

  let method = "manual";
  let success = false;
  let pending = false;
  let errorMessage: string | undefined;

  try {
    if (subscription.unsubscribeUrl) {
      // Attempt HTTP GET to unsubscribe URL
      method = "link";
      const response = await fetch(subscription.unsubscribeUrl, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      success = response.ok || response.status === 302 || response.status === 301;
      if (!success) {
        errorMessage = `HTTP ${response.status}`;
      }
    } else if (subscription.unsubscribeEmail) {
      // Automated sending is not implemented yet, so keep this pending.
      method = "email";
      pending = true;
      errorMessage = "Email unsubscribe requires manual sending";
    } else {
      method = "manual";
      success = false;
      errorMessage = "No unsubscribe mechanism available";
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    success = false;
  }

  // Log the action
  await prisma.unsubscribeAction.create({
    data: {
      userId,
      subscriptionId,
      method,
      status: success ? "success" : pending ? "pending" : "failed",
      errorMessage,
    },
  });

  // Update subscription status
  if (success) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "unsubscribed" },
    });
  }

  return { success, method, error: errorMessage, pending };
}

export async function bulkUnsubscribe(
  userId: string,
  subscriptionIds: string[]
) {
  const results = await Promise.allSettled(
    subscriptionIds.map((id) => executeUnsubscribe(userId, id))
  );

  return results.map((result, i) => ({
    subscriptionId: subscriptionIds[i],
    ...(result.status === "fulfilled"
      ? result.value
      : { success: false, method: "none", error: "Unexpected error" }),
  }));
}
