"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type StampStyle = "vintage" | "modern" | "polaroid" | "minimal";

interface StampPreviewProps {
  imageUrl: string;
  style?: StampStyle;
  className?: string;
  metadata?: {
    title?: string;
    location?: string;
    date?: string;
  };
}

export const StampPreview = forwardRef<HTMLDivElement, StampPreviewProps>(
  ({ imageUrl, style = "vintage", className, metadata }, ref) => {
    
    // CSS trick for postage stamp edge using radial-gradient mask
    const stampEdgeStyle = {
      maskImage: "radial-gradient(circle at 12px 12px, transparent 12px, black 13px)",
      maskSize: "24px 24px",
      maskPosition: "-12px -12px",
      WebkitMaskImage: "radial-gradient(circle at 6px 6px, transparent 4px, black 4.5px)",
      WebkitMaskSize: "16px 16px",
      WebkitMaskPosition: "-4px -4px",
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "relative bg-white shadow-xl flex flex-col p-4",
          style === "vintage" && "bg-[#f4ebd0] text-[#5c4a3d]",
          style === "modern" && "bg-white text-black",
          style === "polaroid" && "bg-white p-4 pb-16",
          style === "minimal" && "bg-transparent p-0",
          className
        )}
        style={style !== "minimal" ? stampEdgeStyle : undefined}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Stamp" 
              className={cn(
                "w-full h-full object-cover",
                style === "vintage" && "sepia-[.3] contrast-125",
                style === "modern" && "saturate-150"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/30">
              Chưa có ảnh
            </div>
          )}
          
          {/* Overlay Texture */}
          <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply" 
               style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}>
          </div>
        </div>

        {/* Metadata section */}
        {metadata && style !== "minimal" && (
          <div className={cn(
            "mt-3 flex flex-col",
            style === "polaroid" ? "items-center" : "items-start"
          )}>
            <div className="font-bold text-lg tracking-tight uppercase">{metadata.title || "Untitled"}</div>
            <div className="text-xs font-mono opacity-70 mt-1 uppercase flex justify-between w-full">
              <span>{metadata.location || "Unknown location"}</span>
              <span>{metadata.date || "Unknown date"}</span>
            </div>
          </div>
        )}
        
        {/* Value/Postage Mark for vintage/modern */}
        {(style === "vintage" || style === "modern") && (
          <div className="absolute top-6 right-6 font-mono text-2xl font-bold opacity-80 mix-blend-difference text-white drop-shadow-md">
            100
          </div>
        )}
      </div>
    );
  }
);

StampPreview.displayName = "StampPreview";
