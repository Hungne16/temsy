"use client";

import { useState } from "react";
import { MOCK_STAMPS } from "@/lib/mockData";
import { StampCard } from "@/components/StampCard";
import { Compass, TrendingUp, MapPin } from "lucide-react";

export default function Home() {
  const [feedType, setFeedType] = useState<"new" | "trending" | "location">("trending");

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Khám phá</h1>
          <p className="text-foreground/60 text-lg">
            Nguồn cảm hứng từ những nhà sưu tầm khắp thế giới.
          </p>
        </div>
        
        <div className="flex gap-2 bg-white/40 p-1 rounded-2xl glass">
          <button 
            onClick={() => setFeedType("trending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              feedType === "trending" ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
            }`}
          >
            <TrendingUp size={16} /> Nổi bật
          </button>
          <button 
            onClick={() => setFeedType("new")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              feedType === "new" ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
            }`}
          >
            <Compass size={16} /> Mới nhất
          </button>
          <button 
            onClick={() => setFeedType("location")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              feedType === "location" ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
            }`}
          >
            <MapPin size={16} /> Gần bạn
          </button>
        </div>
      </header>

      {/* Masonry-like Grid for Feed */}
      <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
        {/* Duplicate mock stamps to fill the feed */}
        {[...MOCK_STAMPS, ...MOCK_STAMPS, ...MOCK_STAMPS].map((stamp, i) => (
          <div key={`${stamp.id}-${i}`} className="break-inside-avoid">
            <StampCard stamp={stamp} />
          </div>
        ))}
      </div>
      
      {/* Infinite Scroll loading indicator */}
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-pastel-blue border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}
