import type { Subscription, UnsubscribeAction, EmailScan, WeeklySummary } from "@/generated/prisma";

// ─── Extended Types ────────────────────────────────────────────────────────

export type SubscriptionWithActions = Subscription & {
  actions: UnsubscribeAction[];
};

export type ScanWithSubscriptions = EmailScan & {
  subscriptions?: Subscription[];
};

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ScanResult {
  scanId: string;
  emailsScanned: number;
  subsFound: number;
}

export interface UnsubscribeResult {
  subscriptionId: string;
  success: boolean;
  method: string;
  error?: string;
}

// ─── Filter Types ──────────────────────────────────────────────────────────

export interface FilterCriteria {
  domains?: string[];
  keywords?: string[];
  olderThanDays?: number;
  unreadOnly?: boolean;
  categories?: EmailCategory[];
  provider?: "gmail" | "outlook" | "all";
}

export type EmailCategory =
  | "promotional"
  | "newsletter"
  | "transactional"
  | "social"
  | "updates"
  | "financial"
  | "other";

export type SubscriptionStatus = "active" | "unsubscribed" | "ignored" | "failed";

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalSubs: number;
  activeSubs: number;
  unsubscribedCount: number;
  recentActionCount: number;
  latestSummary?: WeeklySummary | null;
}

// ─── NextAuth Session Extension ────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
