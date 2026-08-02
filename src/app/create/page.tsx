"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Uploader } from "@/components/Uploader";
import { StampEditor } from "@/components/StampEditor";
import { StampPreview, StampStyle } from "@/components/StampPreview";
import { toJpeg, toPng } from "html-to-image";
import { Download, Save, MapPin, Globe, Lock, Map as MapIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { FilterSelector } from "@/components/FilterSelector";
import LocationPickerModal from "@/components/LocationPickerModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { StampMetadata } from "@/lib/stampService";

export default function CreateStampPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "crop" | "filter" | "style">("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [stampStyle, setStampStyle] = useState<StampStyle>("vintage");
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  const [metadata, setMetadata] = useState<StampMetadata>({ 
    title: "", 
    location: "", 
    date: "",
    story: "",
    coordinates: undefined
  });
  const [isPublic, setIsPublic] = useState(true);
  const [isAutoGPS, setIsAutoGPS] = useState(true);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const stampRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  
  const handleImageSelected = (url: string) => {
    setOriginalImage(url);
    setStep("crop");
  };

  const handleCropSuccess = (croppedUrl: string) => {
    setCroppedImage(croppedUrl);
    
    const today = new Date().toLocaleDateString("vi-VN");
    
    // Tự động lấy tọa độ GPS
    if (isAutoGPS && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMetadata({
            title: "Kỷ niệm mới",
            location: "Đang tải vị trí...",
            date: today,
            story: "",
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          });
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.state || "Việt Nam";
                setMetadata(prev => ({ ...prev, location: city }));
              }
            })
            .catch(() => {
              setMetadata(prev => ({ ...prev, location: "Việt Nam" }));
            });
        },
        (err) => {
          console.error("Lỗi định vị:", err);
          setMetadata({
            title: "Kỷ niệm mới",
            location: "Chưa rõ vị trí",
            date: today,
            story: ""
          });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setMetadata({
        title: "Kỷ niệm mới",
        location: "",
        date: today,
        story: ""
      });
    }
    
    setStep("filter");
  };

  const handleFilterSuccess = (filteredUrl: string) => {
    setFilteredImage(filteredUrl);
    setStep("style");
  };

  const handleMapConfirm = (pos: { lat: number, lng: number }) => {
    setMetadata(prev => ({
      ...prev,
      coordinates: pos,
      location: "Đang tải vị trí..."
    }));
    setIsMapPickerOpen(false);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=14&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.state || "Việt Nam";
          setMetadata(prev => ({ ...prev, location: city }));
        } else {
          setMetadata(prev => ({ ...prev, location: "Vị trí đã chọn" }));
        }
      })
      .catch(() => {
        setMetadata(prev => ({ ...prev, location: "Vị trí đã chọn" }));
      });
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
      if (confirm("Bạn cần đăng nhập để lưu tem vào Bộ sưu tập đám mây. Chuyển đến trang Đăng nhập?")) {
        router.push("/login");
      }
      return;
    }
    
    if (stampRef.current === null) return;
    setIsSaving(true);
    
    try {
      const dataUrl = await toJpeg(stampRef.current, { cacheBust: true, pixelRatio: 1.5, quality: 0.8 });
      const { uploadStamp } = await import("@/lib/stampService");
      
      await uploadStamp(dataUrl, stampStyle, metadata, isPublic);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu tem!");
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

      {step === "filter" && croppedImage && (
        <div className="w-full max-w-5xl pt-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold">Màu sắc thời gian</h2>
            <p className="text-foreground/60 text-sm mt-1">Sử dụng bộ lọc CamanJS để tạo nước ảnh vintage hoài niệm.</p>
          </div>
          <FilterSelector
            imageUrl={croppedImage}
            onFilterSuccess={handleFilterSuccess}
            onCancel={() => setStep("crop")}
          />
        </div>
      )}

      {step === "style" && filteredImage && (
        <div className="w-full max-w-6xl pt-6 flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left: Preview */}
          <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 glass-card">
            <div className="w-full max-w-md">
              <StampPreview 
                ref={stampRef}
                imageUrl={filteredImage} 
                style={stampStyle}
                metadata={metadata}
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full lg:w-[450px] flex flex-col gap-6">
            <div className="glass-card flex flex-col gap-5">
              <h3 className="font-bold text-xl">Tuỳ chỉnh</h3>
              
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Phong cách Tem</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["vintage", "modern", "polaroid", "minimal", "postage", "film", "wavy"] as StampStyle[]).map((s) => (
                    <button 
                      key={s}
                      onClick={() => setStampStyle(s)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold capitalize border transition-all ${
                        stampStyle === s 
                          ? "border-pastel-blue bg-pastel-blue text-white shadow-md scale-105" 
                          : "border-white/40 bg-white/50 hover:bg-white text-foreground/70"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Thông tin chung</label>
                  <button 
                    onClick={() => setIsAutoGPS(!isAutoGPS)}
                    className="flex items-center gap-1.5 text-xs font-medium text-pastel-blue-dark bg-pastel-blue/10 px-2 py-1 rounded-md"
                  >
                    {isAutoGPS ? <ToggleRight size={16} className="text-pastel-blue" /> : <ToggleLeft size={16} className="text-gray-400" />}
                    Tự động lấy vị trí
                  </button>
                </div>
                <input 
                  type="text" 
                  value={metadata.title}
                  onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                  placeholder="Tiêu đề (VD: Chiều thu Hà Nội)"
                  maxLength={30}
                />
                <div className="flex gap-2">
                  <div className="relative flex-1 flex">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                      <input 
                        type="text" 
                        value={metadata.location}
                        onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 rounded-xl rounded-r-none border border-white/40 border-r-0 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                        placeholder="Địa điểm"
                      />
                    </div>
                    <button
                      onClick={() => setIsMapPickerOpen(true)}
                      className="px-3 bg-white/50 border border-white/40 border-l-0 rounded-r-xl text-pastel-blue-dark hover:bg-white transition-colors"
                      title="Chọn trên bản đồ"
                    >
                      <MapIcon size={16} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={metadata.date}
                    onChange={(e) => setMetadata({...metadata, date: e.target.value})}
                    className="w-[120px] px-4 py-2 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm"
                    placeholder="Ngày"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold flex items-center justify-between">
                  <span>Câu chuyện của bạn</span>
                  {metadata.coordinates && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={10} /> Đã ghim vị trí
                    </span>
                  )}
                </label>
                <textarea 
                  value={metadata.story || ""}
                  onChange={(e) => setMetadata({...metadata, story: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:border-pastel-blue text-sm resize-none h-24"
                  placeholder="Viết vài dòng lưu giữ kỷ niệm đằng sau con tem này..."
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Quyền riêng tư</label>
                <div className="flex gap-2 bg-white/40 p-1 rounded-xl">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      isPublic ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
                    }`}
                  >
                    <Globe size={16} /> Công khai
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      !isPublic ? "bg-white shadow-sm" : "hover:bg-white/50 text-foreground/60"
                    }`}
                  >
                    <Lock size={16} /> Riêng tư
                  </button>
                </div>
                <p className="text-xs text-foreground/50 px-1">
                  {isPublic 
                    ? "Mọi người có thể xem tem này trên bản đồ và trang chủ." 
                    : "Chỉ mình bạn thấy tem này trong Bộ sưu tập cá nhân."}
                </p>
              </div>

            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={handleDownload}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-white border border-white/40 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download size={20} />
                Tải về máy
              </button>
              <button 
                onClick={handleSaveToCollection}
                disabled={isSaving || isSaved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium shadow-lg transition-all ${
                  isSaved 
                    ? "bg-green-500 text-white shadow-green-500/20" 
                    : "bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-1"
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                ) : isSaved ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Đã ghim
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Ghim lên Bản đồ
                  </>
                )}
              </button>
            </div>
            
            <button 
              onClick={() => setStep("filter")}
              className="text-sm text-foreground/60 hover:text-foreground font-medium underline-offset-4 hover:underline text-center mt-2"
            >
              Quay lại bước Bộ lọc ảnh
            </button>
          </div>
        </div>
      )}
      
      <LocationPickerModal 
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleMapConfirm}
        initialPosition={metadata.coordinates}
      />
    </div>
  );
}
