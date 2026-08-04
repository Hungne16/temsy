"use client";

import dynamic from "next/dynamic";
import { X, MapPin, Search } from "lucide-react";
import { useState } from "react";

const MapWithNoSSR = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted-paper flex flex-col items-center justify-center animate-pulse border-[3px] border-pencil border-dashed wobbly-border">
      <MapPin size={32} className="text-pencil/30 mb-2" />
      <p className="text-pencil/50 font-patrick font-bold text-lg">Đang tải bản đồ...</p>
    </div>
  ),
});

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
  onConfirm: (position: { lat: number; lng: number }) => void;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialPosition,
  onConfirm,
}: LocationPickerModalProps) {
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );
  
  const [searchedPosition, setSearchedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPos) {
      onConfirm(selectedPos);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=vn&accept-language=vi`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const newPos = { lat, lng };
        setSearchedPosition(newPos);
        setSelectedPos(newPos);
      } else {
        alert("Không tìm thấy địa điểm này! Thử gõ tên thành phố hoặc địa chỉ cụ thể hơn.");
      }
    } catch (e) {
      alert("Lỗi tìm kiếm!");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pencil/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-paper border-[4px] border-pencil wobbly-border-md shadow-pencil w-full max-w-2xl overflow-hidden flex flex-col rotate-1">
        <div className="flex items-center justify-between p-5 border-b-[3px] border-pencil border-dashed bg-white">
          <h2 className="text-3xl font-kalam font-bold text-marker-red">Ghim địa điểm</h2>
          <button
            onClick={onClose}
            className="p-2 border-[3px] border-transparent hover:border-pencil hover:bg-muted-paper wobbly-border transition-all"
          >
            <X size={24} className="text-pencil" />
          </button>
        </div>
        
        <div className="p-6 bg-white/50">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/50" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm địa điểm..."
                className="w-full pl-10 pr-4 py-3 border-[3px] border-pencil bg-white wobbly-border focus:outline-none focus:ring-2 focus:ring-marker-blue/20 text-lg font-patrick shadow-[2px_2px_0px_0px_#2d2d2d]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-marker-blue text-white border-[3px] border-pencil font-patrick font-bold text-lg wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-marker-blue/90 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none active:shadow-none transition-all disabled:opacity-50"
            >
              {isSearching ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
          
          <p className="text-lg text-pencil/70 mb-4 font-patrick font-bold italic border-l-[3px] border-pencil pl-3">
            Hoặc kéo thả / bấm trực tiếp vào bản đồ để chọn vị trí.
          </p>
          
          <MapWithNoSSR
            initialPosition={initialPosition}
            searchedPosition={searchedPosition}
            onLocationSelect={(lat, lng) => setSelectedPos({ lat, lng })}
          />
        </div>
        
        <div className="p-5 border-t-[3px] border-pencil border-dashed flex justify-end gap-4 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-3 border-[3px] border-pencil bg-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] font-bold font-patrick text-lg text-pencil hover:bg-muted-paper transition-all -rotate-1"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPos}
            className="px-6 py-3 border-[3px] border-pencil bg-marker-red wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] font-bold font-patrick text-lg text-white hover:bg-marker-red/90 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1 flex items-center gap-2 disabled:opacity-50"
          >
            <MapPin size={20} /> Xác nhận vị trí
          </button>
        </div>
      </div>
    </div>
  );
}
