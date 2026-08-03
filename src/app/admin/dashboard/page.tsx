"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/adminService";
import { Users, StickyNote, BookImage, Activity, MapPin, Send, BellRing } from "lucide-react";
import Link from "next/link";
import { createGlobalNotification } from "@/lib/notificationService";

interface DashboardStats {
  totalUsers: number;
  totalStamps: number;
  totalAlbums: number;
  recentStamps: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Lỗi khi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) return;

    setIsSending(true);
    try {
      await createGlobalNotification(notifyTitle.trim(), notifyMessage.trim());
      alert("Đã gửi thông báo toàn hệ thống thành công!");
      setNotifyTitle("");
      setNotifyMessage("");
    } catch (err) {
      alert("Lỗi khi gửi thông báo.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="font-patrick font-bold text-xl text-pencil/50 animate-pulse">Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-patrick">
      <div className="mb-8">
        <h1 className="text-4xl font-kalam font-bold text-pencil mb-2 -rotate-1 inline-block">Bảng Thống Kê</h1>
        <p className="text-pencil/70 font-bold">Tổng quan về hoạt động của Temsy</p>
      </div>

      {/* Thẻ Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border-4 border-pencil p-6 rounded-xl shadow-[4px_4px_0_0_#2d2d2d] rotate-1 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-pencil/70">Tổng Người Dùng</h3>
            <div className="p-3 bg-blue-100 rounded-full border-2 border-pencil">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-5xl font-kalam font-bold text-pencil">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white border-4 border-pencil p-6 rounded-xl shadow-[4px_4px_0_0_#2d2d2d] -rotate-1 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-pencil/70">Tổng Số Tem</h3>
            <div className="p-3 bg-red-100 rounded-full border-2 border-pencil">
              <StickyNote className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-5xl font-kalam font-bold text-pencil">{stats?.totalStamps || 0}</p>
        </div>

        <div className="bg-white border-4 border-pencil p-6 rounded-xl shadow-[4px_4px_0_0_#2d2d2d] rotate-2 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-pencil/70">Tổng Số Album</h3>
            <div className="p-3 bg-green-100 rounded-full border-2 border-pencil">
              <BookImage className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-5xl font-kalam font-bold text-pencil">{stats?.totalAlbums || 0}</p>
        </div>
      </div>

      {/* Phát Thông Báo Toàn Hệ Thống */}
      <div className="bg-white border-4 border-pencil p-6 rounded-xl shadow-[6px_6px_0_0_#2d2d2d] mb-10 rotate-1">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-pencil/20 pb-4">
          <BellRing className="text-marker-blue" size={28} />
          <h2 className="text-2xl font-bold text-pencil">Phát Thông Báo Toàn Hệ Thống</h2>
        </div>
        <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
          <div>
            <label className="block text-lg font-bold text-pencil/80 mb-1">Tiêu đề thông báo</label>
            <input 
              type="text" 
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              placeholder="VD: Cập nhật hệ thống mới!"
              className="w-full px-4 py-2 border-[3px] border-pencil bg-white wobbly-border text-lg font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
            />
          </div>
          <div>
            <label className="block text-lg font-bold text-pencil/80 mb-1">Nội dung</label>
            <textarea 
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo muốn gửi đến tất cả người dùng..."
              className="w-full px-4 py-2 border-[3px] border-pencil bg-white wobbly-border text-lg font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50 min-h-[100px] resize-none"
            />
          </div>
          <button 
            type="submit"
            disabled={isSending || !notifyTitle.trim() || !notifyMessage.trim()}
            className="self-end px-6 py-2 border-[3px] border-pencil bg-marker-blue text-white font-bold font-patrick text-xl wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:-translate-y-1 hover:shadow-pencil transition-all -rotate-1 disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? "Đang gửi..." : <><Send size={20} /> Phát thông báo</>}
          </button>
        </form>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white border-4 border-pencil p-6 rounded-xl shadow-[6px_6px_0_0_#2d2d2d] -rotate-1">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-pencil/20 pb-4">
          <Activity className="text-marker-red" size={28} />
          <h2 className="text-2xl font-bold text-pencil">Tem Mới Tạo Gần Đây</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.recentStamps && stats.recentStamps.length > 0 ? (
            stats.recentStamps.map((stamp: any) => (
              <Link href={`/stamp/${stamp.id}`} key={stamp.id} className="block group">
                <div className="bg-muted-paper border-2 border-pencil p-3 rounded-lg flex gap-4 items-center hover:bg-yellow-100 transition-colors">
                  <div className="w-20 h-20 bg-gray-200 border-2 border-pencil rounded overflow-hidden shrink-0">
                    {stamp.imageUrl ? (
                      <img src={stamp.imageUrl} alt="stamp" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-pencil/30"><StickyNote /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden">
                    <p className="font-bold text-pencil truncate text-lg font-kalam mb-1">{stamp.title || "Tem không tên"}</p>
                    <p className="text-sm font-bold text-pencil/60 flex items-center gap-1 truncate">
                      <MapPin size={12} /> {stamp.locationName || "Không rõ vị trí"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-pencil/50 italic col-span-full text-center py-4">Chưa có tem nào trong hệ thống.</p>
          )}
        </div>
      </div>
    </div>
  );
}
