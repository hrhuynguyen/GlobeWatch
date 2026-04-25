import Link from "next/link";
import { ArrowRight, BarChart3, Globe2, RadioTower } from "lucide-react";

const features = [
  {
    title: "Crisis Signal Map",
    description: "Scan countries by severity, need, and response pressure on an interactive globe.",
    icon: Globe2
  },
  {
    title: "Funding Gap Lens",
    description: "Compare requested and received funding to identify the largest operational shortfalls.",
    icon: BarChart3
  },
  {
    title: "Command Briefing",
    description: "Turn dense crisis metrics into a readable control-room summary for quick decisions.",
    icon: RadioTower
  }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-6 text-stone-100 sm:px-10">
      <div className="grid-fade pointer-events-none absolute inset-0 opacity-70" />
      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-glow backdrop-blur md:p-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold uppercase tracking-[0.32em] text-mint">
            GlobeWatch
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-stone-200 transition hover:border-mint hover:text-mint"
            >
              Dashboard
            </Link>
            <Link
              href="/globe"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-stone-200 transition hover:border-mint hover:text-mint"
            >
              Open globe
            </Link>
          </div>
        </nav>

        <div className="grid items-end gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-alert/40 bg-alert/10 px-4 py-2 text-sm text-orange-100">
              Static MVP: humanitarian crisis intelligence
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[0.95] text-stone-50 sm:text-7xl lg:text-8xl">
              See where crisis severity outruns response capacity.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
              GlobeWatch turns mock humanitarian indicators into a 3D command-center view with severity
              markers, funding gaps, and country drilldowns.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/globe"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-mint px-6 py-3 font-bold text-ink transition hover:bg-stone-100"
              >
                Explore crisis globe
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 font-bold text-stone-100 transition hover:border-stone-100"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-ink/60 p-5">
            <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_45%_40%,rgba(131,230,197,0.35),rgba(7,54,61,0.85)_42%,rgba(6,17,18,1)_70%)]">
              <div className="absolute left-8 top-10 h-24 w-24 rounded-full border border-mint/40" />
              <div className="absolute bottom-12 right-10 h-40 w-40 rounded-full border border-alert/40" />
              <div className="absolute inset-x-8 top-1/2 h-px bg-mint/30" />
              <div className="absolute left-[48%] top-[38%] h-5 w-5 rounded-full bg-alert shadow-[0_0_30px_rgba(255,107,53,0.9)]" />
              <div className="absolute left-[58%] top-[43%] h-4 w-4 rounded-full bg-gold shadow-[0_0_26px_rgba(244,201,93,0.8)]" />
              <div className="absolute left-[28%] top-[60%] h-4 w-4 rounded-full bg-mint shadow-[0_0_24px_rgba(131,230,197,0.75)]" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-mint">Live briefing</p>
                <p className="mt-2 text-2xl font-bold">6 active crisis markers</p>
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <feature.icon className="mb-6 text-mint" size={30} />
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-stone-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
