import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Save, Camera } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — VersaVault" }] }),
  component: Settings,
});

function Settings() {
  const [name, setName] = useState("Aarav Sharma");
  const [email, setEmail] = useState("aarav@versavault.app");
  const [role, setRole] = useState("Platform Engineer");
  const [theme, setTheme] = useState<"light" | "dark">(typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [notifs, setNotifs] = useState({ uploads: true, builds: true, rollbacks: true, weekly: false });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  function notify(m: string) { setToast(m); setTimeout(() => setToast(null), 2000); }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1">Manage your profile, storage, notifications, and theme.</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Profile */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-semibold shadow-elegant">AS</div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border grid place-items-center hover:bg-muted">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="font-semibold">{name}</div>
              <div className="text-sm text-muted-foreground">{role}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); notify("Profile saved"); }} className="grid sm:grid-cols-2 gap-4 mt-6">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Role" value={role} onChange={setRole} />
            <Field label="Email" value={email} onChange={setEmail} className="sm:col-span-2" />
            <div className="sm:col-span-2 flex justify-end">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant">
                <Save className="w-4 h-4" /> Save changes
              </button>
            </div>
          </form>
        </div>

        {/* Storage */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Storage</h2>
          <div className="mt-5">
            <div className="text-3xl font-semibold">6.2 <span className="text-base text-muted-foreground font-normal">/ 10 GB</span></div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
              <div className="h-full bg-gradient-primary" style={{ width: "62%" }} />
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { label: "Documents", val: "2.4 GB", color: "bg-primary" },
                { label: "Images", val: "1.8 GB", color: "bg-info" },
                { label: "Configs", val: "1.1 GB", color: "bg-success" },
                { label: "Other", val: "0.9 GB", color: "bg-warning" },
              ].map(s => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-muted-foreground">{s.val}</span>
                </li>
              ))}
            </ul>
            <button className="mt-5 w-full h-9 rounded-lg border border-border hover:bg-muted text-sm font-medium">Upgrade plan</button>
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">Light or dark — your call.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-4 rounded-xl border transition-smooth ${theme === t ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                {t === "light" ? <Sun className="w-5 h-5 mb-2" /> : <Moon className="w-5 h-5 mb-2" />}
                <div className="text-sm font-medium capitalize">{t}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h2>
          <ul className="mt-5 divide-y divide-border">
            {([
              ["uploads", "File uploads", "Notify me when teammates upload new files"],
              ["builds", "Pipeline failures", "Alert me when a Jenkins pipeline fails"],
              ["rollbacks", "Rollback events", "Notify me when a rollback is triggered"],
              ["weekly", "Weekly digest", "Summary of activity each Monday morning"],
            ] as const).map(([key, title, desc]) => (
              <li key={key} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                <Toggle on={notifs[key]} onChange={(v) => setNotifs({ ...notifs, [key]: v })} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">{toast}</div>}
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-smooth ${on ? "bg-gradient-primary" : "bg-muted"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}
