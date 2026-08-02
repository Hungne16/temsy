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
            <h3 className="font-bold text-foreground text-base line-clamp-1">{stamp.metadata.title}</h3>
            <p className="text-xs font-medium text-pastel-blue-dark mt-0.5 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {stamp.metadata.location}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-red-500 font-bold shrink-0 bg-red-50 px-2 py-1 rounded-full">
            <Heart size={14} className="fill-red-500" />
            {stamp.likes || 0}
          </div>
        </div>
        
        {stamp.metadata.story && (
          <p className="text-xs font-medium text-foreground/80 mt-3 line-clamp-2 italic border-l-2 border-pastel-blue pl-2 bg-pastel-blue/5 py-1.5 pr-2 rounded-r-md">
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
