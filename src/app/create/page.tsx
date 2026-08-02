"use client";

import { useState, useRef, useCallback } from "react";
import { Uploader } from "@/components/Uploader";
import { StampEditor } from "@/components/StampEditor";
import { StampPreview, StampStyle } from "@/components/StampPreview";
import { toPng } from "html-to-image";
import { Download, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CreateStampPage() {
  const [step, setStep] = useState<"upload" | "crop" | "style">("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [stampStyle, setStampStyle] = useState<StampStyle>("vintage");
  const [metadata, setMetadata] = useState({ title: "", location: "", date: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  const stampRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  
  const handleImageSelected = (url: string) => {
    setOriginalImage(url);
    setStep("crop");
  };

  const handleCropSuccess = (croppedUrl: string) => {
    setCroppedImage(croppedUrl);
    
    const today = new Date().toLocaleDateString("vi-VN");
    setMetadata({
      title: "Kỷ niệm mới",
      location: "Việt Nam",
      date: today
    });
    
    setStep("style");
  };

  const handleDownload = useCallback(() => {
    if (stampRef.current === null) return;
    setIsSaving(true);
    toPng(stampRef.current, { cacheBust: true, pixelRatio: 3 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `temsy-stamp-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Oops, something went wrong!", err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [stampRef]);

  const handleSaveToCollection = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để lưu tem vào Bộ sưu tập!");
      return;
    }
    
    if (stampRef.current === null) return;
    setIsSaving(true);
    
    try {
      // Dùng html-to-image render ra file ảnh chất lượng cao
      const dataUrl = await toPng(stampRef.current, { cacheBust: true, pixelRatio: 3 });
      
      // Import động hàm uploadStamp để giảm size ban đầu
      const { uploadStamp } = await import("@/lib/stampService");
      
      await uploadStamp(dataUrl, stampStyle, metadata);
      alert("Đã lưu thành công vào Bộ sưu tập trên đám mây!");
    } catch (error: any) {
      console.error(error);
      alert("Có lỗi xảy ra: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen flex flex-col items-center">
      
      {step === "upload" && (
        <div className="w-full max-w-2xl text-center pt-10">
          <h1 className="text-3xl font-bold mb-4">Tạo Tem Mới</h1>
          <p className="text-foreground/60 mb-8">
            Kéo thả hoặc tải ảnh lên để bắt đầu biến khoảnh khắc của bạn thành một con tem.
          </p>
          <Uploader onImageSelected={handleImageSelected} />
        </div>
      )}

      {step === "crop" && originalImage && (
        <div className="w-full max-w-3xl pt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Cắt ảnh</h2>
            <p className="text-foreground/60 text-sm mt-1">Chọn khung hình đẹp nhất cho con tem của bạn.</p>
          </div>
          <StampEditor 
            imageUrl={originalImage} 
            onCropSuccess={handleCropSuccess} 
            onCancel={() => {
              setOriginalImage(null);
              setStep("upload");
            }}
          />
        </div>
      )}

      {step === "style" && croppedImage && (
        <div className="w-full max-w-5xl pt-6 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left: Preview */}
          <div className="flex-1 w-full flex items-center justify-center p-8 glass-card">
            <div className="w-full max-w-sm">
              <StampPreview 
                ref={stampRef}
                imageUrl={croppedImage} 
                style={stampStyle}
                metadata={metadata}
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full md:w-[400px] flex flex-col gap-6">
            <div className="glass-card flex flex-col gap-5">
              <h3 className="font-bold text-xl">Tuỳ chỉnh</h3>
              
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Phong cách Tem</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["vintage", "modern", "polaroid", "minimal"] as StampStyle[]).map((s) => (
                    <button 
                      key={s}
                      onClick={() => setStampStyle(s)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${
                        stampStyle === s 
                          ? "border-pastel-blue bg-pastel-blue text-white" 
                          : "border-white/40 bg-white/50 hover:bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Thông tin (Metadata)</label>
                <input 
                  type="text" 
                  value={metadata.title}
                  onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                  placeholder="Tiêu đề"
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={metadata.location}
                    onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                    placeholder="Địa điểm"
                  />
                  <input 
                    type="text" 
                    value={metadata.date}
                    onChange={(e) => setMetadata({...metadata, date: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                    placeholder="Ngày"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleDownload}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-white border border-white/40 hover:bg-gray-50 transition-colors"
              >
                <Download size={20} />
                Tải xuống
              </button>
              <button 
                onClick={handleSaveToCollection}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <Save size={20} />
                Lưu vào Album
              </button>
            </div>
            
            <button 
              onClick={() => setStep("crop")}
              className="text-sm text-foreground/60 hover:text-foreground font-medium underline-offset-4 hover:underline text-center mt-2"
            >
              Quay lại cắt ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
