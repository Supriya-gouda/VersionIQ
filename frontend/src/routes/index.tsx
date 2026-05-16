import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GitMerge,
  Sparkles,
  ShieldCheck,
  Boxes,
  ArrowRight,
  Check,
  Github,
  GitBranch,
  Upload,
  Zap,
  Lock,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VersaVault — AI-powered versioned file storage with smart rollback" },
      {
        name: "description",
        content:
          "Versioned file storage with AI change summaries, smart rollback, and a built-in CI/CD dashboard for modern engineering teams.",
      },
      { property: "og:title", content: "VersaVault — Smart versioning for modern teams" },
      {
        property: "og:description",
        content:
          "AI-assisted file versioning with smart rollback recommendations and a unified CI/CD pipeline view.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
              <GitMerge className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">VersaVault</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#how" className="hover:text-foreground transition-smooth">
              How it works
            </a>
            <a href="#benefits" className="hover:text-foreground transition-smooth">
              Benefits
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-smooth"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#020617] overflow-hidden">
        {/* Abstract Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen pointer-events-none" 
          style={{ backgroundImage: "url('/images/tech_hero_background.png')" }}
        />
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] -translate-y-1/2 opacity-50" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[140px] opacity-30" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-40 text-center relative">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[0.95] text-white">
            Version every file.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Rollback with confidence.
            </span>
          </h1>
          
          <p className="mt-8 text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            VersaVault gives your team Git-grade versioning for any file, AI summaries of every
            change, and a CI/CD dashboard that ties releases back to the artifacts they ship.
          </p>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all duration-300 font-bold text-lg"
            >
              Start free today <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800 backdrop-blur-sm transition-all duration-300 font-bold text-lg"
            >
              View live demo
            </Link>
          </div>

          {/* Hero mock */}
          <div className="mt-24 mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden text-left">
              <div className="h-11 px-5 flex items-center gap-2 bg-slate-900/50 border-b border-slate-800">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/50" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="ml-4 flex-1 flex justify-center">
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    secure-vault.io/dashboard/ai-summary
                  </span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6 p-8">
                {[
                  { icon: Upload, label: "Files", value: "248", sub: "+12 this week", color: "text-amber-400" },
                  { icon: GitBranch, label: "Versions", value: "1,924", sub: "across all files", color: "text-orange-400" },
                  {
                    icon: ShieldCheck,
                    label: "Stable releases",
                    value: "98.4%",
                    sub: "last 30 days",
                    color: "text-emerald-400",
                  },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-800 p-6 bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.label}</span>
                        <div className={`w-8 h-8 rounded-lg bg-slate-800/50 grid place-items-center ${s.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-slate-500 mt-2 font-medium">{s.sub}</div>
                    </div>
                  );
                })}
              </div>
              <div className="px-8 pb-8">
                <div className="rounded-2xl border border-slate-800 p-6 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 grid place-items-center">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">
                      AI Version Intelligence · deployment-config.yaml v1.4.2
                    </span>
                  </div>
                  <p className="text-base text-slate-400 leading-relaxed">
                    Scaled deployment from <span className="text-white font-semibold">3 to 8 replicas</span>, added{" "}
                    <span className="text-amber-400 font-semibold text-sm px-1.5 py-0.5 bg-amber-500/10 rounded">2 new environment variables</span>,
                    and optimized liveness probes. Smart rollback recommended to{" "}
                    <span className="text-emerald-400 font-bold underline underline-offset-4 cursor-pointer">v1.4.1 (stable)</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-4xl font-bold">Everything you need to ship safely</h2>
          <p className="mt-3 text-muted-foreground">
            Versioning, intelligence, and deployment in one beautiful workspace.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: GitBranch,
              title: "Granular versioning",
              desc: "Every save is a snapshot. Browse, diff, and restore any version with one click.",
            },
            {
              icon: Sparkles,
              title: "AI change summaries",
              desc: "Get a plain-English explanation of what changed — and why it matters.",
            },
            {
              icon: ShieldCheck,
              title: "Smart rollback",
              desc: "We score every version and recommend the safest one to roll back to.",
            },
            {
              icon: Boxes,
              title: "Built-in CI/CD",
              desc: "Watch Jenkins pipelines and Docker deployments side-by-side with your files.",
            },
            {
              icon: Lock,
              title: "Enterprise security",
              desc: "Granular sharing, audit trails, and SSO — designed for serious teams.",
            },
            {
              icon: Activity,
              title: "Live activity",
              desc: "See uploads, builds, and rollbacks across your org in real time.",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant mb-4">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-bold">How it works</h2>
            <p className="mt-3 text-muted-foreground">From upload to deploy in three steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: Upload,
                title: "Upload anything",
                desc: "Drag in PDFs, configs, designs, or docs. Each upload becomes a versioned artifact.",
              },
              {
                n: "02",
                icon: Sparkles,
                title: "AI summarizes changes",
                desc: "Our model diffs the new version and writes a human-readable summary instantly.",
              },
              {
                n: "03",
                icon: Zap,
                title: "Ship or rollback",
                desc: "Trigger a Jenkins pipeline or restore a stable version — without leaving VersaVault.",
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border p-6 shadow-card relative"
                >
                  <span className="absolute top-4 right-4 text-xs font-mono text-muted-foreground">
                    {s.n}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-accent grid place-items-center mb-4">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold">Built for teams that ship daily</h2>
            <p className="mt-4 text-muted-foreground">
              Stop hunting through Slack messages for "the latest version." Stop guessing which
              release broke prod.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Cut incident time by 60% with one-click stable rollback",
                "Onboard new engineers in hours with rich version history",
                "Replace 4 tools — storage, diff, AI, and pipeline UI",
                "SOC2-ready audit trails on every action",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-success/15 text-success grid place-items-center mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-hero border border-border p-8 shadow-elegant">
            <div className="rounded-xl bg-card border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Smart rollback recommendation</span>
              </div>
              <div className="text-xs text-muted-foreground mb-4">deployment-config.yaml</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-success/30 bg-success/5">
                  <div>
                    <div className="text-sm font-medium">v1.4.1 — recommended</div>
                    <div className="text-xs text-muted-foreground">
                      Stable for 36h · all checks passed
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                    Stable
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="text-sm font-medium">v1.4.0</div>
                    <div className="text-xs text-muted-foreground">5xx spike on /api/v2</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
                    Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-3xl bg-gradient-primary p-12 text-center shadow-elegant">
            <h2 className="text-4xl font-bold text-primary-foreground">
              Ready to version everything?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Start free. Invite your team. Roll back with confidence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-card text-foreground shadow-elegant hover:opacity-90 transition-smooth font-medium"
              >
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-primary-foreground border border-white/20 hover:bg-white/20 transition-smooth font-medium"
              >
                Explore demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-primary" />
            <span>© 2026 VersaVault</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-smooth">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-smooth">
              Terms
            </a>
            <a
              href="#"
              className="hover:text-foreground transition-smooth inline-flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
