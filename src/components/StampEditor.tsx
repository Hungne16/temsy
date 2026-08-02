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
      <div className="bg-white border-[3px] border-pencil wobbly-border shadow-pencil p-2 overflow-hidden -rotate-1">
        <Cropper
          ref={cropperRef}
          style={{ height: 400, width: "100%", borderRadius: "10px" }}
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

      <div className="bg-white border-[3px] border-pencil wobbly-border-md shadow-pencil p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 rotate-1">
        <div className="flex gap-2">
          <button 
            onClick={() => setAspectRatio(1)}
            className={`px-4 py-2 font-bold font-patrick transition-all wobbly-border ${aspectRatio === 1 ? "border-2 border-pencil bg-marker-red text-white shadow-[2px_2px_0px_0px_#2d2d2d]" : "border-2 border-pencil bg-white text-pencil hover:bg-muted-paper"}`}
          >
            1:1 Vuông
          </button>
          <button 
            onClick={() => setAspectRatio(3 / 4)}
            className={`px-4 py-2 font-bold font-patrick transition-all wobbly-border ${aspectRatio === 3/4 ? "border-2 border-pencil bg-marker-red text-white shadow-[2px_2px_0px_0px_#2d2d2d]" : "border-2 border-pencil bg-white text-pencil hover:bg-muted-paper"}`}
          >
            3:4 Dọc
          </button>
          <button 
            onClick={() => setAspectRatio(4 / 3)}
            className={`px-4 py-2 font-bold font-patrick transition-all wobbly-border ${aspectRatio === 4/3 ? "border-2 border-pencil bg-marker-red text-white shadow-[2px_2px_0px_0px_#2d2d2d]" : "border-2 border-pencil bg-white text-pencil hover:bg-muted-paper"}`}
          >
            4:3 Ngang
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 font-bold text-lg font-patrick text-pencil transition-all hover:bg-muted-paper/50 underline decoration-wavy underline-offset-4"
          >
            Hủy
          </button>
          <button 
            onClick={getCropData}
            className="px-6 py-2 font-bold text-lg font-patrick transition-all border-[3px] border-pencil bg-white wobbly-border shadow-pencil hover:bg-marker-blue hover:text-white hover:shadow-pencil-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
