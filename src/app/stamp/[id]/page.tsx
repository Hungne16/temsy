"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStampById, deleteStamp, updateStampMetadata } from "@/lib/stampService";
import { StampPreview } from "@/components/StampPreview";
import { ArrowLeft, Trash2, Edit3, Save, X } from "lucide-react";
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
      router.push("/collection");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-pastel-blue border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !stamp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-500">Lỗi</h1>
        <p>{error || "Không tìm thấy tem này."}</p>
        <Link href="/collection" className="text-pastel-blue underline">Quay lại bộ sưu tập</Link>
      </div>
    );
  }

  const isOwner = user?.uid === stamp.userId;

  return (
    <div className="min-h-screen p-6 md:p-12 pb-32">
      <header className="mb-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại</span>
        </button>
        
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-3 bg-white border shadow-sm rounded-xl hover:bg-gray-50 transition-colors text-foreground"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-3 bg-white border shadow-sm rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-foreground"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-start">
        {/* Stamp Display */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="w-full max-w-sm">
            <img 
              src={stamp.imageUrl} 
              alt={stamp.metadata.title}
              className="w-full h-auto drop-shadow-xl rounded-sm"
            />
          </div>
        </div>

        {/* Metadata / Editor */}
        <div className="w-full md:w-1/2 glass-card p-8">
          {isEditing ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">Chỉnh sửa thông tin</h2>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground/70">Tiêu đề</label>
                <input 
                  type="text" 
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50"
                />
              </div>
              <div className="flex gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-sm font-medium text-foreground/70">Địa điểm</label>
                  <input 
                    type="text" 
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-sm font-medium text-foreground/70">Ngày tháng</label>
                  <input 
                    type="text" 
                    value={editData.date}
                    onChange={(e) => setEditData({...editData, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground/70">Câu chuyện</label>
                <textarea 
                  value={editData.story}
                  onChange={(e) => setEditData({...editData, story: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 min-h-[100px] resize-none"
                  placeholder="Viết một câu chuyện về con tem này..."
                />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-xl font-medium border hover:bg-gray-50 flex justify-center items-center gap-2"
                >
                  <X size={18} /> Hủy
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-pastel-blue text-white rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-pastel-blue-dark"
                >
                  {isSaving ? "Đang lưu..." : <><Save size={18} /> Lưu lại</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight">{stamp.metadata.title || "Vô danh"}</h1>
                <div className="flex items-center gap-4 text-foreground/60 font-mono">
                  <span>{stamp.metadata.location}</span>
                  <span>•</span>
                  <span>{stamp.metadata.date}</span>
                </div>
              </div>
              
              {stamp.metadata.story && (
                <div className="p-4 bg-pastel-blue/10 rounded-2xl border border-pastel-blue/20">
                  <p className="italic text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    "{stamp.metadata.story}"
                  </p>
                </div>
              )}
              
              <div className="pt-6 border-t border-black/10 flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground/50 mb-1">Phong cách</div>
                  <div className="font-semibold uppercase tracking-wider">{stamp.style}</div>
                </div>
                <div>
                  <div className="text-sm text-foreground/50 mb-1">Trạng thái</div>
                  <div className="font-semibold">
                    {stamp.isPublic === false ? "Riêng tư 🔒" : "Công khai 🌍"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-foreground/50 mb-1">Lượt thích</div>
                  <div className="font-semibold flex items-center gap-1 text-red-500">❤️ {stamp.likes || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
