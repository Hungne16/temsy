"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

interface UploaderProps {
  onImageSelected: (imageUrl: string) => void;
}

export function Uploader({ onImageSelected }: UploaderProps) {
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
    <div className="flex flex-col gap-4 w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-pastel-blue bg-pastel-blue/10"
            : "border-pastel-blue/50 bg-white/50 hover:bg-pastel-blue/5"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-foreground/70">
          <div className="w-16 h-16 rounded-full bg-pastel-blue/20 flex items-center justify-center text-pastel-blue-dark">
            <UploadCloud size={32} />
          </div>
          <div>
            <p className="font-semibold text-lg text-pastel-blue-dark mb-1">
              {isDragActive ? "Thả ảnh vào đây..." : "Click hoặc kéo thả ảnh"}
            </p>
            <p className="text-sm">Hỗ trợ JPG, PNG, WEBP</p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
        <span className="text-sm font-medium text-foreground/50 uppercase tracking-widest">HOẶC</span>
        <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
      </div>

      <label className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-foreground text-background font-bold cursor-pointer hover:bg-foreground/90 transition-transform active:scale-[0.98] shadow-md">
        <ImageIcon size={20} />
        Chụp ảnh ngay
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              onImageSelected(URL.createObjectURL(file));
            }
          }}
        />
      </label>
    </div>
  );
}
