"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type StampStyle = "vintage" | "modern" | "polaroid" | "minimal" | "postage" | "film" | "wavy" | "ripped" | "template_1" | "template_2" | "template_3" | "template_4" | "template_5";

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
    
    // Tạo viền răng cưa tiêu chuẩn
    const defaultStampEdge = {
      WebkitMask: "radial-gradient(5px at 50% 100%, transparent 50%, #000 52%) repeat-x, radial-gradient(5px at 50% 0%, transparent 50%, #000 52%) repeat-x, radial-gradient(5px at 100% 50%, transparent 50%, #000 52%) repeat-y, radial-gradient(5px at 0% 50%, transparent 50%, #000 52%) repeat-y, linear-gradient(#000, #000)",
      WebkitMaskSize: "16px 8px, 16px 8px, 8px 16px, 8px 16px, calc(100% - 16px) calc(100% - 16px)",
      WebkitMaskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      WebkitMaskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
      mask: "radial-gradient(5px at 50% 100%, transparent 50%, #000 52%) repeat-x, radial-gradient(5px at 50% 0%, transparent 50%, #000 52%) repeat-x, radial-gradient(5px at 100% 50%, transparent 50%, #000 52%) repeat-y, radial-gradient(5px at 0% 50%, transparent 50%, #000 52%) repeat-y, linear-gradient(#000, #000)",
      maskSize: "16px 8px, 16px 8px, 8px 16px, 8px 16px, calc(100% - 16px) calc(100% - 16px)",
      maskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      maskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
    };

    // Răng cưa nhỏ nhắn kiểu bưu chính
    const postageEdge = {
      WebkitMask: "radial-gradient(3px at 50% 100%, transparent 50%, #000 52%) repeat-x, radial-gradient(3px at 50% 0%, transparent 50%, #000 52%) repeat-x, radial-gradient(3px at 100% 50%, transparent 50%, #000 52%) repeat-y, radial-gradient(3px at 0% 50%, transparent 50%, #000 52%) repeat-y, linear-gradient(#000, #000)",
      WebkitMaskSize: "10px 5px, 10px 5px, 5px 10px, 5px 10px, calc(100% - 10px) calc(100% - 10px)",
      WebkitMaskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      WebkitMaskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
      mask: "radial-gradient(3px at 50% 100%, transparent 50%, #000 52%) repeat-x, radial-gradient(3px at 50% 0%, transparent 50%, #000 52%) repeat-x, radial-gradient(3px at 100% 50%, transparent 50%, #000 52%) repeat-y, radial-gradient(3px at 0% 50%, transparent 50%, #000 52%) repeat-y, linear-gradient(#000, #000)",
      maskSize: "10px 5px, 10px 5px, 5px 10px, 5px 10px, calc(100% - 10px) calc(100% - 10px)",
      maskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      maskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
    };

    // Cuộn phim có lỗ 2 bên viền dọc
    const filmEdge = {
      WebkitMask: "linear-gradient(#000, #000), linear-gradient(to bottom, transparent 4px, #000 4px, #000 12px, transparent 12px) repeat-y, linear-gradient(to bottom, transparent 4px, #000 4px, #000 12px, transparent 12px) repeat-y",
      WebkitMaskSize: "calc(100% - 24px) 100%, 8px 16px, 8px 16px",
      WebkitMaskPosition: "center, 4px 0, calc(100% - 4px) 0",
      WebkitMaskRepeat: "no-repeat, repeat-y, repeat-y",
      WebkitMaskComposite: "source-out",
      mask: "linear-gradient(#000, #000), linear-gradient(to bottom, transparent 4px, #000 4px, #000 12px, transparent 12px) repeat-y, linear-gradient(to bottom, transparent 4px, #000 4px, #000 12px, transparent 12px) repeat-y",
      maskSize: "calc(100% - 24px) 100%, 8px 16px, 8px 16px",
      maskPosition: "center, 4px 0, calc(100% - 4px) 0",
      maskRepeat: "no-repeat, repeat-y, repeat-y",
      maskComposite: "exclude",
    };

    // Lượn sóng
    const wavyEdge = {
      WebkitMask: "radial-gradient(6px at 50% 100%, #000 50%, transparent 52%) repeat-x, radial-gradient(6px at 50% 0%, #000 50%, transparent 52%) repeat-x, radial-gradient(6px at 100% 50%, #000 50%, transparent 52%) repeat-y, radial-gradient(6px at 0% 50%, #000 50%, transparent 52%) repeat-y, linear-gradient(#000, #000)",
      WebkitMaskSize: "16px 8px, 16px 8px, 8px 16px, 8px 16px, calc(100% - 16px) calc(100% - 16px)",
      WebkitMaskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      WebkitMaskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
      mask: "radial-gradient(6px at 50% 100%, #000 50%, transparent 52%) repeat-x, radial-gradient(6px at 50% 0%, #000 50%, transparent 52%) repeat-x, radial-gradient(6px at 100% 50%, #000 50%, transparent 52%) repeat-y, radial-gradient(6px at 0% 50%, #000 50%, transparent 52%) repeat-y, linear-gradient(#000, #000)",
      maskSize: "16px 8px, 16px 8px, 8px 16px, 8px 16px, calc(100% - 16px) calc(100% - 16px)",
      maskPosition: "0 100%, 0 0, 100% 0, 0 0, center",
      maskRepeat: "repeat-x, repeat-x, repeat-y, repeat-y, no-repeat",
    };

    let activeMask = undefined;
    if (style === "vintage" || style === "modern") activeMask = defaultStampEdge;
    if (style === "postage") activeMask = postageEdge;
    if (style === "film") activeMask = filmEdge;
    if (style === "wavy") activeMask = wavyEdge;
    if (style === "ripped") {
      activeMask = {
        WebkitMask: `
          linear-gradient(#000 0 0) padding-box,
          conic-gradient(from 135deg at 50% 0, transparent 90deg, #000 0) 0 0 / 10px 10px repeat-x,
          conic-gradient(from -45deg at 50% 100%, transparent 90deg, #000 0) 0 100% / 10px 10px repeat-x,
          conic-gradient(from 45deg at 100% 50%, transparent 90deg, #000 0) 100% 0 / 10px 10px repeat-y,
          conic-gradient(from 225deg at 0 50%, transparent 90deg, #000 0) 0 0 / 10px 10px repeat-y
        `,
        mask: `
          linear-gradient(#000 0 0) padding-box,
          conic-gradient(from 135deg at 50% 0, transparent 90deg, #000 0) 0 0 / 10px 10px repeat-x,
          conic-gradient(from -45deg at 50% 100%, transparent 90deg, #000 0) 0 100% / 10px 10px repeat-x,
          conic-gradient(from 45deg at 100% 50%, transparent 90deg, #000 0) 100% 0 / 10px 10px repeat-y,
          conic-gradient(from 225deg at 0 50%, transparent 90deg, #000 0) 0 0 / 10px 10px repeat-y
        `
      };
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "relative bg-white flex flex-col drop-shadow-[4px_4px_0px_#2d2d2d]",
          !style.startsWith("template_") && "p-4",
          style === "vintage" && "bg-[#f4ebd0] text-[#5c4a3d]",
          style === "modern" && "bg-white text-black",
          style === "polaroid" && "bg-white p-4 pb-16",
          style === "minimal" && "bg-transparent p-0",
          style === "postage" && "bg-white text-black p-3",
          style === "film" && "bg-[#111] text-white p-6",
          style === "wavy" && "bg-pastel-blue/10 text-pastel-blue-dark p-5",
          style === "ripped" && "bg-[#f5e6d3] text-[#4a3f35] p-5",
          style.startsWith("template_") && "bg-transparent drop-shadow-none p-0",
          className
        )}
        style={!style.startsWith("template_") ? activeMask : undefined}
      >
        <div className={cn(
          "relative w-full overflow-hidden flex items-center justify-center",
          style.startsWith("template_") ? "aspect-square" : "aspect-[3/4] bg-black/5"
        )}>
          {imageUrl ? (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              style.startsWith("template_") ? "p-[8%]" : ""
            )}>
              <img 
                src={imageUrl} 
                alt="Stamp" 
                className={cn(
                  "w-full h-full object-cover",
                  style === "vintage" && "sepia-[.3] contrast-125",
                  style === "modern" && "saturate-150",
                  style === "postage" && "brightness-110",
                  style === "film" && "contrast-125 saturate-50"
                )}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/30">
              Chưa có ảnh
            </div>
          )}
          
          {/* Custom Template Overlay */}
          {style.startsWith("template_") && (
            <img 
              src={`/templates/${style}.png`} 
              alt="Template" 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[4px_4px_0px_rgba(45,45,45,0.4)]" 
            />
          )}
          
          {/* Overlay Texture (only for non-template styles) */}
          {!style.startsWith("template_") && (
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply" 
                 style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}>
            </div>
          )}
        </div>

        {/* Metadata section */}
        {metadata && style !== "minimal" && (
          <div className={cn(
            "mt-3 flex flex-col",
            style === "polaroid" || style === "film" ? "items-center" : "items-start"
          )}>
            <div className="font-bold text-lg tracking-tight uppercase">{metadata.title || "Untitled"}</div>
            <div className="text-xs font-mono opacity-70 mt-1 uppercase flex justify-between w-full">
              <span>{metadata.location || "Unknown location"}</span>
              <span>{metadata.date || "Unknown date"}</span>
            </div>
          </div>
        )}
        
        {/* Value/Postage Mark */}
        {(style === "vintage" || style === "modern" || style === "postage") && (
          <div className="absolute top-6 right-6 font-mono text-2xl font-bold opacity-80 mix-blend-difference text-white drop-shadow-md">
            100
          </div>
        )}
      </div>
    );
  }
);

StampPreview.displayName = "StampPreview";
