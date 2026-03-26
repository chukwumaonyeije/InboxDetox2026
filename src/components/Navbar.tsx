import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <nav
      className="border-b"
      style={{
        background: "var(--color-dwc-surface)",
        borderColor: "var(--color-dwc-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-bold text-lg"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
          >
            Inbox<span style={{ color: "var(--color-dwc-accent)" }}>Detox</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/subscriptions", label: "Subscriptions" },
              { href: "/scan", label: "Scan" },
              { href: "/history", label: "History" },
              { href: "/settings", label: "Settings" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ color: "var(--color-dwc-text-muted)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm hidden md:block" style={{ color: "var(--color-dwc-text-muted)" }}>
            {session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-ghost text-sm py-1.5 px-3">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
