"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { CameraView } from "./CameraView";

interface UploaderProps {
  onImageSelected: (imageUrl: string) => void;
}

export function Uploader({ onImageSelected }: UploaderProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const imageUrl = URL.createObjectURL(file);
      onImageSelected(imageUrl);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div
          {...getRootProps()}
          className={`border-[4px] border-dashed wobbly-border p-16 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-marker-red bg-marker-red/10 scale-[1.02]"
              : "border-pencil bg-white hover:bg-muted-paper/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-pencil">
            <div className="w-16 h-16 wobbly-border border-2 border-pencil bg-postit flex items-center justify-center text-pencil shadow-pencil rotate-2">
              <UploadCloud size={32} />
            </div>
            <div>
              <p className="font-bold text-2xl font-kalam text-pencil mb-1">
                {isDragActive ? "Thả ảnh vào đây..." : "Click hoặc kéo thả ảnh"}
              </p>
              <p className="text-lg font-patrick text-pencil/70">Hỗ trợ JPG, PNG, WEBP</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-4 my-4 font-patrick">
          <div className="flex-1 border-b-2 border-dashed border-pencil"></div>
          <span className="text-lg font-bold text-pencil/60">HOẶC</span>
          <div className="flex-1 border-b-2 border-dashed border-pencil"></div>
        </div>

        <button 
          onClick={() => setIsCameraOpen(true)}
          className="flex items-center justify-center gap-3 w-full py-4 bg-postit text-pencil font-bold text-xl font-patrick cursor-pointer border-[3px] border-pencil wobbly-border shadow-pencil hover:bg-marker-blue hover:text-white hover:shadow-pencil-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1"
        >
          <ImageIcon size={24} />
          Chụp ảnh ngay
        </button>
      </div>

      {isCameraOpen && (
        <CameraView 
          onCapture={(dataUrl) => {
            setIsCameraOpen(false);
            onImageSelected(dataUrl);
          }} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
    </>
  );
}
