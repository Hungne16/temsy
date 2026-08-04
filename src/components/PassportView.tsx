"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, RotateCcw, RotateCw, X, Save, Edit3 } from "lucide-react";
import { updateStampMetadata } from "@/lib/stampService";

interface PassportViewProps {
  stamps: any[];
  isOwner?: boolean;
}

export default function PassportView({ stamps, isOwner = false }: PassportViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localStamps, setLocalStamps] = useState(stamps);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  // Group stamps by Province/City
  const groupedStamps = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    localStamps.forEach(stamp => {
      const loc = stamp.metadata?.location || "";
      const parts = loc.split(",");
      let province = "Chưa xác định";
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart.toLowerCase() === "việt nam" && parts.length > 1) {
          province = parts[parts.length - 2].trim();
        } else {
          province = lastPart;
        }
      }
      if (!province) province = "Chưa xác định";

      if (!groups[province]) groups[province] = [];
      groups[province].push(stamp);
    });
    
    return groups;
  }, [localStamps]);

  const provinces = Object.keys(groupedStamps);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(localStamps.map(stamp => {
        return updateStampMetadata(stamp.id, stamp.metadata);
      }));
      setIsEditMode(false);
      setSelectedStampId(null);
    } catch (error) {
      console.error("Lỗi lưu hộ chiếu:", error);
    }
    setIsSaving(false);
  };

  const updateConfig = (id: string, config: any) => {
    setLocalStamps(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, metadata: { ...s.metadata, passportConfig: config } };
      }
      return s;
    }));
  };

  if (localStamps.length === 0) {
    return (
      <div className="p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
        Bạn chưa có tem nào trong Hộ chiếu. Hãy tạo tem có gán vị trí nhé!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4 relative">
      {/* Edit Controls */}
      {isOwner && (
        <div className="flex justify-end mb-2 sticky top-4 z-[100]">
          {!isEditMode ? (
            <button 
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-6 py-3 border-[3px] border-pencil bg-marker-blue text-white wobbly-border shadow-pencil font-bold font-patrick text-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rotate-2"
            >
              <Edit3 size={20} />
              Trang trí
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setLocalStamps(stamps); // reset
                  setIsEditMode(false);
                  setSelectedStampId(null);
                }}
                className="px-4 py-2 border-[3px] border-pencil bg-white text-pencil wobbly-border shadow-pencil font-bold font-patrick text-lg hover:bg-muted-paper transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 border-[3px] border-pencil bg-marker-red text-white wobbly-border shadow-pencil font-bold font-patrick text-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {isSaving ? "Đang lưu..." : <><Save size={20} /> Lưu Hộ chiếu</>}
              </button>
            </div>
          )}
        </div>
      )}

      {provinces.map((province, index) => {
        const provinceStamps = groupedStamps[province];
        const placedStamps = provinceStamps.filter(s => s.metadata?.passportConfig);
        
        // Auto-placement logic if no config exists yet and not in edit mode
        const autoPlacedStamps = !isEditMode ? provinceStamps.map((s, idx) => {
           if (s.metadata?.passportConfig) return s;
           // calculate some random grid pos if not placed
           const rot = (idx * 7) % 16 - 8;
           const cols = 3;
           const col = idx % cols;
           const row = Math.floor(idx / cols);
           return {
              ...s,
              metadata: {
                 ...s.metadata,
                 passportConfig: {
                    x: 20 + (col * 30),
                    y: 20 + (row * 30),
                    rotation: rot
                 }
              }
           };
        }) : placedStamps;

        const displayStamps = isEditMode ? placedStamps : autoPlacedStamps;
        const unplacedStamps = isEditMode ? provinceStamps.filter(s => !s.metadata?.passportConfig) : [];

        const pageRotation = index % 2 === 0 ? "rotate-1" : "-rotate-1";
        
        return (
          <div key={province} className="mb-12">
            <div 
              className={`bg-white border-[3px] border-pencil shadow-pencil wobbly-border p-6 md:p-10 ${pageRotation} relative overflow-hidden`}
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
                minHeight: '600px'
              }}
              onClick={() => {
                if (isEditMode) setSelectedStampId(null);
              }}
            >
              {/* Passport Page Header */}
              <div className="flex items-center justify-between border-b-2 border-pencil/30 pb-4 mb-8">
                <div className="flex items-center gap-2 text-marker-red">
                  <MapPin size={28} />
                  <h3 className="font-kalam font-bold text-3xl">{province}</h3>
                </div>
                <div className="font-patrick font-bold text-pencil/40 text-xl border-2 border-pencil/30 px-3 py-1 rounded-full bg-white/50 backdrop-blur">
                  Trang {index + 1}
                </div>
              </div>

              {/* Placed Stamps */}
              {displayStamps.map(stamp => {
                const config = stamp.metadata.passportConfig!;
                const dateObj = stamp.createdAt?.toMillis ? new Date(stamp.createdAt.toMillis()) : new Date();
                const dateStr = format(dateObj, "dd/MM/yy");
                const isSelected = selectedStampId === stamp.id;

                const handlePointerDown = (e: React.PointerEvent) => {
                  if (!isEditMode) return;
                  e.stopPropagation();
                  setSelectedStampId(stamp.id);

                  const parent = e.currentTarget.parentElement;
                  if (!parent) return;
                  const rect = parent.getBoundingClientRect();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startLeft = (config.x / 100) * rect.width;
                  const startTop = (config.y / 100) * rect.height;

                  const onMove = (moveEvent: PointerEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    let newX = ((startLeft + dx) / rect.width) * 100;
                    let newY = ((startTop + dy) / rect.height) * 100;
                    // Clamp to page
                    newX = Math.max(0, Math.min(100, newX));
                    newY = Math.max(0, Math.min(100, newY));

                    updateConfig(stamp.id, { ...config, x: newX, y: newY });
                  };

                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                  };

                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                };

                return (
                  <div 
                    key={stamp.id} 
                    className="absolute z-10 w-32 md:w-40"
                    style={{
                      left: `${config.x}%`,
                      top: `${config.y}%`,
                      transform: `translate(-50%, -50%) rotate(${config.rotation}deg)`,
                      cursor: isEditMode ? 'move' : 'pointer'
                    }}
                    onPointerDown={handlePointerDown}
                  >
                    {/* Toolbar for selected stamp in edit mode */}
                    {isEditMode && isSelected && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-white border-[3px] border-pencil p-1 shadow-[2px_2px_0_0_#2d2d2d] z-50">
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateConfig(stamp.id, { ...config, rotation: config.rotation - 15 }); }}
                          className="p-1 hover:bg-muted-paper"
                          title="Xoay trái"
                        >
                          <RotateCcw size={16} className="text-pencil" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateConfig(stamp.id, { ...config, rotation: config.rotation + 15 }); }}
                          className="p-1 hover:bg-muted-paper"
                          title="Xoay phải"
                        >
                          <RotateCw size={16} className="text-pencil" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateConfig(stamp.id, undefined); setSelectedStampId(null); }}
                          className="p-1 hover:bg-red-100"
                          title="Cất về khay"
                        >
                          <X size={16} className="text-marker-red" />
                        </button>
                      </div>
                    )}

                    {/* Stamp Visuals */}
                    {isEditMode ? (
                      <div className={`relative ${isSelected ? 'ring-4 ring-marker-blue ring-offset-2 ring-offset-transparent' : ''}`}>
                         <StampContent stamp={stamp} province={province} dateStr={dateStr} />
                      </div>
                    ) : (
                      <Link href={`/stamp/${stamp.id}`} className="block relative hover:scale-110 transition-transform z-10 hover:z-50">
                         <StampContent stamp={stamp} province={province} dateStr={dateStr} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inventory Tray (Edit Mode Only) */}
            {isEditMode && (
              <div className="mt-4 bg-[#f8f9fa] border-[3px] border-dashed border-pencil p-4 wobbly-border shadow-inner">
                <h4 className="font-bold font-patrick text-pencil mb-2 flex justify-between items-center text-lg">
                  <span>Khay tem chưa dán ({unplacedStamps.length})</span>
                  <span className="text-sm text-pencil/60 hidden sm:block">Nhấn vào tem để dán lên trang</span>
                </h4>
                <div className="flex flex-wrap gap-4 min-h-[100px]">
                  {unplacedStamps.map(stamp => (
                    <div 
                      key={stamp.id}
                      onClick={() => {
                         updateConfig(stamp.id, { x: 50, y: 50, rotation: 0 });
                         setSelectedStampId(stamp.id);
                      }}
                      className="w-24 cursor-pointer hover:-translate-y-2 transition-transform shadow-md"
                    >
                      <img src={stamp.imageUrl} alt="Stamp" className="w-full aspect-[3/4] object-cover border-2 border-pencil bg-white p-1 pointer-events-none" />
                    </div>
                  ))}
                  {unplacedStamps.length === 0 && (
                    <p className="text-base font-patrick text-pencil/50 italic self-center">Bạn đã dán tất cả tem của khu vực này lên trang Hộ chiếu.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper component for stamp visual
function StampContent({ stamp, province, dateStr }: { stamp: any, province: string, dateStr: string }) {
  return (
    <>
      <div className="border-[3px] border-pencil p-1.5 bg-white wobbly-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="aspect-[3/4] overflow-hidden relative">
          <img 
            src={stamp.imageUrl} 
            alt="Stamp" 
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-1 border-[2px] border-dashed border-white/70 pointer-events-none"></div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 border-[3px] border-marker-red/70 rounded-full flex flex-col items-center justify-center rotate-12 opacity-80 pointer-events-none mix-blend-multiply bg-white/20 backdrop-blur-[1px]">
        <span className="font-bold font-kalam text-[10px] text-marker-red/80 uppercase tracking-tighter leading-tight text-center">
          Temsy<br/>{province.substring(0, 8)}
        </span>
        <div className="w-12 h-[1px] bg-marker-red/70 my-0.5"></div>
        <span className="font-bold font-patrick text-[12px] text-marker-red/80">
          {dateStr}
        </span>
      </div>
    </>
  );
}
