"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";

import { formatModeValue, getCoverageSummary, getModeColor, getPointScale, VIEW_MODES } from "@/lib/globe-modes";
import type { CrisisPoint, ViewMode } from "@/types/crisis";

type InteractiveGlobeProps = {
  crises: CrisisPoint[];
  selected: CrisisPoint;
  viewMode: ViewMode;
  comparison: CrisisPoint | null;
  isComparisonEnabled: boolean;
  onSelect: (crisis: CrisisPoint) => void;
};

type ComparisonArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string[];
};

export default function InteractiveGlobe({
  crises,
  selected,
  viewMode,
  comparison,
  isComparisonEnabled,
  onSelect
}: InteractiveGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [hoveredIso3, setHoveredIso3] = useState<string | null>(null);
  const comparisonIso3 = isComparisonEnabled ? comparison?.iso3 : null;

  const comparisonArcs = useMemo<ComparisonArc[]>(() => {
    if (!isComparisonEnabled || !comparison || comparison.iso3 === selected.iso3) {
      return [];
    }

    return [
      {
        startLat: selected.lat,
        startLng: selected.lng,
        endLat: comparison.lat,
        endLng: comparison.lng,
        color: [getModeColor(selected, viewMode), getModeColor(comparison, viewMode)]
      }
    ];
  }, [comparison, isComparisonEnabled, selected, viewMode]);

  useEffect(() => {
    const controls = globeRef.current?.controls();

    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enableDamping = true;
    }
  }, []);

  useEffect(() => {
    globeRef.current?.pointOfView(
      {
        lat: selected.lat,
        lng: selected.lng,
        altitude: 1.65
      },
      850
    );
  }, [selected]);

  return (
    <div className="absolute inset-0">
      <Globe
        ref={globeRef}
        width={typeof window === "undefined" ? 900 : window.innerWidth}
        height={typeof window === "undefined" ? 700 : window.innerHeight - 110}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#83e6c5"
        atmosphereAltitude={0.18}
        pointsData={crises}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(point) => {
          const crisis = point as CrisisPoint;
          const isActive = crisis.iso3 === selected.iso3 || crisis.iso3 === hoveredIso3 || crisis.iso3 === comparisonIso3;
          return isActive ? 0.2 : 0.07 + getPointScale(crisis, viewMode) / 8;
        }}
        pointRadius={(point) => {
          const crisis = point as CrisisPoint;
          const isActive = crisis.iso3 === selected.iso3 || crisis.iso3 === hoveredIso3 || crisis.iso3 === comparisonIso3;
          return isActive ? 0.62 : 0.2 + getPointScale(crisis, viewMode) * 0.34;
        }}
        pointColor={(point) => getModeColor(point as CrisisPoint, viewMode)}
        pointLabel={(point) => {
          const crisis = point as CrisisPoint;
          const mode = VIEW_MODES[viewMode];
          return `
            <div style="font-family: Verdana, sans-serif; padding: 10px;">
              <strong>${crisis.countryName}</strong><br/>
              ${crisis.crisisName}<br/>
              ${mode.metricLabel}: ${formatModeValue(crisis, viewMode)}<br/>
              ${getCoverageSummary(crisis)}
            </div>
          `;
        }}
        onPointClick={(point) => onSelect(point as CrisisPoint)}
        onPointHover={(point) => setHoveredIso3(point ? (point as CrisisPoint).iso3 : null)}
        labelsData={crises}
        labelLat="lat"
        labelLng="lng"
        labelText={(point) => (point as CrisisPoint).iso3}
        labelSize={(point) => {
          const crisis = point as CrisisPoint;
          return crisis.iso3 === selected.iso3 || crisis.iso3 === hoveredIso3 || crisis.iso3 === comparisonIso3 ? 1.2 : 0.82;
        }}
        labelDotRadius={0.22}
        labelColor={(point) => {
          const crisis = point as CrisisPoint;
          return crisis.iso3 === hoveredIso3 ? "#83e6c5" : "rgba(247, 240, 223, 0.88)";
        }}
        arcsData={comparisonArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.35}
        arcDashGap={0.08}
        arcDashAnimateTime={1600}
        arcStroke={0.75}
      />
    </div>
  );
}
