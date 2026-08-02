"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Tên các preset filters của CamanJS
const CAMAN_FILTERS = [
  { id: "normal", name: "Gốc" },
  { id: "vintage", name: "Vintage" },
  { id: "lomo", name: "Lomo" },
  { id: "clarity", name: "Clarity" },
  { id: "sinCity", name: "Sin City" },
  { id: "sunrise", name: "Sunrise" },
  { id: "crossProcess", name: "Cross Process" },
  { id: "orangePeel", name: "Orange Peel" },
  { id: "love", name: "Love" },
  { id: "grungy", name: "Grungy" },
  { id: "pinhole", name: "Pinhole" },
  { id: "oldBoot", name: "Old Boot" },
  { id: "glowingSun", name: "Glowing Sun" },
  { id: "hazyDays", name: "Hazy Days" },
  { id: "nostalgia", name: "Nostalgia" }
];

interface FilterSelectorProps {
  imageUrl: string;
  onFilterSuccess: (filteredUrl: string) => void;
  onCancel: () => void;
}

export function FilterSelector({ imageUrl, onFilterSuccess, onCancel }: FilterSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [camanLoaded, setCamanLoaded] = useState(false);
  const camanInstanceRef = useRef<any>(null);

  // Load CamanJS qua CDN
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Caman) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.1.2/caman.full.min.js";
      script.async = true;
      script.onload = () => setCamanLoaded(true);
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      setCamanLoaded(true);
    }
  }, []);

  // Khởi tạo Canvas với ảnh gốc
  useEffect(() => {
    if (camanLoaded && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      img.onload = () => {
        // Thu phóng ảnh cho vừa màn hình preview để xử lý nhanh hơn nếu cần
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Khởi tạo Caman object
        const Caman = (window as any).Caman;
        Caman(canvas, function(this: any) {
          camanInstanceRef.current = this;
          // Lưu trạng thái gốc
          this.reloadCanvasData();
        });
      };
    }
  }, [camanLoaded, imageUrl]);

  const applyFilter = (filterId: string) => {
    if (!camanInstanceRef.current || isProcessing) return;
    
    setSelectedFilter(filterId);
    setIsProcessing(true);
    
    const caman = camanInstanceRef.current;
    
    // Trả về ảnh gốc trước khi áp dụng filter mới
    caman.revert(false);
    
    if (filterId === "normal") {
      caman.render(() => {
        setIsProcessing(false);
      });
      return;
    }
    
    // Gọi hàm filter tương ứng
    if (typeof caman[filterId] === "function") {
      caman[filterId]();
      caman.render(() => {
        setIsProcessing(false);
      });
    } else {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (canvasRef.current) {
      // Xuất ảnh sau khi đã filter
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
      onFilterSuccess(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="glass-card flex flex-col md:flex-row gap-6 p-6">
        
        {/* Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-black/5 rounded-2xl relative overflow-hidden" ref={containerRef}>
          {!camanLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="w-8 h-8 border-4 border-pastel-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="px-4 py-2 bg-white rounded-full shadow-md font-medium text-pastel-blue-dark text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-pastel-blue-dark border-t-transparent rounded-full animate-spin"></div>
                Đang áp dụng...
              </div>
            </div>
          )}
          
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-[500px] object-contain shadow-md rounded-lg"
          ></canvas>
        </div>

        {/* Filter List */}
        <div className="w-full md:w-[280px] flex flex-col gap-4">
          <h3 className="font-bold text-lg">Bộ lọc màu</h3>
          <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] flex flex-col gap-2 filter-scrollbar">
            {CAMAN_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => applyFilter(filter.id)}
                disabled={isProcessing}
                className={`flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                  selectedFilter === filter.id
                    ? "bg-pastel-blue text-white shadow-md font-semibold"
                    : "bg-white/60 hover:bg-white text-foreground/80 font-medium disabled:opacity-50"
                }`}
              >
                <span>{filter.name}</span>
                {selectedFilter === filter.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card flex items-center justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-medium text-foreground/70 hover:bg-white/50 transition-colors"
        >
          Quay lại
        </button>
        <button 
          onClick={handleNext}
          disabled={isProcessing || !camanLoaded}
          className="px-8 py-2.5 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          Tiếp tục
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .filter-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .filter-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .filter-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
