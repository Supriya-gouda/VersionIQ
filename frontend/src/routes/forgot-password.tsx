import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import AuthShell, { Field } from "@/components/AuthShell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — VersaVault" },
      { name: "description", content: "Reset your VersaVault password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setError(undefined);
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-success/30 bg-success/5 p-5 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Check your inbox</div>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a reset link to <span className="text-foreground">{email}</span>. The link
              expires in 30 minutes.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
            error={error}
          />
          <button className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-90 transition-smooth">
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
