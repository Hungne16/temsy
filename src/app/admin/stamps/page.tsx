"use client";

import { useState, useEffect } from "react";
import { getAllStampsForAdmin, toggleStampFeatured } from "@/lib/adminService";
import { deleteStamp } from "@/lib/stampService";
import { Star, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";


export default function AdminStampsPage() {
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStamps = async () => {
    setLoading(true);
    try {
      const data = await getAllStampsForAdmin();
      setStamps(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách tem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStamps();
  }, []);

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStampFeatured(id, currentStatus);
      // Update local state
      setStamps(prev => prev.map(s => s.id === id ? { ...s, isFeatured: !currentStatus } : s));
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái.");
    }
  };

  const handleDeleteStamp = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tem này? Mọi dữ liệu liên quan sẽ bị mất.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteStamp(id);
      setStamps(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert("Lỗi khi xóa tem.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 font-patrick max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-pencil mb-2 font-kalam">Quản lý Tem</h1>
          <p className="text-pencil/60 font-bold">Quản lý toàn bộ {stamps.length} con tem trên hệ thống.</p>
        </div>
        <button 
          onClick={fetchStamps}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-pencil rounded-xl wobbly-border-sm hover:bg-muted-paper transition-colors font-bold text-pencil"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-pencil border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stamps.map((stamp) => (
            <div key={stamp.id} className="bg-white border-[3px] border-pencil rounded-2xl p-4 wobbly-border shadow-[4px_4px_0_0_#2d2d2d] flex flex-col relative group">
              {/* Featured Badge */}
              {stamp.isFeatured && (
                <div className="absolute -top-3 -right-3 z-10 bg-yellow-400 text-pencil border-2 border-pencil rounded-full p-2 wobbly-border-sm shadow-sm" title="Tem Nổi Bật">
                  <Star size={20} className="fill-pencil" />
                </div>
              )}
              
              {/* Privacy Badge */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                {stamp.metadata?.isSecret ? (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md border border-purple-300">Ẩn danh</span>
                ) : stamp.isPublic === false ? (
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-md border border-gray-300">Riêng tư</span>
                ) : null}
              </div>

              {/* Image */}
              <div className="aspect-square bg-gray-100 border-2 border-pencil/20 rounded-xl mb-4 overflow-hidden relative">
                <img src={stamp.imageUrl} alt={stamp.title} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col">
                <Link href={`/stamp/${stamp.id}`} className="font-bold text-xl text-pencil hover:text-marker-blue transition-colors line-clamp-1 mb-1">
                  {stamp.title || "Không tiêu đề"}
                </Link>
                
                <p className="text-pencil/60 text-sm mb-4">
                  Tạo bởi: {stamp.metadata?.isSecret ? "Ẩn danh" : (stamp.authorName || "Người dùng")} 
                  <br/>
                  {new Date(stamp.createdAt?.toMillis ? stamp.createdAt.toMillis() : Date.now()).toLocaleDateString('vi-VN')}
                  <br/>
                  ❤️ {stamp.likes || 0} lượt thích
                </p>

                {/* Actions */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleToggleFeatured(stamp.id, stamp.isFeatured || false)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-pencil transition-colors font-bold text-sm
                      ${stamp.isFeatured 
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                        : 'bg-white hover:bg-yellow-50 text-pencil/80 hover:text-yellow-700'
                      }
                    `}
                  >
                    <Star size={16} className={stamp.isFeatured ? "fill-current" : ""} /> 
                    {stamp.isFeatured ? "Bỏ Nổi Bật" : "Nổi Bật"}
                  </button>

                  <button 
                    disabled={deletingId === stamp.id}
                    onClick={() => handleDeleteStamp(stamp.id)}
                    className="flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-red-50 rounded-xl border-2 border-pencil text-marker-red font-bold transition-colors text-sm disabled:opacity-50"
                  >
                    <Trash2 size={16} /> 
                    {deletingId === stamp.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {stamps.length === 0 && (
            <div className="col-span-full py-12 text-center border-4 border-dashed border-pencil/20 rounded-2xl">
              <p className="text-xl text-pencil/50 font-bold font-kalam">Chưa có tem nào trên hệ thống.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
