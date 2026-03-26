import { prisma } from "./prisma";
import type { FilterPreference } from "@/generated/prisma";

interface FilterCriteria {
  domains?: string[];
  keywords?: string[];
  olderThanDays?: number;
  unreadOnly?: boolean;
  categories?: string[];
  provider?: "gmail" | "outlook" | "all";
}

export async function getFilteredSubscriptions(
  userId: string,
  filters: FilterCriteria
) {
  const where: Record<string, unknown> = {
    userId,
    status: "active",
  };

  if (filters.provider && filters.provider !== "all") {
    where.provider = filters.provider;
  }

  if (filters.domains && filters.domains.length > 0) {
    where.senderDomain = { in: filters.domains };
  }

  if (filters.olderThanDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.olderThanDays);
    where.lastSeen = { lte: cutoffDate };
  }

  if (filters.unreadOnly) {
    where.isRead = false;
  }

  if (filters.categories && filters.categories.length > 0) {
    where.aiCategory = { in: filters.categories };
  }

  let results = await prisma.subscription.findMany({
    where,
    orderBy: [{ emailCount: "desc" }, { lastSeen: "desc" }],
  });

  if (filters.keywords && filters.keywords.length > 0) {
    const lowerKeywords = filters.keywords.map((k) => k.toLowerCase());
    results = results.filter((sub) => {
      const subject = (sub.subjectSample || "").toLowerCase();
      const name = (sub.senderName || "").toLowerCase();
      return lowerKeywords.some(
        (kw) => subject.includes(kw) || name.includes(kw)
      );
    });
  }

  return results;
}

export async function getUserFilters(
  userId: string
): Promise<FilterPreference | null> {
  return prisma.filterPreference.findUnique({ where: { userId } });
}

export async function updateUserFilters(
  userId: string,
  updates: {
    blockedDomains?: string[];
    blockedKeywords?: string[];
    maxAgeDays?: number | null;
    unreadOnly?: boolean;
    autoCategories?: string[];
  }
) {
  const blockedDomains = updates.blockedDomains ?? [];
  const blockedKeywords = updates.blockedKeywords ?? [];
  const autoCategories = updates.autoCategories ?? [];

  return prisma.filterPreference.upsert({
    where: { userId },
    update: {
      ...(updates.blockedDomains !== undefined && { blockedDomains }),
      ...(updates.blockedKeywords !== undefined && { blockedKeywords }),
      ...(updates.maxAgeDays !== undefined && { maxAgeDays: updates.maxAgeDays }),
      ...(updates.unreadOnly !== undefined && { unreadOnly: updates.unreadOnly }),
      ...(updates.autoCategories !== undefined && { autoCategories }),
    },
    create: {
      userId,
      blockedDomains,
      blockedKeywords,
      maxAgeDays: updates.maxAgeDays ?? null,
      unreadOnly: updates.unreadOnly ?? false,
      autoCategories,
    },
  });
}
