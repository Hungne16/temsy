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
  );
}
