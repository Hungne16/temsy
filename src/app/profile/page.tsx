"use client";

import { MOCK_STAMPS, MOCK_ALBUMS } from "@/lib/mockData";
import { Settings, MapPin, Calendar, Heart, Image as ImageIcon, Award } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getUserStamps } from "@/lib/stampService";

export default function ProfilePage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [stampCount, setStampCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUserStamps(user.uid).then(stamps => {
        setStampCount(stamps.length);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-10 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Hồ sơ cá nhân</h1>
          <p className="text-foreground/60 mb-8">Vui lòng đăng nhập để xem hồ sơ và bộ sưu tập của bạn.</p>
          <Link href="/login" className="w-full bg-pastel-blue text-white py-3 rounded-xl font-medium hover:bg-pastel-blue-dark transition-colors inline-block">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const userProfile = {
    name: user.displayName || "Người dùng ẩn danh",
    bio: "Nhà sưu tầm tem Temsy.",
    avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    joinDate: "Hôm nay",
    location: "Vietnam",
    stats: {
      stamps: stampCount,
      albums: 0,
      followers: 0,
      following: 0
    }
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 bg-pastel-blue-light w-full relative">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Profile Info Header */}
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row gap-6 md:items-end mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-cream shadow-xl z-10">
            <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{userProfile.name}</h1>
              <p className="text-foreground/80 mt-1">{userProfile.bio}</p>
              <div className="flex gap-4 mt-2 text-sm text-foreground/60">
                <span className="flex items-center gap-1"><MapPin size={14} /> {userProfile.location}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Tham gia {userProfile.joinDate}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors">
                Chỉnh sửa
              </button>
              <button className="p-2 glass rounded-xl hover:bg-white/50 transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">{userProfile.stats.stamps}</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><ImageIcon size={14} /> Tem đã tạo</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">{userProfile.stats.albums}</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><ImageIcon size={14} /> Album</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">12k</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><Heart size={14} /> Lượt thích</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200">
            <div className="text-yellow-600 mb-1"><Award size={28} /></div>
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">Master Collector</span>
          </div>
        </div>

        {/* Badges & Gamification */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-pastel-blue-dark" /> Huy hiệu & Thành tựu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h3 className="font-bold">Người Mới Bắt Đầu</h3>
                <p className="text-sm text-foreground/60 mt-1">Tạo con tem đầu tiên của bạn.</p>
                {stampCount >= 1 ? (
                  <div className="mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md inline-block">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-xs font-medium text-foreground/40 bg-black/5 px-2 py-1 rounded-md inline-block">Chưa mở khóa</div>
                )}
              </div>
            </div>

            <div className="glass-card p-4 flex items-start gap-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold">Nhà Thám Hiểm</h3>
                <p className="text-sm text-foreground/60 mt-1">Tạo tem ở 5 địa điểm khác nhau.</p>
                <div className="mt-2 text-xs font-medium text-foreground/40 bg-black/5 px-2 py-1 rounded-md inline-block">0 / 5</div>
              </div>
            </div>

            <div className="glass-card p-4 flex items-start gap-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="font-bold">Người Truyền Cảm Hứng</h3>
                <p className="text-sm text-foreground/60 mt-1">Nhận được 100 lượt thích.</p>
                <div className="mt-2 text-xs font-medium text-foreground/40 bg-black/5 px-2 py-1 rounded-md inline-block">0 / 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Stamps */}
        <h2 className="text-xl font-bold mb-4">Bộ sưu tập nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOCK_STAMPS.slice(0, 4).map((stamp) => (
            <StampCard key={stamp.id} stamp={stamp} />
          ))}
        </div>
      </div>
    </div>
  );
}
