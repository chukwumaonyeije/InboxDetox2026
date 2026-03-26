import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12), transparent)",
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Logo / Title */}
        <div>
          <h1
            className="text-5xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
          >
            Inbox<span style={{ color: "var(--color-dwc-accent)" }}>Detox</span>
          </h1>
          <p style={{ color: "var(--color-dwc-text-muted)" }} className="text-lg leading-relaxed">
            AI-powered email subscription manager. Scan, categorize, and
            bulk-unsubscribe from inbox clutter.
          </p>
        </div>

        {/* Feature bullets */}
        <ul
          className="text-left space-y-3 text-sm"
          style={{ color: "var(--color-dwc-text-muted)" }}
        >
          {[
            "Scans Gmail & Outlook for subscription emails",
            "Claude AI categorizes every sender automatically",
            "One-click bulk unsubscribe with audit log",
            "Weekly AI-generated inbox health summaries",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span style={{ color: "var(--color-dwc-accent)" }} className="mt-0.5">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Sign-in buttons */}
        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="btn-primary w-full justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Connect Gmail
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="btn-ghost w-full justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
              </svg>
              Connect Outlook
            </button>
          </form>
        </div>

        <p className="text-xs" style={{ color: "var(--color-dwc-text-muted)" }}>
          Read-only access. We never store your email content.
        </p>
      </div>
    </main>
  );
}
