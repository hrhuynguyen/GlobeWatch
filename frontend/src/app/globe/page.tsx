import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CrisisCommandCenter } from "@/components/globe/CrisisCommandCenter";

export default function GlobePage() {
  return (
    <main className="min-h-screen bg-ink text-stone-100">
      <div className="flex min-h-screen flex-col">
        <header className="z-10 flex flex-col gap-4 border-b border-white/10 bg-ink/80 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-mint hover:text-stone-100">
              <ArrowLeft size={16} />
              Back to landing
            </Link>
            <h1 className="mt-2 font-display text-3xl text-stone-50 md:text-4xl">Crisis Globe</h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-stone-300">
            Phase 6 command center: crisis markers, dashboard metrics, and natural-language answers are loaded
            from the FastAPI backend and grounded in the current crisis dataset.
          </p>
        </header>
        <CrisisCommandCenter />
      </div>
    </main>
  );
}
