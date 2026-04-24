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
            Phase 2 API-backed MVP: crisis markers are loaded from the FastAPI backend, then rendered
            with severity colors and country drilldowns.
          </p>
        </header>
        <CrisisCommandCenter />
      </div>
    </main>
  );
}
