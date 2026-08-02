"use client";

import dynamic from "next/dynamic";
import { X, MapPin } from "lucide-react";
import { useState } from "react";

const MapWithNoSSR = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-pastel-blue/10 flex flex-col items-center justify-center animate-pulse">
      <MapPin size={32} className="text-pastel-blue-dark/30 mb-2" />
      <p className="text-foreground/50 text-sm font-medium">Đang tải bản đồ...</p>
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

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPos) {
      onConfirm(selectedPos);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Chọn vị trí trên bản đồ</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-gray-50">
          <p className="text-sm text-foreground/60 mb-3 font-medium">
            Kéo thả hoặc bấm vào bản đồ để ghim vị trí kỉ niệm của bạn.
          </p>
          <MapWithNoSSR
            initialPosition={initialPosition}
            onLocationSelect={(lat, lng) => setSelectedPos({ lat, lng })}
          />
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-foreground/70 hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPos}
            className="px-5 py-2.5 rounded-xl font-medium bg-pastel-blue text-white hover:bg-pastel-blue-dark transition-colors disabled:opacity-50"
          >
            Xác nhận vị trí
          </button>
        </div>
      </div>
    </div>
  );
}
