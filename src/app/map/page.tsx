"use client";

import { MOCK_STAMPS } from "@/lib/mockData";
import { StampPreview } from "@/components/StampPreview";
import { Navigation } from "lucide-react";

export default function MapPage() {
  return (
    <div className="relative w-full h-[calc(100vh-80px)] md:h-screen overflow-hidden bg-[#e5e3df]">
      {/* Mock Map Background (Dots pattern to simulate map terrain) */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      ></div>

      {/* Map Controls */}
      <div className="absolute top-6 left-6 right-6 md:left-10 md:right-auto z-10 flex gap-4">
        <div className="glass-card !p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pastel-blue text-white flex items-center justify-center shadow-lg">
            <Navigation size={20} className="-rotate-45 ml-1 mt-1" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Bản đồ Tem</h2>
            <p className="text-xs text-foreground/60">Đang khám phá Hà Nội</p>
          </div>
        </div>
      </div>

      {/* Mock Map Markers */}
      <div className="absolute inset-0">
        {/* Marker 1 */}
        <div className="absolute top-1/4 left-1/4 group cursor-pointer">
          <div className="relative -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110 group-hover:z-20">
            <div className="w-16 md:w-24 shadow-2xl">
              <StampPreview 
                imageUrl={MOCK_STAMPS[0].imageUrl} 
                style="vintage" 
                className="!p-1"
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-pastel-blue rotate-45 -z-10"></div>
          </div>
        </div>

        {/* Marker 2 */}
        <div className="absolute top-1/2 left-2/3 group cursor-pointer z-10">
          <div className="relative -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110 group-hover:z-20">
            <div className="w-20 md:w-28 shadow-2xl">
              <StampPreview 
                imageUrl={MOCK_STAMPS[1].imageUrl} 
                style="modern" 
                className="!p-1"
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-pastel-blue rotate-45 -z-10"></div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet for Map (Mobile) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 glass-card !rounded-b-none !rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-4"></div>
        <h3 className="font-bold text-lg mb-2">Gần bạn (12 Tem)</h3>
        <p className="text-sm text-foreground/60 mb-4">Kéo để xem các địa điểm chụp tem xung quanh.</p>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {MOCK_STAMPS.map(stamp => (
            <div key={stamp.id} className="min-w-[120px] snap-center">
               <StampPreview 
                imageUrl={stamp.imageUrl} 
                style={stamp.style} 
                className="!p-1 shadow-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
