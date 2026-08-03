"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStampById, deleteStamp, updateStampMetadata } from "@/lib/stampService";
import { ArrowLeft, Trash2, Edit3, Save, X, MapPin, Calendar, Heart, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default function StampDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [stamp, setStamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", location: "", date: "", story: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    getStampById(id)
      .then((data: any) => {
        setStamp(data);
        setEditData({
          title: data.metadata?.title || "",
          location: data.metadata?.location || "",
          date: data.metadata?.date || "",
          story: data.metadata?.story || ""
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Không thể tải tem này.");
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tem này vĩnh viễn?")) return;
    
    try {
      await deleteStamp(id);
      router.back();
    } catch (err) {
      alert("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      // Giữ lại coordinates nếu có
      const updatedMetadata = { ...stamp.metadata, ...editData };
      await updateStampMetadata(id, updatedMetadata);
      setStamp({ ...stamp, metadata: updatedMetadata });
      setIsEditing(false);
    } catch (err) {
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-patrick font-bold text-xl text-pencil">Đang tải tem...</div>
      </div>
    );
  }

  if (error || !stamp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-paper p-6">
        <div className="bg-white border-[4px] border-pencil wobbly-border-md p-10 rotate-2 max-w-md w-full text-center shadow-pencil">
          <h1 className="text-4xl font-kalam font-bold text-marker-red mb-4">Lỗi</h1>
          <p className="font-patrick text-xl text-pencil mb-6">{error || "Không tìm thấy tem này."}</p>
          <button onClick={() => router.back()} className="px-6 py-3 border-[3px] border-pencil bg-marker-blue text-white font-bold font-patrick text-xl wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:-translate-y-1 hover:shadow-pencil transition-all -rotate-1">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === stamp.userId;

  return (
    <div className="min-h-screen p-6 md:p-12 pb-32 bg-paper text-pencil">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted-paper transition-all -rotate-1 font-bold font-patrick text-lg">
            <ArrowLeft size={20} />
            Quay lại
          </button>
          
          {isOwner && !isEditing && (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted-paper transition-all rotate-1 font-bold font-patrick text-lg text-marker-blue"
              >
                <Edit3 size={18} /> Sửa
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-red-50 transition-all -rotate-1 font-bold font-patrick text-lg text-marker-red"
              >
                <Trash2 size={18} /> Xóa
              </button>
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Stamp Display (Full Image) */}
          <div className="w-full lg:w-1/2 flex justify-center sticky top-12">
            <div className="w-full max-w-xl bg-white border-[4px] border-pencil p-4 md:p-6 wobbly-border-md shadow-pencil rotate-1">
              <img 
                src={stamp.imageUrl} 
                alt={stamp.metadata.title}
                className="w-full h-auto drop-shadow-md"
              />
            </div>
          </div>

          {/* Metadata / Editor */}
          <div className="w-full lg:w-1/2 bg-white border-[4px] border-pencil p-6 md:p-10 wobbly-border-md shadow-pencil -rotate-1 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-32 h-8 bg-black/10 rotate-3" style={{ clipPath: "polygon(0 0%, 100% 5%, 95% 100%, 5% 95%)" }}></div>
            
            {isEditing ? (
              <div className="space-y-6">
                <h2 className="text-4xl font-kalam font-bold text-marker-red mb-8">Sửa Kỷ Niệm</h2>
                
                <div className="space-y-2">
                  <label className="text-xl font-bold font-patrick">Tiêu đề</label>
                  <input 
                    type="text" 
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="space-y-2 flex-1">
                    <label className="text-xl font-bold font-patrick">Địa điểm</label>
                    <input 
                      type="text" 
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-xl font-bold font-patrick">Ngày tháng</label>
                    <input 
                      type="text" 
                      value={editData.date}
                      onChange={(e) => setEditData({...editData, date: e.target.value})}
                      className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xl font-bold font-patrick">Câu chuyện</label>
                  <textarea 
                    value={editData.story}
                    onChange={(e) => setEditData({...editData, story: e.target.value})}
                    className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50 min-h-[150px] resize-none"
                    placeholder="Viết một câu chuyện..."
                  />
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border-[3px] border-pencil bg-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] font-bold font-patrick text-xl hover:bg-muted-paper transition-all flex items-center justify-center gap-2"
                  >
                    <X size={20} /> Hủy
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex-1 py-3 border-[3px] border-pencil bg-marker-blue text-white wobbly-border shadow-pencil font-bold font-patrick text-xl hover:-translate-y-1 hover:shadow-pencil-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? "Đang lưu..." : <><Save size={20} /> Lưu lại</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h1 className="text-5xl font-kalam font-bold text-pencil leading-tight break-words">{stamp.metadata.title || "Kỷ niệm không tên"}</h1>
                  
                  <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-xl font-bold font-patrick bg-postit border-2 border-pencil px-4 py-2 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] rotate-1">
                      <MapPin size={20} className="text-marker-red" />
                      {stamp.metadata.location || "Chưa ghim địa điểm"}
                    </div>
                    {stamp.metadata.date && (
                      <div className="flex items-center gap-2 text-xl font-bold font-patrick bg-white border-2 border-pencil px-4 py-2 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1">
                        <Calendar size={20} className="text-marker-blue" />
                        {stamp.metadata.date}
                      </div>
                    )}
                  </div>
                </div>
                
                {stamp.metadata.story && (
                  <div className="mt-8 border-l-[4px] border-pencil pl-6 relative">
                    <div className="absolute -left-6 -top-4 text-4xl text-marker-red font-kalam font-bold rotate-12">&quot;</div>
                    <p className="text-2xl font-patrick leading-relaxed text-pencil/90 whitespace-pre-wrap italic">
                      {stamp.metadata.story}
                    </p>
                  </div>
                )}
                
                <div className="pt-8 mt-8 border-t-[3px] border-pencil border-dashed grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Phong cách</div>
                    <div className="text-xl font-bold font-kalam text-pencil">{stamp.style}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Trạng thái</div>
                    <div className="text-xl font-bold font-patrick flex items-center gap-2">
                      {stamp.isPublic === false ? <><Lock size={18} className="text-marker-red" /> Riêng tư</> : <><Globe size={18} className="text-marker-blue" /> Công khai</>}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Lượt thích</div>
                    <div className="text-xl font-bold font-patrick flex items-center gap-2 text-marker-red">
                      <Heart size={18} className="fill-marker-red" /> {stamp.likes || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
