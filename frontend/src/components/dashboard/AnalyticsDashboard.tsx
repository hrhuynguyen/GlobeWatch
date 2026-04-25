"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  CircleDollarSign,
  Gauge,
  Globe2,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { fetchDashboardSummary } from "@/lib/api";
import { compactNumber, percent, usd } from "@/lib/format";
import type {
  ClusterDistributionPoint,
  DashboardCountryMetric,
  DashboardSummary,
  FundingTrendPoint
} from "@/types/dashboard";

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

const CLUSTER_COLORS = ["#83e6c5", "#ff6b35", "#f4c95d", "#58a6ff", "#b7f7d4", "#d1a86d", "#f58aa8", "#8dd3ff"];

export function AnalyticsDashboard() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await fetchDashboardSummary(year, month, controller.signal);
        setSummary(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();

    return () => controller.abort();
  }, [month, year]);

  const cardData = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Active crises",
        value: String(summary.totals.crisisCount),
        detail: `${summary.topUnderfunded.length} countries ranked`,
        icon: Globe2
      },
      {
        label: "People in need",
        value: compactNumber(summary.totals.peopleInNeed),
        detail: "Across loaded crisis plans",
        icon: UsersRound
      },
      {
        label: "Total funding gap",
        value: usd(summary.totals.fundingGapUsd),
        detail: `${percent(summary.totals.coverageRatio)} covered`,
        icon: CircleDollarSign
      },
      {
        label: "Worst mismatch",
        value: summary.worstMismatch?.iso3 ?? "N/A",
        detail: summary.worstMismatch
          ? `${usd(summary.worstMismatch.fundingGapUsd)} gap`
          : "No crisis data loaded",
        icon: AlertTriangle
      }
    ];
  }, [summary]);

  if (isLoading) {
    return <DashboardStatus title="Loading dashboard" message="Fetching analytics from the FastAPI summary endpoint..." />;
  }

  if (errorMessage) {
    return (
      <DashboardStatus
        title="Dashboard API unavailable"
        message={`${errorMessage}. Start the backend with uvicorn app.main:app --reload --port 8000 from the backend folder.`}
      />
    );
  }

  if (!summary) {
    return <DashboardStatus title="No dashboard data" message="The API returned no analytics payload." />;
  }

  return (
    <section className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto grid max-w-7xl gap-5">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-mint">Phase 5 analytics</p>
            <h2 className="mt-2 font-display text-4xl text-stone-50 md:text-5xl">Humanitarian response dashboard</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              Cards and charts are derived from the same crisis and project records powering the globe.
              Source: {summary.source}
              {summary.generatedAt ? `, generated ${new Date(summary.generatedAt).toLocaleString()}` : ""}.
            </p>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cardData.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <ChartPanel
            icon={BarChart3}
            title="Funding Over Time"
            description="Requested, received, and gap totals grouped by period from the backend dataset."
          >
            <FundingTrendChart data={summary.fundingTrend} />
          </ChartPanel>
          <ChartPanel
            icon={Gauge}
            title="Top Underfunded Countries"
            description="Countries ranked by current funding gap."
          >
            <UnderfundedChart data={summary.topUnderfunded} />
          </ChartPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
          <ChartPanel
            icon={BadgeDollarSign}
            title="Cluster Distribution"
            description="Requested funds grouped by project cluster."
          >
            <ClusterChart data={summary.clusterDistribution} />
          </ChartPanel>
          <WorstMismatchPanel country={summary.worstMismatch} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/30 p-5 shadow-glow backdrop-blur">
      <Icon className="text-mint" size={24} />
      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <p className="mt-2 font-display text-4xl text-stone-50">{value}</p>
      <p className="mt-2 text-sm text-stone-300">{detail}</p>
    </article>
  );
}

function ChartPanel({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#071314]/90 p-5 backdrop-blur">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl border border-mint/20 bg-mint/10 p-3 text-mint">
          <Icon size={21} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-stone-50">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-stone-400">{description}</p>
        </div>
      </div>
      <div className="h-[330px]">{children}</div>
    </article>
  );
}

function FundingTrendChart({ data }: { data: FundingTrendPoint[] }) {
  if (data.length === 0) {
    return <EmptyChart label="No funding periods available" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="period" stroke="#a8a29e" tickLine={false} axisLine={false} />
        <YAxis stroke="#a8a29e" tickLine={false} axisLine={false} tickFormatter={(value) => compactNumber(Number(value))} />
        <Tooltip content={<FundingTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend wrapperStyle={{ color: "#d6d3d1" }} />
        <Bar dataKey="fundingRequestedUsd" name="Requested" fill="#83e6c5" radius={[8, 8, 0, 0]} />
        <Bar dataKey="fundingReceivedUsd" name="Received" fill="#f4c95d" radius={[8, 8, 0, 0]} />
        <Bar dataKey="fundingGapUsd" name="Gap" fill="#ff6b35" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function UnderfundedChart({ data }: { data: DashboardCountryMetric[] }) {
  if (data.length === 0) {
    return <EmptyChart label="No underfunded countries available" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
        <XAxis type="number" stroke="#a8a29e" tickLine={false} axisLine={false} tickFormatter={(value) => compactNumber(Number(value))} />
        <YAxis dataKey="iso3" type="category" stroke="#a8a29e" tickLine={false} axisLine={false} width={42} />
        <Tooltip content={<CountryTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="fundingGapUsd" name="Funding gap" fill="#ff6b35" radius={[0, 10, 10, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ClusterChart({ data }: { data: ClusterDistributionPoint[] }) {
  if (data.length === 0) {
    return <EmptyChart label="No project clusters available" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="requestedFunds"
          nameKey="cluster"
          innerRadius={70}
          outerRadius={116}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.cluster} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ClusterTooltip />} />
        <Legend wrapperStyle={{ color: "#d6d3d1", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function WorstMismatchPanel({ country }: { country: DashboardCountryMetric | null }) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-alert/30 bg-[radial-gradient(circle_at_12%_10%,rgba(255,107,53,0.22),rgba(7,19,20,0.94)_42%)] p-6">
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-alert/20" />
      <p className="text-xs uppercase tracking-[0.28em] text-alert">Worst mismatch</p>
      {country ? (
        <>
          <h3 className="mt-3 font-display text-5xl text-stone-50">{country.countryName}</h3>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MismatchStat label="Funding gap" value={usd(country.fundingGapUsd)} />
            <MismatchStat label="Coverage" value={percent(country.coverageRatio)} />
            <MismatchStat label="People in need" value={compactNumber(country.peopleInNeed)} />
            <MismatchStat label="Oversight" value={String(country.oversightScore)} />
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-stone-300">
            This card flags the country with the largest combination of absolute funding gap and low
            coverage in the currently selected dataset.
          </p>
        </>
      ) : (
        <p className="mt-4 text-stone-300">No country mismatch is available for this filter.</p>
      )}
    </article>
  );
}

function MismatchStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-stone-50">{value}</p>
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

function DashboardStatus({ title, message }: { title: string; message: string }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 text-center">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-black/45 p-6 backdrop-blur">
        <p className="font-display text-3xl text-stone-50">{title}</p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </section>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-white/10 bg-black/20 text-sm text-stone-400">
      {label}
    </div>
  );
}

function FundingTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <TooltipShell title={String(label)}>
      {payload.map((entry) => (
        <TooltipRow key={entry.name} label={String(entry.name)} value={usd(Number(entry.value ?? 0))} />
      ))}
    </TooltipShell>
  );
}

function CountryTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as DashboardCountryMetric;

  return (
    <TooltipShell title={item.countryName}>
      <TooltipRow label="Funding gap" value={usd(item.fundingGapUsd)} />
      <TooltipRow label="Coverage" value={percent(item.coverageRatio)} />
      <TooltipRow label="People in need" value={compactNumber(item.peopleInNeed)} />
    </TooltipShell>
  );
}

function ClusterTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as ClusterDistributionPoint;

  return (
    <TooltipShell title={item.cluster}>
      <TooltipRow label="Requested" value={usd(item.requestedFunds)} />
      <TooltipRow label="Projects" value={String(item.projectCount)} />
      <TooltipRow label="Beneficiaries" value={compactNumber(item.targetBeneficiaries)} />
    </TooltipShell>
  );
}

function TooltipShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-48 rounded-2xl border border-white/10 bg-[#071314] p-3 text-sm shadow-glow">
      <p className="font-bold text-stone-50">{title}</p>
      <div className="mt-2 grid gap-1">{children}</div>
    </div>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 text-stone-300">
      <span>{label}</span>
      <span className="font-bold text-stone-100">{value}</span>
    </div>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: {
    name?: string | number;
    value?: string | number;
    payload?: unknown;
  }[];
  label?: string | number;
};
