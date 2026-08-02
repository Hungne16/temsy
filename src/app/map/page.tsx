"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-120px)] rounded-3xl bg-pastel-blue/10 flex flex-col items-center justify-center animate-pulse">
      <MapPin size={48} className="text-pastel-blue-dark/30 mb-4" />
      <p className="text-foreground/50 font-medium">Đang tải bản đồ thế giới...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="p-2 bg-pastel-blue text-white rounded-xl">
              <MapPin size={24} />
            </span>
            Khám phá
          </h1>
          <p className="text-foreground/60 mt-2">Dấu chân của bạn trên bản đồ.</p>
        </header>

        <MapWithNoSSR />
      </div>
    </div>
  );
}
