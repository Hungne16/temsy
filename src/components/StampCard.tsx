"use client";

import { Stamp } from "@/lib/mockData";
import { Heart, MoreVertical, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface StampCardProps {
  stamp: Stamp | any;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showOptions?: boolean;
}

export function StampCard({ stamp, isSelectionMode, isSelected, onToggleSelect, onEdit, onDelete, showOptions = false }: StampCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) onEdit(stamp.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) onDelete(stamp.id);
  };

  const CardContent = (
    <div className={`group relative flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:-translate-x-1 ${isSelected ? 'ring-4 ring-marker-blue rounded-none wobbly-border' : ''}`}>
      {isSelectionMode && (
        <div className={`absolute top-2 left-2 z-10 w-6 h-6 border-[3px] flex items-center justify-center transition-colors wobbly-border ${isSelected ? 'bg-marker-blue border-pencil text-white' : 'bg-white border-pencil text-transparent'}`}>
          {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
      )}
      
      {showOptions && !isSelectionMode && (
        <div className="absolute top-2 right-2 z-20" ref={menuRef}>
          <button 
            onClick={handleMenuClick}
            className="w-8 h-8 flex items-center justify-center bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] text-pencil hover:bg-muted-paper transition-colors"
          >
            <MoreVertical size={16} strokeWidth={3} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border-[3px] border-pencil wobbly-border shadow-pencil z-30 py-1 flex flex-col">
              <button onClick={handleEdit} className="flex items-center gap-2 px-3 py-2 text-left font-patrick font-bold text-pencil hover:bg-muted-paper transition-colors text-sm w-full">
                <Edit2 size={14} /> Sửa tem
              </button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-left font-patrick font-bold text-marker-red hover:bg-red-50 transition-colors text-sm w-full border-t-[3px] border-pencil border-dashed">
                <Trash2 size={14} /> Xóa tem
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="block relative">
        <div className={`bg-white border-[3px] border-pencil p-2 wobbly-border shadow-[4px_4px_0px_0px_rgba(45,45,45,0.1)] group-hover:shadow-pencil transition-all duration-300 ${isSelected ? 'opacity-80' : ''}`}>
            <img 
              src={stamp.imageUrl} 
              alt={stamp.metadata.title || "Stamp"}
              className="w-full h-auto drop-shadow-sm" 
            />
        </div>
        {stamp.metadata?.audioData && (
          <div className="absolute bottom-4 right-4 bg-white/90 border-[2px] border-pencil rounded-full p-1 shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-6 z-10 w-8 h-8 flex items-center justify-center text-sm animate-bounce">
            🎵
          </div>
        )}
      </div>
      <div className="flex flex-col px-1">
        <div className="flex items-start justify-between">
          <div className="pr-2">
            <h3 className="font-bold font-kalam text-pencil text-xl leading-tight line-clamp-1">{stamp.metadata.title}</h3>
            <p className="text-sm font-bold font-patrick text-pencil/70 mt-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {stamp.metadata.location}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-marker-red font-bold font-patrick shrink-0 bg-white border-2 border-pencil px-2 py-1 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-3">
            <Heart size={14} className="fill-marker-red" strokeWidth={3} />
            {stamp.likes || 0}
          </div>
        </div>
        
        {stamp.metadata.story && (
          <p className="text-sm font-bold text-pencil/80 mt-3 line-clamp-2 italic font-patrick border-l-[3px] border-pencil pl-3 bg-muted-paper py-2 pr-2">
            &quot;{stamp.metadata.story}&quot;
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
