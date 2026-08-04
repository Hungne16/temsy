/* eslint-disable */
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, X, Save, Edit3, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { updateStampMetadata, deleteStamp } from "@/lib/stampService";
import { motion, AnimatePresence } from "framer-motion";

interface PassportViewProps {
  stamps: any[];
  isOwner?: boolean;
}

export default function PassportView({ stamps, isOwner = false }: PassportViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localStamps, setLocalStamps] = useState(stamps);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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

  const handleDeleteStamp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa tem này vĩnh viễn? Dữ liệu trên web và Firebase đều sẽ bị xóa.")) return;
    try {
      await deleteStamp(id);
      setLocalStamps(prev => prev.filter(s => s.id !== id));
      if (selectedStampId === id) setSelectedStampId(null);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa tem");
    }
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

  // Ensure current page is valid
  const currentProvince = provinces[currentPageIndex] || provinces[0];
  const provinceStamps = groupedStamps[currentProvince];
  const placedStamps = provinceStamps.filter(s => s.metadata?.passportConfig);
  
  // Auto-placement logic if no config exists yet and not in edit mode
  const autoPlacedStamps = !isEditMode ? provinceStamps.map((s, idx) => {
     if (s.metadata?.passportConfig) return s;
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

  const handleNextPage = () => {
    if (currentPageIndex < provinces.length - 1) setCurrentPageIndex(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto py-4 relative">
      {/* Top Bar: Edit Controls & Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2 sticky top-4 z-[100]">
        
        {/* Pagination Navigation */}
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur border-[3px] border-pencil p-2 rounded-full wobbly-border shadow-pencil">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPageIndex === 0}
            className="p-2 bg-muted-paper rounded-full disabled:opacity-30 hover:bg-pencil hover:text-white transition-colors border-2 border-pencil"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="font-patrick font-bold text-lg min-w-[120px] text-center">
            Trang {currentPageIndex + 1} / {provinces.length}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPageIndex === provinces.length - 1}
            className="p-2 bg-muted-paper rounded-full disabled:opacity-30 hover:bg-pencil hover:text-white transition-colors border-2 border-pencil"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Edit Button */}
        {isOwner && (
          <div>
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
      </div>

      {/* Book Container with perspective */}
      <div className="perspective-[1500px] w-full mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProvince}
            initial={{ rotateY: -90, opacity: 0, x: -50 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 90, opacity: 0, x: 50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "left center" }}
            className="w-full"
          >
            {/* The Book Page */}
            <div 
              className={`bg-[#fdfaf6] border-[4px] border-[#3e2723] rounded-r-2xl border-l-[40px] border-l-[#5d4037] shadow-[15px_15px_30px_rgba(0,0,0,0.3),_inset_10px_0_20px_rgba(0,0,0,0.15)] p-6 md:p-10 relative overflow-hidden`}
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
                minHeight: '650px'
              }}
              onClick={() => {
                if (isEditMode) setSelectedStampId(null);
              }}
            >
              {/* Page Binding details */}
              <div className="absolute left-[-35px] top-10 bottom-10 w-2 flex flex-col justify-between opacity-50 z-0">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-full h-1 bg-black/60 rounded-full" />
                 ))}
              </div>

              {/* Passport Page Header */}
              <div className="flex items-center justify-between border-b-[3px] border-dashed border-[#5d4037]/30 pb-4 mb-8">
                <div className="flex items-center gap-2 text-[#5d4037]">
                  <MapPin size={32} />
                  <h3 className="font-kalam font-bold text-4xl">{currentProvince}</h3>
                </div>
                <div className="font-patrick font-bold text-[#5d4037]/40 text-xl border-2 border-[#5d4037]/30 px-4 py-1 rounded-full bg-white/30 backdrop-blur">
                  Khu vực {currentPageIndex + 1}
                </div>
              </div>

              {/* Placed Stamps */}
              {displayStamps.map(stamp => {
                const config = stamp.metadata.passportConfig!;
                const dateObj = stamp.createdAt?.toMillis ? new Date(stamp.createdAt.toMillis()) : new Date();
                const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
                      <div 
                         className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white border-[3px] border-pencil px-3 py-1 shadow-[4px_4px_0_0_#2d2d2d] z-50 rounded-lg min-w-[200px]"
                         onPointerDown={(e) => e.stopPropagation()} // stop dragging when clicking toolbar
                      >
                        <span className="font-patrick font-bold text-pencil text-sm whitespace-nowrap">Góc xoay:</span>
                        <input 
                           type="range" 
                           min="-180" 
                           max="180" 
                           value={config.rotation} 
                           onChange={(e) => updateConfig(stamp.id, { ...config, rotation: Number(e.target.value) })}
                           className="w-24 accent-marker-blue cursor-ew-resize"
                        />
                        <button 
                          onClick={() => { updateConfig(stamp.id, undefined); setSelectedStampId(null); }}
                          className="p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-500 transition-colors ml-auto"
                          title="Cất về khay"
                        >
                          <X size={20} className="text-yellow-600" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteStamp(stamp.id, e)}
                          className="p-1 hover:bg-red-100 rounded border-2 border-transparent hover:border-marker-red transition-colors"
                          title="Xóa tem vĩnh viễn"
                        >
                          <Trash2 size={20} className="text-marker-red" />
                        </button>
                      </div>
                    )}

                    {/* Stamp Visuals */}
                    {isEditMode ? (
                      <div className={`relative ${isSelected ? 'ring-[6px] ring-marker-blue ring-offset-2 ring-offset-transparent shadow-2xl scale-105 transition-transform' : ''}`}>
                         <StampContent stamp={stamp} province={currentProvince} dateStr={dateStr} />
                      </div>
                    ) : (
                      <Link href={`/stamp/${stamp.id}`} className="block relative hover:scale-110 transition-transform z-10 hover:z-50">
                         <StampContent stamp={stamp} province={currentProvince} dateStr={dateStr} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Inventory Tray (Edit Mode Only) */}
      {isEditMode && (
        <div className="mt-8 bg-[#f8f9fa] border-[3px] border-dashed border-pencil p-6 wobbly-border shadow-inner rounded-xl">
          <h4 className="font-bold font-patrick text-pencil mb-4 flex justify-between items-center text-xl">
            <span>Khay tem chưa dán ({unplacedStamps.length})</span>
            <span className="text-base text-pencil/60 hidden sm:block">Nhấn vào tem để dán lên trang hiện tại</span>
          </h4>
          <div className="flex flex-wrap gap-6 min-h-[120px]">
            {unplacedStamps.map(stamp => (
              <div key={stamp.id} className="relative w-28 group">
                <div 
                  onClick={() => {
                     updateConfig(stamp.id, { x: 50, y: 50, rotation: 0 });
                     setSelectedStampId(stamp.id);
                  }}
                  className="w-full cursor-pointer hover:-translate-y-2 transition-transform shadow-lg"
                >
                  <img src={stamp.imageUrl} alt="Stamp" className="w-full aspect-[3/4] object-cover border-2 border-pencil bg-white p-1 pointer-events-none" />
                </div>
                <button 
                  onClick={(e) => handleDeleteStamp(stamp.id, e)}
                  className="absolute -top-2 -right-2 p-1.5 bg-white border-[2px] border-pencil rounded-full text-marker-red opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-red-50 z-10"
                  title="Xóa tem vĩnh viễn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {unplacedStamps.length === 0 && (
              <div className="w-full flex items-center justify-center p-8">
                 <p className="text-lg font-patrick text-pencil/50 italic bg-white px-6 py-2 border-2 border-dashed border-pencil/30 rounded-lg">
                    Bạn đã dán tất cả tem của khu vực này lên trang Hộ chiếu.
                 </p>
              </div>
            )}
          </div>
        </div>
      )}
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
