"use client";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-120px)] rounded-3xl bg-muted-paper flex flex-col items-center justify-center animate-pulse">
      <p className="text-pencil/40 font-patrick text-lg">Đang tải bản đồ...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="pb-32">
      <MapWithNoSSR />
    </div>
  );
}
