"use client";

import dynamic from "next/dynamic";

const MapExplore = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-paper flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-muted-paper border-t-marker-red rounded-full animate-spin" />
        <p className="font-patrick text-pencil/50 text-lg">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  // Fixed full-screen so it escapes the layout padding/max-width
  return (
    <div className="fixed inset-0 z-10">
      <MapExplore />
    </div>
  );
}
