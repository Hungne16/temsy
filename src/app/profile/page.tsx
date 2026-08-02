"use client";

import { MOCK_STAMPS, MOCK_ALBUMS } from "@/lib/mockData";
import { Settings, MapPin, Calendar, Heart, Image as ImageIcon, Award, Camera, X } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { getUserStamps } from "@/lib/stampService";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/userService";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [stampCount, setStampCount] = useState(0);
  const [stamps, setStamps] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      getUserStamps(user.uid).then(userStamps => {
        setStamps(userStamps);
        setStampCount(userStamps.length);
      });
      
      getUserProfile(user.uid).then(data => {
        if (data) {
          setProfile(data);
        } else {
          // Initialize empty profile if not exists
          setProfile({
            uid: user.uid,
            displayName: user.displayName || "Người dùng ẩn danh",
            photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
            bio: "Nhà sưu tầm tem Temsy.",
            location: "Việt Nam",
            bannerUrl: ""
          });
        }
      });
    }
  }, [user]);

  const handleEditClick = () => {
    if (!profile) return;
    setEditName(profile.displayName || "");
    setEditBio(profile.bio || "");
    setEditLocation(profile.location || "");
    setEditAvatarUrl(profile.photoURL || "");
    setEditBannerUrl(profile.bannerUrl || "");
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'avatar') setEditAvatarUrl(base64);
      if (type === 'banner') setEditBannerUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedData = {
        displayName: editName,
        bio: editBio,
        location: editLocation,
        photoURL: editAvatarUrl,
        bannerUrl: editBannerUrl
      };
      
      await updateUserProfile(user.uid, updatedData);
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      setIsEditing(false);
    } catch (error) {
      alert("Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || (user && !profile)) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (!user || !profile) {
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

  return (
    <div className="min-h-screen pb-10">
      {/* Cover Photo */}
      <div 
        className="h-48 md:h-64 bg-pastel-blue-light w-full relative bg-cover bg-center"
        style={{ backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}
      >
        {!profile.bannerUrl && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>}
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Profile Info Header */}
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row gap-6 md:items-end mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-cream shadow-xl z-10 flex-shrink-0">
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <p className="text-foreground/80 mt-1">{profile.bio}</p>
              <div className="flex gap-4 mt-2 text-sm text-foreground/60">
                <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Thành viên Temsy</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleEditClick} className="px-6 py-2 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">{stampCount}</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><ImageIcon size={14} /> Tem đã tạo</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">0</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><ImageIcon size={14} /> Album</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-pastel-blue-dark">0</span>
            <span className="text-sm font-medium text-foreground/60 flex items-center gap-1 mt-1"><Heart size={14} /> Lượt thích</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200">
            <div className="text-yellow-600 mb-1"><Award size={28} /></div>
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">Người sưu tầm</span>
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

            <div className={`glass-card p-4 flex items-start gap-4 transition-opacity ${stampCount >= 5 ? 'opacity-100' : 'opacity-70'}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold">Nhà Thám Hiểm</h3>
                <p className="text-sm text-foreground/60 mt-1">Tạo tem ở 5 địa điểm khác nhau.</p>
                {stampCount >= 5 ? (
                  <div className="mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md inline-block">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-xs font-medium text-foreground/40 bg-black/5 px-2 py-1 rounded-md inline-block">{Math.min(stampCount, 5)} / 5</div>
                )}
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
        <h2 className="text-xl font-bold mb-4">Tem gần đây</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stamps.slice(0, 4).map((stamp) => (
            <StampCard key={stamp.id} stamp={stamp} />
          ))}
          {stamps.length === 0 && (
            <div className="col-span-4 p-8 text-center text-foreground/50 glass-card">
              Bạn chưa có tem nào. Hãy tạo con tem đầu tiên nhé!
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Chỉnh sửa hồ sơ</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Banner Edit */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ảnh bìa (Banner)</label>
                <div 
                  className="h-32 rounded-xl bg-cover bg-center border-2 border-dashed border-gray-300 relative group overflow-hidden"
                  style={{ backgroundImage: editBannerUrl ? `url(${editBannerUrl})` : "none" }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium hover:bg-white/30">
                      <Camera size={16} /> Thay đổi
                    </button>
                    <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
                  </div>
                </div>
              </div>

              {/* Avatar Edit */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pastel-blue">
                    <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()} className="px-4 py-2 rounded-xl border font-medium hover:bg-gray-50 dark:hover:bg-zinc-800">
                    Tải ảnh lên
                  </button>
                  <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border bg-transparent focus:ring-2 focus:ring-pastel-blue outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vị trí (Location)</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border bg-transparent focus:ring-2 focus:ring-pastel-blue outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tiểu sử (Bio)</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border bg-transparent focus:ring-2 focus:ring-pastel-blue outline-none resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-zinc-900/50">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2 bg-pastel-blue text-white rounded-xl font-medium hover:bg-pastel-blue-dark transition-colors flex items-center gap-2"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
