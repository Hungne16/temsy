"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Move, ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

interface StampEditorProps {
  imageUrl: string;
  onCropSuccess: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const RATIOS = [
  { label: "1:1", value: 1, w: 1, h: 1 },
  { label: "3:4", value: 3 / 4, w: 3, h: 4 },
  { label: "4:3", value: 4 / 3, w: 4, h: 3 },
];

export function StampEditor({ imageUrl, onCropSuccess, onCancel }: StampEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ratio, setRatio] = useState(RATIOS[0]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isStamping, setIsStamping] = useState(false);

  // drag state
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Image natural size
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Frame dimensions (displayed)
  const FRAME_W = 280;
  const FRAME_H = Math.round(FRAME_W / ratio.value);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      // Fit image to frame initially (cover)
      const fitScale = Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Re-fit when ratio changes
  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const newH = Math.round(FRAME_W / ratio.value);
    const fitScale = Math.max(FRAME_W / img.naturalWidth, newH / img.naturalHeight);
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  // Draw preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (FRAME_W - drawW) / 2 + offset.x;
    const y = (FRAME_H - drawH) / 2 + offset.y;

    ctx.drawImage(img, x, y, drawW, drawH);
  }, [scale, offset, FRAME_W, FRAME_H, imgLoaded, ratio]);

  // ── Pointer events (mouse + touch) ────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // Wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.2, Math.min(8, prev - e.deltaY * 0.002)));
  }, []);

  // ── Export cropped image ───────────────────────────────────────────────────
  const exportCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    setIsStamping(true);
    
    // Play sound if you have one, wait for animation
    setTimeout(() => {
      // Export at 2× for quality
      const EX = 2;
      const outW = FRAME_W * EX;
      const outH = FRAME_H * EX;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;

      const drawW = img.naturalWidth * scale * EX;
      const drawH = img.naturalHeight * scale * EX;
      const x = (outW - drawW) / 2 + offset.x * EX;
      const y = (outH - drawH) / 2 + offset.y * EX;

      ctx.drawImage(img, x, y, drawW, drawH);
      onCropSuccess(canvas.toDataURL("image/jpeg", 0.92));
      // Re-enable in case they go back
      setIsStamping(false);
    }, 600); // 600ms corresponds to the animation time
  }, [FRAME_W, FRAME_H, scale, offset, onCropSuccess]);

  const resetView = useCallback(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const fitScale = Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight);
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  }, [FRAME_W, FRAME_H]);

  return (
    <div className="flex flex-col gap-5 w-full max-w-3xl mx-auto select-none">

      {/* ── Hint ── */}
      <div className="flex items-center gap-2 justify-center">
        <Move size={14} className="text-pencil/50" />
        <p className="text-sm font-patrick text-pencil/50">Kéo để căn chỉnh · Cuộn để phóng to/thu nhỏ</p>
      </div>

      {/* ── Canvas preview ── */}
      <div className={`flex justify-center ${isStamping ? "animate-shake-stamp pointer-events-none" : ""}`}>
        <div
          className="relative rounded-xl overflow-hidden border-[3px] border-pencil shadow-[4px_4px_0_0_#2d2d2d] cursor-grab active:cursor-grabbing"
          style={{ width: FRAME_W, height: FRAME_H, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <canvas
            ref={canvasRef}
            width={FRAME_W}
            height={FRAME_H}
            style={{ display: "block", width: FRAME_W, height: FRAME_H }}
          />
          {/* Grid overlay */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity ${isStamping ? "opacity-0" : "opacity-100"}`} style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: `${FRAME_W / 3}px ${FRAME_H / 3}px`,
          }} />

          {/* Stamp Animation Overlay */}
          {isStamping && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="w-[120px] h-[120px] border-[5px] border-marker-red rounded-full flex flex-col items-center justify-center animate-stamp bg-white/20 backdrop-blur-[1px]">
                <div className="w-[100px] h-[100px] border-[3px] border-marker-red border-dashed rounded-full flex items-center justify-center">
                   <span className="text-marker-red font-kalam font-bold text-2xl tracking-widest uppercase rotate-[-5deg]">Temsy</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-white border-[3px] border-pencil shadow-[3px_3px_0_0_#2d2d2d] rounded-xl p-4 flex flex-col gap-4">

        {/* Aspect ratio */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold font-patrick text-pencil/60 uppercase tracking-wider w-16">Tỉ lệ</span>
          <div className="flex gap-2">
            {RATIOS.map(r => (
              <button
                key={r.label}
                onClick={() => setRatio(r)}
                className={`px-4 py-1.5 text-sm font-bold font-patrick rounded-lg border-2 transition-all ${
                  ratio.label === r.label
                    ? "border-pencil bg-pencil text-white shadow-[2px_2px_0_0_rgba(45,45,45,.4)]"
                    : "border-pencil/30 bg-white text-pencil hover:border-pencil/60"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold font-patrick text-pencil/60 uppercase tracking-wider w-16">Thu phóng</span>
          <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1.5 rounded-lg border-2 border-pencil/20 hover:border-pencil/50 transition-colors">
            <ZoomOut size={15} className="text-pencil" />
          </button>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.01}
            value={scale}
            onChange={e => setScale(Number(e.target.value))}
            className="flex-1 accent-marker-red h-1.5 rounded-full cursor-pointer"
          />
          <button onClick={() => setScale(s => Math.min(8, s + 0.1))} className="p-1.5 rounded-lg border-2 border-pencil/20 hover:border-pencil/50 transition-colors">
            <ZoomIn size={15} className="text-pencil" />
          </button>
          <span className="text-xs font-patrick text-pencil/50 w-10 text-right">{Math.round(scale * 100)}%</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t-2 border-pencil/10">
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 font-bold font-patrick text-sm text-pencil/60 hover:text-pencil transition-colors"
            >
              <X size={15} /> Hủy
            </button>
            <button
              onClick={resetView}
              className="flex items-center gap-1.5 px-4 py-2 font-bold font-patrick text-sm border-2 border-pencil/20 rounded-xl hover:border-pencil/50 hover:bg-muted-paper transition-all"
            >
              <RotateCcw size={14} /> Đặt lại
            </button>
          </div>
          <button
            onClick={exportCrop}
            disabled={isStamping}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold font-patrick text-sm text-white rounded-xl border-[3px] border-pencil shadow-[3px_3px_0_0_#2d2d2d] transition-all ${
              isStamping 
                ? "bg-marker-red/70 shadow-none translate-x-[3px] translate-y-[3px]" 
                : "bg-marker-red hover:shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
            }`}
          >
            <Check size={16} /> {isStamping ? "Đang xử lý..." : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}
