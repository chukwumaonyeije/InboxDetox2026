import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserFilters } from "@/lib/filters";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const filters = await getUserFilters(session.user.id);

  const initial = {
    blockedDomains: (filters?.blockedDomains as string[]) ?? [],
    blockedKeywords: (filters?.blockedKeywords as string[]) ?? [],
    maxAgeDays: filters?.maxAgeDays ?? null,
    unreadOnly: filters?.unreadOnly ?? false,
    autoCategories: (filters?.autoCategories as string[]) ?? [],
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
        >
          Settings
        </h1>
        <p style={{ color: "var(--color-dwc-text-muted)" }}>
          Configure scan filters and preferences.
        </p>
      </div>

      <div className="card">
        <SettingsForm initial={initial} />
      </div>
    </div>
  );
}
