"use client";

import { MapPin } from "lucide-react";

import { CrisisQueryPanel } from "@/components/globe/CrisisQueryPanel";
import { compactNumber, percent, usd } from "@/lib/format";
import { formatModeValue, getModeColor, VIEW_MODES } from "@/lib/globe-modes";
import type { CrisisPoint, ViewMode } from "@/types/crisis";

type CrisisDetailPanelProps = {
  crisis: CrisisPoint;
  crises: CrisisPoint[];
  viewMode: ViewMode;
  year: number;
  month: number;
  onSelect: (crisis: CrisisPoint) => void;
};

export function CrisisDetailPanel({ crisis, crises, viewMode, year, month, onSelect }: CrisisDetailPanelProps) {
  const mode = VIEW_MODES[viewMode];

  return (
    <aside className="border-l border-white/10 bg-[#091617] p-5 lg:overflow-y-auto">
      <CrisisQueryPanel selected={crisis} crises={crises} year={year} month={month} onSelect={onSelect} />

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-mint">{crisis.region}</p>
            <h2 className="mt-3 font-display text-4xl leading-none text-stone-50">{crisis.countryName}</h2>
            <p className="mt-3 text-stone-300">{crisis.crisisName}</p>
          </div>
          <div
            className="rounded-2xl px-3 py-2 text-center text-sm font-bold text-ink"
            style={{ backgroundColor: getModeColor(crisis, viewMode) }}
          >
            {formatModeValue(crisis, viewMode)}
          </div>
        </div>

        <p className="mt-6 leading-7 text-stone-300">{crisis.summary}</p>

        <div className="mt-6 grid gap-3">
          <Stat label={mode.metricLabel} value={formatModeValue(crisis, viewMode)} emphasis />
          <Stat label="People in need" value={compactNumber(crisis.peopleInNeed)} />
          <Stat label="Funding requested" value={usd(crisis.fundingRequestedUsd)} />
          <Stat label="Funding received" value={usd(crisis.fundingReceivedUsd)} />
          <Stat label="Funding gap" value={usd(crisis.fundingGapUsd)} />
          <Stat label="Coverage ratio" value={percent(crisis.coverageRatio)} />
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Selected coordinates</p>
          <div className="mt-3 flex items-center gap-2 text-stone-200">
            <MapPin size={18} className="text-mint" />
            <span>
              {crisis.lat.toFixed(2)}, {crisis.lng.toFixed(2)}
            </span>
          </div>
          <p className="mt-3 text-sm text-stone-400">Dataset updated {crisis.lastUpdated}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-stone-300">Country markers</p>
        <div className="mt-4 grid gap-2">
          {crises.map((item) => (
            <button
              key={item.iso3}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                item.iso3 === crisis.iso3
                  ? "border-mint bg-mint/10 text-stone-50"
                  : "border-white/10 bg-black/20 text-stone-300 hover:border-white/30"
              }`}
            >
              <span>
                <span className="block font-bold">{item.countryName}</span>
                <span className="text-sm text-stone-400">
                  {item.iso3} · {formatModeValue(item, viewMode)}
                </span>
              </span>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getModeColor(item, viewMode) }} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={emphasis ? "text-lg font-black text-alert" : "font-bold text-stone-50"}>{value}</span>
    </div>
  );
}
