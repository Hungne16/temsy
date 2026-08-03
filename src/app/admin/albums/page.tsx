"use client";

import { useState, useEffect } from "react";
import { getAllAlbumsForAdmin, deleteAlbumAdmin } from "@/lib/adminService";
import { Trash2, ExternalLink, RefreshCw, BookOpen } from "lucide-react";
import Link from "next/link";


export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await getAllAlbumsForAdmin();
      setAlbums(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách album.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa album này? (Các tem bên trong sẽ không bị xóa)")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteAlbumAdmin(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Lỗi khi xóa album.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 font-patrick max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-pencil mb-2 font-kalam">Quản lý Album</h1>
          <p className="text-pencil/60 font-bold">Quản lý toàn bộ {albums.length} album trên hệ thống.</p>
        </div>
        <button 
          onClick={fetchAlbums}
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
          {albums.map((album) => (
            <div key={album.id} className="bg-white border-[3px] border-pencil rounded-2xl p-4 wobbly-border shadow-[4px_4px_0_0_#2d2d2d] flex flex-col relative group">
              
              {/* Privacy Badge */}
              <div className="absolute top-2 left-2 z-10">
                {album.isPrivate && (
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-md border border-gray-300">Riêng tư</span>
                )}
              </div>

              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 border-2 border-pencil/20 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center">
                {album.coverImage ? (
                  <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={48} className="text-pencil/20" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col">
                <Link href={`/collection?album=${album.id}`} className="font-bold text-xl text-pencil hover:text-marker-blue transition-colors line-clamp-1 mb-1">
                  {album.title || "Không tiêu đề"}
                </Link>
                
                {album.description && (
                  <p className="text-pencil/80 text-sm mb-2 line-clamp-2">
                    {album.description}
                  </p>
                )}

                <p className="text-pencil/60 text-sm mb-4">
                  Tạo bởi: UID {album.userId.slice(0, 6)}...
                  <br/>
                  Ngày tạo: {new Date(album.createdAt?.toMillis ? album.createdAt.toMillis() : Date.now()).toLocaleDateString('vi-VN')}
                  <br/>
                  Số lượng tem: <strong>{album.stampIds?.length || 0}</strong>
                </p>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t-2 border-pencil/10">
                  <button 
                    disabled={deletingId === album.id}
                    onClick={() => handleDeleteAlbum(album.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-red-50 rounded-xl border-2 border-pencil text-marker-red font-bold transition-colors text-sm disabled:opacity-50"
                  >
                    <Trash2 size={16} /> 
                    {deletingId === album.id ? "Đang xóa..." : "Xóa Album"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {albums.length === 0 && (
            <div className="col-span-full py-12 text-center border-4 border-dashed border-pencil/20 rounded-2xl">
              <p className="text-xl text-pencil/50 font-bold font-kalam">Chưa có album nào trên hệ thống.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
