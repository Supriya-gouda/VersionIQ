import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import AuthShell, { Field } from "@/components/AuthShell";
import { Check } from "lucide-react";
import { register, setAccessToken } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — VersaVault" }, { name: "description", content: "Create your free VersaVault workspace." }] }),
  component: Register,
});

import { useAuth } from "@/components/AuthContext";

function Register() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = Math.min(4, Math.floor(password.length / 3));
  const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][strength];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRequestError("");
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter your name";
    if (!email.includes("@")) errs.email = "Enter a valid email";
    if (password.length < 8) errs.password = "Use at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const response = await register({ name: name.trim(), email, password });
      setAccessToken(response.token);
      await refreshUser();
      navigate({ to: "/dashboard" });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start versioning files with AI in minutes."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" placeholder="Aarav Sharma" value={name} onChange={setName} error={errors.name} />
        <Field label="Work email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} error={errors.email} />
        <Field label="Password" type="password" placeholder="Min 8 characters" value={password} onChange={setPassword} error={errors.password} />
        {requestError ? <p className="text-sm text-destructive">{requestError}</p> : null}
        {password && (
          <div>
            <div className="flex gap-1">
              {[0,1,2,3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? "bg-gradient-primary" : "bg-muted"}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">Password strength: {strengthLabel}</div>
          </div>
        )}
        <ul className="text-xs text-muted-foreground space-y-1">
          {["14-day free trial", "No credit card required", "Cancel anytime"].map(b => (
            <li key={b} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success" /> {b}</li>
          ))}
        </ul>
        <button disabled={loading} className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-90 transition-smooth disabled:opacity-60">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
