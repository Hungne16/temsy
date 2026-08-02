"use client";

import React, { useRef, useState } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface StampEditorProps {
  imageUrl: string;
  onCropSuccess: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function StampEditor({ imageUrl, onCropSuccess, onCancel }: StampEditorProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [aspectRatio, setAspectRatio] = useState(3 / 4);

  const getCropData = () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      const croppedImage = cropperRef.current?.cropper.getCroppedCanvas().toDataURL();
      onCropSuccess(croppedImage);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="glass-card overflow-hidden">
        <Cropper
          ref={cropperRef}
          style={{ height: 400, width: "100%" }}
          zoomTo={0.5}
          initialAspectRatio={3 / 4}
          aspectRatio={aspectRatio}
          src={imageUrl}
          viewMode={1}
          minCropBoxHeight={100}
          minCropBoxWidth={100}
          background={false}
          responsive={true}
          autoCropArea={1}
          checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
          guides={true}
        />
      </div>

      <div className="glass-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setAspectRatio(1)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${aspectRatio === 1 ? "bg-pastel-blue text-white" : "bg-white/50 hover:bg-white"}`}
          >
            1:1 Vuông
          </button>
          <button 
            onClick={() => setAspectRatio(3 / 4)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${aspectRatio === 3/4 ? "bg-pastel-blue text-white" : "bg-white/50 hover:bg-white"}`}
          >
            3:4 Dọc
          </button>
          <button 
            onClick={() => setAspectRatio(4 / 3)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${aspectRatio === 4/3 ? "bg-pastel-blue text-white" : "bg-white/50 hover:bg-white"}`}
          >
            4:3 Ngang
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-xl font-medium text-foreground/70 hover:bg-white/50 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={getCropData}
            className="px-6 py-2 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
