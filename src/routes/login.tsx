import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import AuthShell, { Field } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — VersaVault" }, { name: "description", content: "Sign in to your VersaVault workspace." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes("@")) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "Min 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 700);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your VersaVault workspace."
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={setEmail} error={errors.email} />
        <Field label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={setPassword} error={errors.password} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Remember me</label>
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <button disabled={loading} className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-90 transition-smooth disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="relative my-2">
          <div className="h-px bg-border" />
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 bg-background text-xs text-muted-foreground">or continue with</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="h-11 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-smooth">Google</button>
          <button type="button" className="h-11 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-smooth">GitHub</button>
        </div>
      </form>
    </AuthShell>
  );
}
