"use client";

import { useState, useEffect } from "react";
import { getMapStamps } from "@/lib/stampService";
import { useAuth } from "@/context/AuthContext";
import { StampCard } from "@/components/StampCard";
import { Compass, TrendingUp, Filter } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<"new" | "trending">("new");
  const [filterType, setFilterType] = useState<"all" | "public" | "private" | "secret">("all");
  
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMapStamps(user?.uid).then((fetched) => {
      setStamps(fetched);
      setLoading(false);
    });
  }, [user]);

  const filteredStamps = stamps.filter(stamp => {
    if (filterType === "all") return true;
    if (filterType === "public") return stamp.isPublic !== false && !stamp.metadata?.isSecret;
    if (filterType === "private") return stamp.isPublic === false;
    if (filterType === "secret") return stamp.metadata?.isSecret === true;
    return true;
  });

  const sortedStamps = [...filteredStamps].sort((a, b) => {
    if (feedType === "trending") {
      return (b.likes || 0) - (a.likes || 0);
    } else {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA; // "new"
    }
  });

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Khám phá</h1>
          <p className="text-foreground/60 text-lg">
            Nguồn cảm hứng từ những nhà sưu tầm khắp thế giới.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 bg-white/40 p-1 rounded-2xl glass">
            <button 
              onClick={() => setFeedType("new")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                feedType === "new" ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
              }`}
            >
              <Compass size={16} /> Mới nhất
            </button>
            <button 
              onClick={() => setFeedType("trending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                feedType === "trending" ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
              }`}
            >
              <TrendingUp size={16} /> Nổi bật
            </button>
          </div>
          
          {/* Dropdown filter */}
          <div className="relative group z-10">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-1 flex items-center shadow-sm cursor-pointer border border-white/20">
              <div className="flex items-center gap-2 px-4 py-2">
                <Filter size={16} className="text-pencil" />
                <span className="text-sm font-medium text-pencil">
                  {filterType === "all" ? "Tất cả tem" : 
                   filterType === "public" ? "Tem công khai" : 
                   filterType === "private" ? "Tem riêng tư" : "Tem Ẩn"}
                </span>
              </div>
            </div>
            
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
              <button onClick={() => setFilterType("all")} className={`w-full text-left px-4 py-3 text-sm hover:bg-muted-paper transition-colors ${filterType === "all" ? "font-bold bg-muted-paper/50" : ""}`}>Tất cả tem</button>
              <button onClick={() => setFilterType("public")} className={`w-full text-left px-4 py-3 text-sm hover:bg-muted-paper transition-colors ${filterType === "public" ? "font-bold bg-muted-paper/50" : ""}`}>Tem công khai</button>
              <button onClick={() => setFilterType("private")} className={`w-full text-left px-4 py-3 text-sm hover:bg-muted-paper transition-colors ${filterType === "private" ? "font-bold bg-muted-paper/50" : ""}`}>Tem riêng tư</button>
              <button onClick={() => setFilterType("secret")} className={`w-full text-left px-4 py-3 text-sm hover:bg-muted-paper transition-colors text-marker-red ${filterType === "secret" ? "font-bold bg-muted-paper/50" : ""}`}>Tem Ẩn (Định vị)</button>
            </div>
          </div>
        </div>
      </header>

      {/* Masonry-like Grid for Feed */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-pastel-blue border-t-transparent animate-spin"></div>
        </div>
      ) : sortedStamps.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-foreground/50 text-xl font-patrick">Không có tem nào để hiển thị.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
          {sortedStamps.map((stamp) => (
            <div key={stamp.id} className="break-inside-avoid">
              <StampCard stamp={stamp} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
