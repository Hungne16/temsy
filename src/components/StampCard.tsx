"use client";

import { Stamp } from "@/lib/mockData";
import { StampPreview } from "./StampPreview";
import { Heart } from "lucide-react";
import Link from "next/link";

interface StampCardProps {
  stamp: Stamp;
}

export function StampCard({ stamp }: StampCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 transition-transform hover:-translate-y-1">
      <Link href={`/stamp/${stamp.id}`} className="block">
        <div className="rounded-2xl overflow-hidden glass hover:shadow-lg transition-all duration-300 p-2 border border-white/40">
          <div className="w-full relative pointer-events-none transform scale-95 origin-top group-hover:scale-100 transition-transform">
             {/* We use StampPreview but scaled down or just as a display */}
            <StampPreview 
              imageUrl={stamp.imageUrl} 
              style={stamp.style} 
              metadata={stamp.metadata}
              className="text-[0.6rem]" // scale down text visually
            />
          </div>
        </div>
      </Link>
      <div className="flex items-start justify-between px-1">
        <div>
          <h3 className="font-semibold text-foreground/90 line-clamp-1">{stamp.metadata.title}</h3>
          <p className="text-xs text-foreground/50">{stamp.metadata.location}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-foreground/50 font-medium">
          <Heart size={14} className="group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
          {stamp.likes}
        </div>
      </div>
    </div>
  );
}
