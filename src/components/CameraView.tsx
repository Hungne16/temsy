"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, RefreshCcw } from "lucide-react";

interface CameraViewProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setErrorMsg("");

      // Check for multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);

    } catch (err: any) {
      console.error("Camera error:", err);
      setErrorMsg("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const switchCamera = () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video source
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    // If using front camera, mirror the canvas horizontally
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Delay slightly to show flash before switching
    setTimeout(() => {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      // Stop tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onCapture(dataUrl);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      {/* Flash Effect */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-[6000] animate-out fade-out duration-300 pointer-events-none" />
      )}

      {/* Top Controls */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={() => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            onClose();
          }}
          className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border-2 border-white/40 wobbly-border"
        >
          <X size={20} />
        </button>

        {hasMultipleCameras && (
          <button 
            onClick={switchCamera}
            className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border-2 border-white/40 wobbly-border"
          >
            <RefreshCcw size={20} />
          </button>
        )}
      </div>

      {errorMsg ? (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-kalam">Lỗi Máy Ảnh</h2>
          <p className="text-white/70 mb-6 font-patrick">{errorMsg}</p>
          <button 
            onClick={() => {
              if (stream) stream.getTracks().forEach(t => t.stop());
              onClose();
            }}
            className="px-6 py-2 bg-white text-black font-bold font-patrick rounded-xl border-2 border-transparent wobbly-border"
          >
            Quay lại
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full max-h-[85vh] md:w-[450px] md:h-[800px] md:rounded-[3rem] overflow-hidden bg-zinc-900 border-[6px] border-zinc-800 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Grid Overlay for Composition */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="w-full h-1/3 border-b border-white/50" />
            <div className="w-full h-1/3 border-b border-white/50" />
            <div className="absolute top-0 bottom-0 left-1/3 border-l border-white/50" />
            <div className="absolute top-0 bottom-0 left-2/3 border-l border-white/50" />
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 p-8 pb-12 flex items-center justify-center z-10 bg-gradient-to-t from-black/80 to-transparent">
        <button 
          onClick={takePhoto}
          disabled={!!errorMsg}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-[6px] border-zinc-300 hover:scale-95 active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] group disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="w-16 h-16 border-2 border-zinc-800/20 rounded-full flex items-center justify-center">
            <Camera size={28} className="text-zinc-800 opacity-80 group-hover:opacity-100" />
          </div>
        </button>
      </div>
    </div>
  );
}
