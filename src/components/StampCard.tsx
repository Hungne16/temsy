"use client";

import { Stamp } from "@/lib/mockData";
import { Heart } from "lucide-react";
import Link from "next/link";

interface StampCardProps {
  stamp: Stamp | any;
}

export function StampCard({ stamp }: StampCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 transition-transform hover:-translate-y-1">
      <Link href={`/stamp/${stamp.id}`} className="block">
        <div className="rounded-2xl overflow-hidden glass hover:shadow-lg transition-all duration-300 p-2 border border-white/40">
            <img 
              src={stamp.imageUrl} 
              alt={stamp.metadata.title || "Stamp"}
              className="w-full h-auto drop-shadow-sm rounded-sm" 
            />
        </div>
      </Link>
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
}
