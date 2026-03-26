import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-md w-full text-center space-y-4">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-dwc-danger)" }}
        >
          Authentication Error
        </h1>
        <p style={{ color: "var(--color-dwc-text-muted)" }}>
          Something went wrong during sign-in. Please try again.
        </p>
        <Link href="/" className="btn-primary inline-flex justify-center">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
