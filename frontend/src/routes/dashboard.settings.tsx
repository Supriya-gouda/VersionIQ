import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Moon, Sun, Bell, Save, Camera, LogOut } from "lucide-react";
import { getQuota, updateProfile, uploadAvatar, type ApiQuota } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";
import { useRef } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — VersaVault" }] }),
  component: Settings,
});

function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [quota, setQuota] = useState<ApiQuota | null>(null);
  const [notifs, setNotifs] = useState({
    uploads: true,
    builds: true,
    rollbacks: true,
    weekly: false,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setNotifs(user.notifications);
    }
  }, [user]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const savedTheme = window.localStorage.getItem("version_vault_theme");
      const nextTheme =
        savedTheme === "dark"
          ? "dark"
          : document.documentElement.classList.contains("dark")
            ? "dark"
            : "light";
      setTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }

    getQuota()
      .then((res) => setQuota(res.quota))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      window.localStorage.setItem("version_vault_theme", theme);
    }
  }, [theme]);

  function notify(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  function saveTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    notify(`Theme switched to ${nextTheme}`);
  }

  async function handleAvatarClick() {
    avatarInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setSaving(true);
    try {
      await uploadAvatar(formData);
      await refreshUser();
      notify("Avatar updated");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, role, notifications: notifs });
      await refreshUser();
      notify("Profile updated successfully");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1">
        Manage your profile, storage, notifications, and theme.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Profile */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-semibold shadow-elegant overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  user.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <button
                type="button"
                title="Change profile photo"
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border grid place-items-center hover:bg-muted transition-smooth shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.role}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4 mt-6">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Role" value={role} onChange={setRole} />
            <Field
              label="Email"
              value={user.email}
              onChange={() => {}}
              className="sm:col-span-2"
              disabled
            />
            <div className="sm:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Storage */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Storage</h2>
          <div className="mt-5">
            {quota ? (
              <>
                <div className="text-3xl font-semibold">
                  {(quota.used / 1024 ** 3).toFixed(2)}{" "}
                  <span className="text-base text-muted-foreground font-normal">
                    / {(quota.limit / 1024 ** 3).toFixed(0)} GB
                  </span>
                </div>
                <progress className="w-full h-2 mt-3" value={quota.percent} max={100} />
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  {quota.percent}% used
                </div>
              </>
            ) : (
              <div className="animate-pulse h-8 bg-muted rounded w-3/4" />
            )}
            <ul className="mt-5 space-y-3 text-sm">
              {[
                {
                  label: "Live Data",
                  val: quota ? `${(quota.used / 1024 ** 2).toFixed(1)} MB` : "...",
                  color: "bg-primary",
                },
                { label: "System Overhead", val: "0.1 GB", color: "bg-info" },
              ].map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-muted-foreground">{s.val}</span>
                </li>
              ))}
            </ul>
            <button className="mt-5 w-full h-9 rounded-lg border border-border hover:bg-muted text-sm font-medium">
              Upgrade plan
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">Light or dark — your call.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button
                type="button"
                title={`Switch to ${t} theme`}
                key={t}
                onClick={() => saveTheme(t)}
                className={`p-4 rounded-xl border transition-smooth ${theme === t ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                {t === "light" ? (
                  <Sun className="w-5 h-5 mb-2" />
                ) : (
                  <Moon className="w-5 h-5 mb-2" />
                )}
                <div className="text-sm font-medium capitalize">{t}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h2>
          <ul className="mt-5 divide-y divide-border">
            {(
              [
                ["uploads", "File uploads", "Notify me when teammates upload new files"],
                ["builds", "Pipeline failures", "Alert me when a Jenkins pipeline fails"],
                ["rollbacks", "Rollback events", "Notify me when a rollback is triggered"],
                ["weekly", "Weekly digest", "Summary of activity each Monday morning"],
              ] as const
            ).map(([key, title, desc]) => (
              <li key={key} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                <Toggle
                  label={title}
                  on={notifs[key]}
                  onChange={(v) => setNotifs({ ...notifs, [key]: v })}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign out of this browser to clear the stored token.
          </p>
          <button
            onClick={logout}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
      />
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-smooth ${on ? "bg-gradient-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
