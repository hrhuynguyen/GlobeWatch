import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";

import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-ink text-stone-100">
      <header className="border-b border-white/10 bg-ink/80 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-mint hover:text-stone-100">
              <ArrowLeft size={16} />
              Back to landing
            </Link>
            <h1 className="mt-2 font-display text-3xl text-stone-50 md:text-4xl">Analytics Dashboard</h1>
          </div>
          <Link
            href="/globe"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-stone-100 transition hover:border-mint hover:text-mint"
          >
            <Globe2 size={16} />
            Open globe
          </Link>
        </div>
      </header>
      <AnalyticsDashboard />
    </main>
  );
}
