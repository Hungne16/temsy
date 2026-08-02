"use client";

import { Stamp } from "@/lib/mockData";
import { Heart } from "lucide-react";
import Link from "next/link";

interface StampCardProps {
  stamp: Stamp | any;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function StampCard({ stamp, isSelectionMode, isSelected, onToggleSelect }: StampCardProps) {
  const CardContent = (
    <div className={`group relative flex flex-col gap-3 transition-transform hover:-translate-y-1 ${isSelected ? 'ring-2 ring-pastel-blue rounded-2xl' : ''}`}>
      {isSelectionMode && (
        <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-pastel-blue border-pastel-blue text-white' : 'bg-black/20 border-white/80'}`}>
          {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
      )}
      
      <div className="block">
        <div className={`rounded-2xl overflow-hidden glass hover:shadow-lg transition-all duration-300 p-2 border border-white/40 ${isSelected ? 'opacity-80' : ''}`}>
            <img 
              src={stamp.imageUrl} 
              alt={stamp.metadata.title || "Stamp"}
              className="w-full h-auto drop-shadow-sm rounded-sm" 
            />
        </div>
      </div>
      <div className="flex flex-col px-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground/90 line-clamp-1">{stamp.metadata.title}</h3>
            <p className="text-xs text-foreground/50">{stamp.metadata.location}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground/50 font-medium shrink-0">
            <Heart size={14} className="group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
            {stamp.likes || 0}
          </div>
        </div>
        
        {stamp.metadata.story && (
          <p className="text-xs text-foreground/70 mt-2 line-clamp-2 italic border-l-2 border-pastel-blue pl-2">
            "{stamp.metadata.story}"
          </p>
        )}
      </div>
    </div>
  );

  if (isSelectionMode) {
    return (
      <div onClick={() => onToggleSelect && onToggleSelect(stamp.id)} className="cursor-pointer">
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={`/stamp/${stamp.id}`} className="block">
      {CardContent}
    </Link>
  );
}
