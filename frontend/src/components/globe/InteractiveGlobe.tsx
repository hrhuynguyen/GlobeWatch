"use client";

import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";

import { severityColor } from "@/lib/severity";
import type { CrisisPoint } from "@/types/crisis";

type InteractiveGlobeProps = {
  crises: CrisisPoint[];
  selected: CrisisPoint;
  onSelect: (crisis: CrisisPoint) => void;
};

export default function InteractiveGlobe({ crises, selected, onSelect }: InteractiveGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

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
          return crisis.iso3 === selected.iso3 ? 0.19 : 0.08 + crisis.severityScore / 900;
        }}
        pointRadius={(point) => {
          const crisis = point as CrisisPoint;
          return crisis.iso3 === selected.iso3 ? 0.62 : 0.28 + crisis.peopleInNeed / 90000000;
        }}
        pointColor={(point) => severityColor((point as CrisisPoint).severityScore)}
        pointLabel={(point) => {
          const crisis = point as CrisisPoint;
          return `
            <div style="font-family: Verdana, sans-serif; padding: 10px;">
              <strong>${crisis.countryName}</strong><br/>
              ${crisis.crisisName}<br/>
              Severity: ${crisis.severityScore}
            </div>
          `;
        }}
        onPointClick={(point) => onSelect(point as CrisisPoint)}
        labelsData={crises}
        labelLat="lat"
        labelLng="lng"
        labelText={(point) => (point as CrisisPoint).iso3}
        labelSize={(point) => ((point as CrisisPoint).iso3 === selected.iso3 ? 1.15 : 0.85)}
        labelDotRadius={0.22}
        labelColor={() => "rgba(247, 240, 223, 0.88)"}
      />
    </div>
  );
}
