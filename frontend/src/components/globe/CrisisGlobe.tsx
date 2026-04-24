"use client";

import dynamic from "next/dynamic";

import type { CrisisPoint } from "@/types/crisis";

const InteractiveGlobe = dynamic(() => import("@/components/globe/InteractiveGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[620px] items-center justify-center text-stone-300">
      Loading 3D globe...
    </div>
  )
});

type CrisisGlobeProps = {
  crises: CrisisPoint[];
  selected: CrisisPoint;
  onSelect: (crisis: CrisisPoint) => void;
};

export function CrisisGlobe(props: CrisisGlobeProps) {
  return <InteractiveGlobe {...props} />;
}
