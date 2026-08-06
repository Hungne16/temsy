"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Uploader } from "@/components/Uploader";
import { StampEditor } from "@/components/StampEditor";
import { StampPreview, StampStyle } from "@/components/StampPreview";
import { toJpeg, toPng } from "html-to-image";
import { Download, Save, MapPin, Globe, Lock, Map as MapIcon, ToggleLeft, ToggleRight, Check, Mic, Square, Trash2, Play, CircleStop } from "lucide-react";
import LocationPickerModal from "@/components/LocationPickerModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { StampMetadata } from "@/lib/stampService";

const CAMAN_FILTERS = [
  { id: "normal", name: "Gốc" },
  { id: "vintage", name: "Vintage" },
  { id: "lomo", name: "Lomo" },
  { id: "clarity", name: "Clarity" },
  { id: "sinCity", name: "Sin City" },
  { id: "sunrise", name: "Sunrise" },
  { id: "crossProcess", name: "Cross Process" },
  { id: "orangePeel", name: "Orange Peel" },
  { id: "love", name: "Love" },
  { id: "grungy", name: "Grungy" },
  { id: "pinhole", name: "Pinhole" },
  { id: "oldBoot", name: "Old Boot" },
  { id: "glowingSun", name: "Glowing Sun" },
  { id: "hazyDays", name: "Hazy Days" },
  { id: "nostalgia", name: "Nostalgia" }
];

const STAMP_STYLES: { id: StampStyle; name: string; type: "css" | "image" }[] = [
  { id: "vintage", name: "Cổ điển", type: "css" },
  { id: "modern", name: "Hiện đại", type: "css" },
  { id: "polaroid", name: "Polaroid", type: "css" },
  { id: "postage", name: "Bưu chính", type: "css" },
  { id: "film", name: "Phim ảnh", type: "css" },
  { id: "wavy", name: "Lượn sóng", type: "css" },
  { id: "ripped", name: "Giấy rách", type: "css" },
  { id: "template_1", name: "Khung 1", type: "image" },
  { id: "template_2", name: "Khung 2", type: "image" },
  { id: "template_3", name: "Khung 3", type: "image" },
  { id: "template_4", name: "Khung 4", type: "image" },
  { id: "template_5", name: "Khung 5", type: "image" }
];

export default function CreateStampPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "crop" | "style">("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [stampStyle, setStampStyle] = useState<StampStyle>("vintage");
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);
  const [camanLoaded, setCamanLoaded] = useState(false);
  
  const camanInstanceRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [metadata, setMetadata] = useState<StampMetadata>({ 
    title: "", 
    location: "", 
    date: "",
    story: "",
    coordinates: undefined
  });
  const [privacy, setPrivacy] = useState<"public" | "private" | "friend">("public");
  const [isAutoGPS, setIsAutoGPS] = useState(true);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [showLoadingVideo, setShowLoadingVideo] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [userAlbums, setUserAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  
  const stampRef = useRef<HTMLDivElement>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      import("@/lib/albumService").then(({ getUserAlbums }) => {
        getUserAlbums(user.uid).then(setUserAlbums);
      });
    }
  }, [user]);

  // Load CamanJS
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Caman) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.1.2/caman.full.min.js";
      script.async = true;
      script.onload = () => setCamanLoaded(true);
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      setCamanLoaded(true);
    }
  }, []);

  // Initialize Canvas when entering "style" step
  useEffect(() => {
    if (step === "style" && camanLoaded && canvasRef.current && croppedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = croppedImage;
      img.onload = () => {
        // Increase MAX_WIDTH to keep image sharpness
        const MAX_WIDTH = 2000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const Caman = (window as any).Caman;
        Caman(canvas, function(this: any) {
          camanInstanceRef.current = this;
          this.reloadCanvasData();
        });
      };
    }
  }, [step, camanLoaded, croppedImage]);

  const applyFilter = (filterId: string) => {
    if (!camanInstanceRef.current || isProcessingFilter) return;
    
    setSelectedFilter(filterId);
    setIsProcessingFilter(true);
    
    const caman = camanInstanceRef.current;
    caman.revert(false);
    
    if (filterId === "normal") {
      caman.render(() => {
        if (canvasRef.current) {
          setFilteredImage(canvasRef.current.toDataURL("image/jpeg", 0.9));
        }
        setIsProcessingFilter(false);
      });
      return;
    }
    
    if (typeof caman[filterId] === "function") {
      caman[filterId]();
      caman.render(() => {
        if (canvasRef.current) {
          setFilteredImage(canvasRef.current.toDataURL("image/jpeg", 0.9));
        }
        setIsProcessingFilter(false);
      });
    } else {
      setIsProcessingFilter(false);
    }
  };
  
  // ── Audio Recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setMetadata(prev => ({ ...prev, audioData: base64Audio }));
          setAudioUrl(base64Audio);
        };
        // Dọn dẹp stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 14) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert("Vui lòng cấp quyền sử dụng Micro để thu âm!");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setMetadata(prev => ({ ...prev, audioData: undefined }));
    setRecordingTime(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

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
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14&addressdetails=1&accept-language=vi`)
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
    
    setFilteredImage(croppedUrl);
    setStep("style");
  };

  const handleMapConfirm = (pos: { lat: number, lng: number }) => {
    setMetadata(prev => ({
      ...prev,
      coordinates: pos,
      location: "Đang tải vị trí..."
    }));
    setIsMapPickerOpen(false);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=14&addressdetails=1&accept-language=vi`)
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
      const finalMetadata = { ...metadata };
      // Nếu có location text mà chưa có toạ độ, thử dùng Nominatim để lấy toạ độ
      if (!finalMetadata.coordinates && finalMetadata.location && finalMetadata.location !== "Đang tải vị trí..." && finalMetadata.location !== "Chưa rõ vị trí") {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalMetadata.location)}&limit=1&countrycodes=vn&accept-language=vi`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalMetadata.coordinates = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
          }
        } catch (e) {
          console.error("Lỗi tự động tìm toạ độ:", e);
        }
      }

      setShowLoadingVideo(true);
      
      // Allow browser to render the video overlay before executing heavy image processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(stampRef.current, { cacheBust: true, pixelRatio: 2, quality: 0.85 });
      const { uploadStamp } = await import("@/lib/stampService");
      
      const newStamp = await uploadStamp(dataUrl, stampStyle, finalMetadata, privacy);
      
      if (selectedAlbumId) {
        const { addStampToAlbum } = await import("@/lib/albumService");
        await addStampToAlbum(selectedAlbumId, newStamp.id);
      }
      
      // Delay to let the video play for a bit
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      router.push('/map');
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu tem!");
      setIsSaving(false);
      setShowLoadingVideo(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen flex flex-col items-center bg-paper text-pencil relative overflow-hidden">
      {/* Texture background */}

      
      {step === "upload" && (
        <div className="w-full max-w-2xl text-center pt-10 relative z-10">
          <h1 className="text-5xl md:text-6xl font-kalam font-bold mb-4 -rotate-1 inline-block">Tạo Tem Mới</h1>
          <p className="text-pencil/70 mb-8 text-lg md:text-xl font-patrick">
            Kéo thả hoặc tải ảnh lên để bắt đầu biến khoảnh khắc của bạn thành một con tem.
          </p>
          <div className="rotate-1">
            <Uploader onImageSelected={handleImageSelected} />
          </div>
        </div>
      )}

      {step === "crop" && originalImage && (
        <div className="w-full max-w-3xl pt-6 relative z-10">
          <div className="mb-6">
            <h2 className="text-4xl md:text-5xl font-kalam font-bold rotate-1 inline-block">Cắt ảnh</h2>
            <p className="text-pencil/70 text-lg mt-1 font-patrick">Chọn khung hình đẹp nhất cho con tem của bạn.</p>
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
        <div className="w-full max-w-6xl pt-4 md:pt-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative z-10">
          
          {/* Hidden Canvas for CamanJS */}
          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Left: Preview */}
          <div className="w-full lg:flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-white border-[3px] border-pencil wobbly-border shadow-pencil sticky top-4 z-10 -rotate-1">
            {isProcessingFilter && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl">
                 <div className="px-4 py-2 bg-white rounded-full shadow-md font-medium text-pastel-blue-dark text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-pastel-blue-dark border-t-transparent rounded-full animate-spin"></div>
                    Đang áp dụng...
                  </div>
              </div>
            )}
            <div className="w-full max-w-sm md:max-w-md">
              <StampPreview 
                ref={stampRef}
                imageUrl={filteredImage || croppedImage || ""} 
                style={stampStyle}
                metadata={metadata}
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full lg:w-[450px] flex flex-col gap-6">
            <div className="flex flex-col gap-5 bg-white border-[3px] border-pencil wobbly-border-md shadow-pencil p-6 md:p-8 rotate-1">
              {/* Tape decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-20 h-6 bg-black/10 -rotate-2" style={{ clipPath: "polygon(0 0%, 100% 10%, 95% 100%, 5% 90%)" }}></div>
              
              <h3 className="font-kalam font-bold text-3xl">Tuỳ chỉnh</h3>
              
              <div className="flex flex-col gap-3">
                <label className="text-lg font-bold font-patrick">Phong cách & Khung tem</label>
                <div className="flex gap-3 overflow-x-auto pb-4 filter-scrollbar snap-x">
                  {STAMP_STYLES.map((styleObj) => (
                    <button 
                      key={styleObj.id}
                      onClick={() => setStampStyle(styleObj.id)}
                      className={`relative flex-shrink-0 w-[90px] h-[110px] flex flex-col items-center justify-center gap-2 rounded-xl transition-all font-patrick snap-start border-2 ${
                        stampStyle === styleObj.id 
                          ? "border-marker-red bg-marker-red/5 shadow-[4px_4px_0px_0px_var(--color-marker-red)] -translate-y-1" 
                          : "border-pencil bg-white hover:bg-muted-paper hover:-translate-y-1 shadow-[2px_2px_0px_0px_#2d2d2d] wobbly-border"
                      }`}
                    >
                      <div className="w-14 h-14 relative flex items-center justify-center bg-muted-paper/50 overflow-hidden border border-pencil/20 rounded-md">
                        {styleObj.type === "image" ? (
                          <img src={`/templates/${styleObj.id}.png`} alt={styleObj.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-10 h-10 bg-white border-2 border-pencil/50 flex items-center justify-center">
                            <span className="text-sm font-bold text-pencil/50">{styleObj.name.substring(0, 2)}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-bold ${stampStyle === styleObj.id ? "text-marker-red" : "text-pencil"}`}>
                        {styleObj.name}
                      </span>
                      
                      {stampStyle === styleObj.id && (
                        <div className="absolute -top-2 -right-2 bg-marker-red text-white rounded-full p-0.5 shadow-sm border-2 border-white">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3">
                <label className="text-lg font-bold font-patrick">Bộ lọc màu</label>
                <div className="flex gap-2 overflow-x-auto pb-2 filter-scrollbar">
                  {CAMAN_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => applyFilter(filter.id)}
                      disabled={isProcessingFilter || !camanLoaded}
                      className={`flex-shrink-0 px-3 py-1.5 text-sm font-bold transition-all border-2 whitespace-nowrap flex items-center gap-1 font-patrick wobbly-border ${
                        selectedFilter === filter.id
                          ? "border-pencil bg-marker-red text-white shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[1px] translate-y-[1px]"
                          : "border-pencil bg-white text-pencil hover:bg-muted-paper"
                      }`}
                    >
                      {filter.name}
                      {selectedFilter === filter.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold font-patrick">Thông tin chung</label>
                  <button 
                    onClick={() => setIsAutoGPS(!isAutoGPS)}
                    className="flex items-center gap-1.5 text-sm font-bold text-pencil bg-muted-paper/50 px-2 py-1 border-2 border-pencil wobbly-border hover:bg-muted-paper transition-colors"
                  >
                    {isAutoGPS ? <ToggleRight size={16} className="text-marker-red" /> : <ToggleLeft size={16} className="text-pencil/50" />}
                    Tự động vị trí
                  </button>
                </div>
                <input 
                  type="text" 
                  value={metadata.title}
                  onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                  className="w-full px-4 py-2 border-[3px] border-pencil bg-white wobbly-border focus:outline-none focus:ring-2 focus:ring-marker-blue/20 focus:border-marker-blue text-lg font-patrick placeholder-pencil/40"
                  placeholder="Tiêu đề (VD: Chiều thu Hà Nội)"
                  maxLength={30}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/50" size={18} />
                      <input 
                        type="text" 
                        value={metadata.location}
                        onChange={(e) => setMetadata({...metadata, location: e.target.value, coordinates: undefined})}
                        className="w-full pl-9 pr-4 py-2 border-[3px] border-pencil border-r-0 bg-white focus:outline-none focus:ring-2 focus:ring-marker-blue/20 text-lg font-patrick placeholder-pencil/40"
                        style={{ borderRadius: "15px 0 0 255px / 255px 0 0 15px" }}
                        placeholder="Địa điểm"
                      />
                    </div>
                    <button
                      onClick={() => setIsMapPickerOpen(true)}
                      className="px-3 bg-muted-paper/50 border-[3px] border-pencil border-l-0 text-pencil hover:bg-muted-paper transition-colors"
                      style={{ borderRadius: "0 255px 15px 0 / 0 15px 255px 0" }}
                      title="Chọn trên bản đồ"
                    >
                      <MapIcon size={18} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={metadata.date}
                    onChange={(e) => setMetadata({...metadata, date: e.target.value})}
                    className="w-full sm:w-[120px] px-4 py-2 border-[3px] border-pencil bg-white wobbly-border focus:outline-none focus:ring-2 focus:ring-marker-blue/20 text-lg font-patrick placeholder-pencil/40"
                    placeholder="Ngày"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-lg font-bold font-patrick flex items-center justify-between">
                  <span>Câu chuyện của bạn</span>
                  {metadata.coordinates && (
                    <span className="text-xs font-bold text-white bg-marker-red px-2 py-0.5 wobbly-border flex items-center gap-1 rotate-2 shadow-[2px_2px_0px_0px_#2d2d2d]">
                      <MapPin size={10} /> Đã ghim
                    </span>
                  )}
                </label>
                <textarea 
                  value={metadata.story || ""}
                  onChange={(e) => setMetadata({...metadata, story: e.target.value})}
                  className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border focus:outline-none focus:ring-2 focus:ring-marker-blue/20 text-lg font-patrick placeholder-pencil/40 resize-none h-24"
                  placeholder="Viết vài dòng lưu giữ kỷ niệm đằng sau con tem này..."
                />
                
                {/* Audio Recorder UI */}
                <div className="mt-1 flex items-center gap-3">
                  {!audioUrl ? (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-4 py-2 border-[3px] border-pencil wobbly-border transition-colors font-patrick font-bold shadow-[2px_2px_0_0_#2d2d2d] ${
                        isRecording ? "bg-marker-red text-white" : "bg-white text-pencil hover:bg-muted-paper"
                      }`}
                    >
                      {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
                      {isRecording ? `Đang thu... 00:${recordingTime < 10 ? "0" : ""}${recordingTime}` : "Thu âm kỷ niệm (Max 15s)"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full p-2 border-[3px] border-pencil bg-muted-paper/50 wobbly-border shadow-[2px_2px_0_0_#2d2d2d]">
                      <audio src={audioUrl} controls className="flex-1 max-w-[200px]" />
                      <button 
                        onClick={deleteRecording}
                        className="p-2 text-marker-red hover:bg-marker-red/10 rounded-full transition-colors ml-auto"
                        title="Xóa đoạn ghi âm"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-lg font-bold font-patrick flex items-center justify-between">
                  Quyền riêng tư & Bộ sưu tập
                </label>
                
                {userAlbums.length > 0 && (
                  <div className="flex flex-col mb-2">
                    <select
                      value={selectedAlbumId}
                      onChange={(e) => setSelectedAlbumId(e.target.value)}
                      className="w-full px-4 py-2 border-[3px] border-pencil bg-white wobbly-border focus:outline-none focus:ring-2 focus:ring-marker-blue/20 text-lg font-patrick text-pencil"
                    >
                      <option value="">-- Không chọn bộ sưu tập --</option>
                      {userAlbums.map(album => (
                        <option key={album.id} value={album.id}>{album.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex bg-white border-2 border-pencil rounded-md p-1 font-patrick wobbly-border text-sm sm:text-base">
                  <button 
                    onClick={() => setPrivacy("public")}
                    className={`flex-1 py-2 sm:py-3 font-bold transition-all ${
                      privacy === "public" ? "bg-postit border-2 border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1" : "hover:bg-muted-paper text-pencil/70 border-2 border-transparent"
                    }`}
                  >
                    Công khai
                  </button>
                  <button 
                    onClick={() => setPrivacy("friend")}
                    className={`flex-1 py-2 sm:py-3 font-bold transition-all ${
                      privacy === "friend" ? "bg-postit border-2 border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] rotate-1" : "hover:bg-muted-paper text-pencil/70 border-2 border-transparent"
                    }`}
                  >
                    Bạn bè
                  </button>
                  <button 
                    onClick={() => setPrivacy("private")}
                    className={`flex-1 py-2 sm:py-3 font-bold transition-all ${
                      privacy === "private" ? "bg-postit border-2 border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1" : "hover:bg-muted-paper text-pencil/70 border-2 border-transparent"
                    }`}
                  >
                    Riêng tư
                  </button>
                </div>
                
                {/* Geocaching toggle */}
                {privacy !== "private" && metadata.coordinates && (
                  <button
                    onClick={() => setMetadata({ ...metadata, isSecret: !metadata.isSecret })}
                    className={`flex items-center gap-2 px-4 py-3 mt-2 border-2 border-pencil font-bold font-patrick transition-all wobbly-border ${
                      metadata.isSecret 
                        ? "bg-marker-red text-white shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1" 
                        : "bg-white text-pencil hover:bg-muted-paper rotate-1"
                    }`}
                  >
                    {privacy === "public" 
                      ? <Globe size={24} className={isSaving ? "animate-spin" : ""} /> 
                      : privacy === "friend"
                        ? <Check size={24} className={isSaving ? "animate-spin" : ""} /> 
                        : <Lock size={24} className={isSaving ? "animate-spin" : ""} />
                    }
                    <div className="flex flex-col text-left">
                      <span>Tem Ẩn (Định vị)</span>
                      <span className={`text-xs font-normal ${metadata.isSecret ? "text-white/80" : "text-pencil/60"}`}>
                        Yêu cầu người khác phải đến gần (50m) mới xem được
                      </span>
                    </div>
                    <div className="ml-auto">
                      {metadata.isSecret ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-pencil/40" />}
                    </div>
                  </button>
                )}
                <p className="text-sm text-pencil/60 px-1 font-patrick">
                  {privacy === "public" 
                    ? "Mọi người có thể xem tem này trên bản đồ và trang chủ." 
                    : privacy === "friend"
                      ? "Chỉ bạn bè mới có thể xem tem này trên bản đồ và trang chủ."
                      : "Chỉ mình bạn thấy tem này trong Bộ sưu tập cá nhân."}
                </p>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button 
                onClick={handleDownload}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-pencil bg-muted-paper wobbly-border shadow-pencil font-bold text-xl font-patrick hover:bg-marker-blue hover:text-white hover:shadow-pencil-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all -rotate-1 disabled:opacity-50"
              >
                <Download size={22} />
                Tải về máy
              </button>
              <button 
                onClick={handleSaveToCollection}
                disabled={isSaving || isSaved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-pencil wobbly-border shadow-pencil font-bold text-xl font-patrick transition-all rotate-1 disabled:opacity-50 ${
                  isSaved 
                    ? "bg-green-400 text-pencil" 
                    : "bg-white text-pencil hover:bg-marker-red hover:text-white hover:shadow-pencil-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-pencil border-t-transparent rounded-full animate-spin"></div>
                ) : isSaved ? (
                  <>
                    <Check size={22} />
                    Đã ghim
                  </>
                ) : (
                  <>
                    <Save size={22} />
                    Ghim lên Bản đồ
                  </>
                )}
              </button>
            </div>
            
            <button 
              onClick={() => {
                setStep("crop");
                setSelectedFilter("normal");
              }}
              className="text-lg font-patrick text-pencil/60 hover:text-marker-red font-bold underline decoration-wavy underline-offset-4 text-center mt-4 pb-8 lg:pb-0 transition-colors"
            >
              Quay lại bước Cắt ảnh
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

      <AnimatePresence>
        {showLoadingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          >
            <video 
              src="/ghim_tren_live.mp4" 
              autoPlay 
              muted 
              playsInline
              loop
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
               <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-white font-patrick text-2xl font-bold animate-pulse text-center drop-shadow-md">
                 Đang ghim kỷ niệm của bạn lên Bản đồ...
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
