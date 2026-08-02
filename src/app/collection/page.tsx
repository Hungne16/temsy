"use client";

import { useState, useEffect } from "react";
import { MOCK_STAMPS, MOCK_ALBUMS, Stamp } from "@/lib/mockData";
import { StampCard } from "@/components/StampCard";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserStamps } from "@/lib/stampService";

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState<"all" | "albums">("all");
  const { user, loading } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setStamps(MOCK_STAMPS); // Fallback to mock data if not logged in
      setIsFetching(false);
      return;
    }
    
    getUserStamps(user.uid).then((data) => {
      setStamps(data as Stamp[]);
      setIsFetching(false);
    });
  }, [user]);

  if (loading || isFetching) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải bộ sưu tập...</div>;
  }

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold">Bộ sưu tập</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tem..." 
              className="pl-10 pr-4 py-2 rounded-full border border-white/40 glass text-sm focus:outline-none focus:border-pastel-blue w-full md:w-64"
            />
          </div>
          <button className="p-2.5 rounded-full glass hover:bg-white/50 transition-colors">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-black/5 dark:border-white/10 pb-px">
        <button 
          onClick={() => setActiveTab("all")}
          className={`pb-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "all" ? "border-pastel-blue text-pastel-blue-dark" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Tất cả Tem ({stamps.length})
        </button>
        <button 
          onClick={() => setActiveTab("albums")}
          className={`pb-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "albums" ? "border-pastel-blue text-pastel-blue-dark" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Album ({MOCK_ALBUMS.length})
        </button>
      </div>

      {activeTab === "all" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {stamps.map((stamp) => (
            <StampCard key={stamp.id} stamp={stamp} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card flex flex-col items-center justify-center min-h-[200px] border-dashed border-2 border-pastel-blue cursor-pointer hover:bg-pastel-blue/5">
            <div className="w-12 h-12 rounded-full bg-pastel-blue/20 flex items-center justify-center text-pastel-blue-dark mb-2">
              <Plus size={24} />
            </div>
            <span className="font-semibold text-pastel-blue-dark">Tạo Album Mới</span>
          </div>
          {MOCK_ALBUMS.map((album) => (
            <div key={album.id} className="glass-card flex flex-col min-h-[200px] cursor-pointer group">
              <div className="flex-1 flex gap-2">
                <div className="w-1/2 bg-black/5 rounded-xl"></div>
                <div className="w-1/2 flex flex-col gap-2">
                  <div className="h-1/2 bg-black/5 rounded-xl"></div>
                  <div className="h-1/2 bg-black/5 rounded-xl"></div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-lg group-hover:text-pastel-blue transition-colors">{album.title}</h3>
                <p className="text-sm text-foreground/60">{album.count} tem</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
