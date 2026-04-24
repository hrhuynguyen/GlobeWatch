"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleDollarSign, UsersRound } from "lucide-react";

import { CrisisDetailPanel } from "@/components/globe/CrisisDetailPanel";
import { CrisisGlobe } from "@/components/globe/CrisisGlobe";
import { fetchCrises } from "@/lib/api";
import { compactNumber, usd } from "@/lib/format";
import type { CrisisPoint } from "@/types/crisis";

export function CrisisCommandCenter() {
  const [crises, setCrises] = useState<CrisisPoint[]>([]);
  const [selected, setSelected] = useState<CrisisPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCrises() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await fetchCrises(controller.signal);
        setCrises(data);
        setSelected((current) => current ?? data[0] ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load crisis data");
      } finally {
        setIsLoading(false);
      }
    }

    loadCrises();

    return () => controller.abort();
  }, []);

  const totals = useMemo(() => {
    return crises.reduce(
      (acc, crisis) => ({
        peopleInNeed: acc.peopleInNeed + crisis.peopleInNeed,
        fundingGapUsd: acc.fundingGapUsd + crisis.fundingGapUsd,
        criticalCount: acc.criticalCount + (crisis.severityClass === "critical" ? 1 : 0)
      }),
      { peopleInNeed: 0, fundingGapUsd: 0, criticalCount: 0 }
    );
  }, [crises]);

  return (
    <section className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_420px]">
      <div className="relative min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(13,89,95,0.65),#061112_68%)]">
        <div className="absolute left-5 top-5 z-10 grid gap-3 sm:grid-cols-3">
          <MetricCard icon={UsersRound} label="People in need" value={compactNumber(totals.peopleInNeed)} />
          <MetricCard icon={CircleDollarSign} label="Funding gap" value={usd(totals.fundingGapUsd)} />
          <MetricCard icon={AlertTriangle} label="Critical crises" value={String(totals.criticalCount)} />
        </div>
        {isLoading ? (
          <StatusPanel title="Loading backend data" message="Fetching crisis records from FastAPI..." />
        ) : errorMessage ? (
          <StatusPanel
            title="Backend unavailable"
            message={`${errorMessage}. Start the API with uvicorn app.main:app --reload --port 8000 from the backend folder.`}
          />
        ) : selected ? (
          <CrisisGlobe crises={crises} selected={selected} onSelect={setSelected} />
        ) : (
          <StatusPanel title="No crisis data" message="The API returned an empty crisis dataset." />
        )}
        <div className="absolute bottom-5 left-5 right-5 z-10 rounded-3xl border border-white/10 bg-black/35 p-4 text-sm text-stone-300 backdrop-blur md:left-auto md:w-[26rem]">
          <p className="font-bold text-stone-100">Severity legend</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <LegendItem color="#ff3b30" label="Critical 90+" />
            <LegendItem color="#ff8c42" label="Severe 82-89" />
            <LegendItem color="#f4c95d" label="High 72-81" />
            <LegendItem color="#83e6c5" label="Moderate" />
          </div>
        </div>
      </div>
      {selected ? (
        <CrisisDetailPanel crisis={selected} crises={crises} onSelect={setSelected} />
      ) : (
        <aside className="border-l border-white/10 bg-[#091617] p-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 text-stone-300">
            Select a loaded crisis marker to inspect country details.
          </div>
        </aside>
      )}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur">
      <Icon className="text-mint" size={20} />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-50">{value}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function StatusPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-black/45 p-6 backdrop-blur">
        <p className="font-display text-3xl text-stone-50">{title}</p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
