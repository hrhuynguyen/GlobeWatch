"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleDollarSign, GitCompareArrows, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CrisisDetailPanel } from "@/components/globe/CrisisDetailPanel";
import { CrisisGlobe } from "@/components/globe/CrisisGlobe";
import { fetchCrises } from "@/lib/api";
import { compactNumber, usd } from "@/lib/format";
import { formatModeValue, getModeColor, VIEW_MODES } from "@/lib/globe-modes";
import type { CrisisPoint, ViewMode } from "@/types/crisis";

const YEARS = [2026, 2025, 2024];
const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" }
];

export function CrisisCommandCenter() {
  const [crises, setCrises] = useState<CrisisPoint[]>([]);
  const [selected, setSelected] = useState<CrisisPoint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("severity");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [comparisonIso3, setComparisonIso3] = useState<string | null>(null);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCrises() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await fetchCrises(year, month, controller.signal);
        setCrises(data);
        setSelected((current) => {
          if (!current) {
            return data[0] ?? null;
          }

          return data.find((crisis) => crisis.iso3 === current.iso3) ?? data[0] ?? null;
        });
        setComparisonIso3((current) =>
          current && data.some((crisis) => crisis.iso3 === current) ? current : (data[1]?.iso3 ?? null)
        );
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
  }, [month, year]);

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

  const comparison = useMemo(() => {
    const fallbackIso3 = crises.find((crisis) => crisis.iso3 !== selected?.iso3)?.iso3 ?? null;
    const iso3 = comparisonIso3 && comparisonIso3 !== selected?.iso3 ? comparisonIso3 : fallbackIso3;
    return crises.find((crisis) => crisis.iso3 === iso3) ?? null;
  }, [comparisonIso3, crises, selected?.iso3]);

  const selectedMode = VIEW_MODES[viewMode];

  return (
    <section className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_420px]">
      <div className="relative min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(13,89,95,0.65),#061112_68%)]">
        <div className="absolute left-5 right-5 top-5 z-10 grid max-w-4xl gap-3 xl:grid-cols-[1fr_1.35fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard icon={UsersRound} label="People in need" value={compactNumber(totals.peopleInNeed)} />
            <MetricCard icon={CircleDollarSign} label="Funding gap" value={usd(totals.fundingGapUsd)} />
            <MetricCard icon={AlertTriangle} label="Critical crises" value={String(totals.criticalCount)} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Map mode</p>
                <p className="mt-1 text-sm text-stone-200">{selectedMode.description}</p>
              </div>
              <div className="flex gap-2">
                <SelectControl
                  label="Year"
                  value={String(year)}
                  onChange={(value) => setYear(Number(value))}
                  options={YEARS.map((item) => ({ value: String(item), label: String(item) }))}
                />
                <SelectControl
                  label="Month"
                  value={String(month)}
                  onChange={(value) => setMonth(Number(value))}
                  options={MONTHS.map((item) => ({ value: String(item.value), label: item.label }))}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {(Object.keys(VIEW_MODES) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.12em] transition ${
                    mode === viewMode
                      ? "border-mint bg-mint/15 text-stone-50"
                      : "border-white/10 bg-black/20 text-stone-400 hover:border-white/30 hover:text-stone-100"
                  }`}
                >
                  {VIEW_MODES[mode].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {isLoading ? (
          <StatusPanel title="Loading backend data" message="Fetching crisis records from FastAPI..." />
        ) : errorMessage ? (
          <StatusPanel
            title="Backend unavailable"
            message={`${errorMessage}. Start the API with uvicorn app.main:app --reload --port 8000 from the backend folder.`}
          />
        ) : selected ? (
          <CrisisGlobe
            crises={crises}
            selected={selected}
            viewMode={viewMode}
            comparison={comparison}
            isComparisonEnabled={isComparisonEnabled}
            onSelect={setSelected}
          />
        ) : (
          <StatusPanel title="No crisis data" message="The API returned an empty crisis dataset." />
        )}
        <div className="absolute bottom-5 left-5 right-5 z-10 rounded-3xl border border-white/10 bg-black/35 p-4 text-sm text-stone-300 backdrop-blur md:left-auto md:w-[26rem]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-100">{selectedMode.label} legend</p>
              {selected ? (
                <p className="mt-1 text-xs text-stone-400">
                  {selected.countryName}: {formatModeValue(selected, viewMode)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsComparisonEnabled((current) => !current)}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                isComparisonEnabled
                  ? "border-mint bg-mint/15 text-stone-50"
                  : "border-white/10 bg-black/20 text-stone-400 hover:border-white/30"
              }`}
            >
              <GitCompareArrows size={15} />
              Compare
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {selectedMode.legend.map((item) => (
              <LegendItem key={item.label} color={item.color} label={item.label} />
            ))}
          </div>
          {isComparisonEnabled && selected && comparison ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Comparison arc</p>
              <div className="mt-3 flex items-center gap-2">
                <CountryPill crisis={selected} viewMode={viewMode} />
                <span className="text-stone-500">to</span>
                <select
                  value={comparison.iso3}
                  onChange={(event) => setComparisonIso3(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#081617] px-3 py-2 text-sm text-stone-100 outline-none"
                >
                  {crises
                    .filter((crisis) => crisis.iso3 !== selected.iso3)
                    .map((crisis) => (
                      <option key={crisis.iso3} value={crisis.iso3}>
                        {crisis.countryName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {selected ? (
        <CrisisDetailPanel
          crisis={selected}
          crises={crises}
          viewMode={viewMode}
          year={year}
          month={month}
          onSelect={setSelected}
        />
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
  icon: LucideIcon;
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

function SelectControl({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-[#081617] px-3 py-2 text-sm font-bold text-stone-100 outline-none transition hover:border-white/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CountryPill({ crisis, viewMode }: { crisis: CrisisPoint; viewMode: ViewMode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-stone-100">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getModeColor(crisis, viewMode) }} />
      {crisis.iso3}
    </span>
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
