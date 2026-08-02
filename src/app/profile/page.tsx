"use client";

import { MOCK_STAMPS, MOCK_ALBUMS } from "@/lib/mockData";
import { Settings, MapPin, Calendar, Heart, Image as ImageIcon, Award, Camera, X, LogOut } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserStamps, deleteStamp, updateStampMetadata } from "@/lib/stampService";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/userService";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
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
  
  // Stamp Edit State
  const [editingStamp, setEditingStamp] = useState<any>(null);
  const [editStampTitle, setEditStampTitle] = useState("");
  const [editStampLocation, setEditStampLocation] = useState("");
  const [editStampStory, setEditStampStory] = useState("");

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

  const directBannerInputRef = useRef<HTMLInputElement>(null);
  
  const handleDirectBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;
    
    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await updateUserProfile(user.uid, { bannerUrl: base64 });
        setProfile({ ...profile, bannerUrl: base64 });
      } catch (error) {
        alert("Lỗi cập nhật ảnh bìa.");
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStamp = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tem này không?")) return;
    try {
      await deleteStamp(id);
      setStamps(stamps.filter(s => s.id !== id));
      setStampCount(prev => prev - 1);
    } catch (error) {
      alert("Lỗi khi xóa tem.");
    }
  };

  const handleEditStampClick = (id: string) => {
    const stamp = stamps.find(s => s.id === id);
    if (stamp) {
      setEditingStamp(stamp);
      setEditStampTitle(stamp.metadata.title || "");
      setEditStampLocation(stamp.metadata.location || "");
      setEditStampStory(stamp.metadata.story || "");
    }
  };

  const handleSaveStamp = async () => {
    if (!editingStamp) return;
    setIsSaving(true);
    try {
      const updatedMetadata = {
        ...editingStamp.metadata,
        title: editStampTitle,
        location: editStampLocation,
        story: editStampStory
      };
      await updateStampMetadata(editingStamp.id, updatedMetadata);
      
      setStamps(stamps.map(s => s.id === editingStamp.id ? { ...s, metadata: updatedMetadata } : s));
      setEditingStamp(null);
    } catch (error) {
      alert("Lỗi cập nhật tem.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || (user && !profile)) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-paper relative">
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: "radial-gradient(var(--color-muted-paper) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
        <div className="bg-white border-[3px] border-pencil wobbly-border-md shadow-pencil p-10 max-w-md w-full relative z-10 rotate-1">
          <h1 className="text-4xl font-kalam font-bold mb-4 text-pencil">Hồ sơ cá nhân</h1>
          <p className="text-pencil/70 mb-8 font-patrick text-lg">Vui lòng đăng nhập để xem hồ sơ và bộ sưu tập của bạn.</p>
          <Link href="/login" className="w-full bg-postit text-pencil py-3 border-[3px] border-pencil wobbly-border shadow-pencil font-bold font-patrick text-xl hover:bg-marker-blue hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all inline-block -rotate-2">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 bg-paper relative font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: "radial-gradient(var(--color-muted-paper) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      {/* Cover Photo */}
      <div 
        className="h-48 md:h-64 bg-muted-paper w-full relative bg-cover bg-center border-b-[3px] border-pencil"
        style={{ backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}
      >
        {!profile.bannerUrl && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>}
        
        {/* Quick action to change banner */}
        <div className="absolute bottom-4 right-4 z-20">
          <button 
            onClick={() => directBannerInputRef.current?.click()} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-pencil px-4 py-2 wobbly-border text-pencil font-bold font-patrick hover:bg-white shadow-[2px_2px_0px_0px_#2d2d2d] transition-all rotate-2 active:rotate-0"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-pencil border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera size={18} />
            )}
            Đổi ảnh bìa
          </button>
          <input type="file" accept="image/*" ref={directBannerInputRef} onChange={handleDirectBannerChange} className="hidden" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Profile Info Header */}
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row gap-6 md:items-end mb-10">
          <div className="w-32 h-32 md:w-40 md:h-40 border-[4px] border-pencil overflow-hidden bg-white shadow-pencil z-10 flex-shrink-0 wobbly-border -rotate-2">
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md border-[3px] border-pencil p-4 wobbly-border shadow-pencil rotate-1">
              <h1 className="text-4xl font-kalam font-bold text-pencil">{profile.displayName}</h1>
              <p className="text-pencil/80 mt-1 font-patrick text-lg">{profile.bio}</p>
              <div className="flex gap-4 mt-2 text-sm text-pencil/70 font-patrick font-bold">
                <span className="flex items-center gap-1"><MapPin size={16} /> {profile.location}</span>
                <span className="flex items-center gap-1"><Calendar size={16} /> Thành viên Temsy</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleEditClick} className="px-6 py-3 bg-white border-[3px] border-pencil text-pencil shadow-pencil wobbly-border font-bold font-patrick text-lg hover:bg-muted-paper hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all -rotate-2">
                Chỉnh sửa
              </button>
              <button
                onClick={async () => { await logout(); router.push("/login"); }}
                className="px-4 py-3 bg-white border-[3px] border-pencil text-marker-red shadow-pencil wobbly-border font-bold font-patrick text-lg hover:bg-marker-red hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1 flex items-center gap-2"
                title="Đăng xuất"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil rotate-1">
            <span className="text-4xl font-bold font-kalam text-marker-blue">{stampCount}</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><ImageIcon size={16} /> Tem đã tạo</span>
          </div>
          <div className="bg-white border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil -rotate-1">
            <span className="text-4xl font-bold font-kalam text-marker-blue">0</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><ImageIcon size={16} /> Album</span>
          </div>
          <div className="bg-white border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil rotate-2">
            <span className="text-4xl font-bold font-kalam text-marker-blue">0</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><Heart size={16} /> Lượt thích</span>
          </div>
          <div className="bg-postit border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil -rotate-2">
            <div className="text-pencil mb-1"><Award size={32} /></div>
            <span className="text-lg font-bold font-patrick text-pencil">Người sưu tầm</span>
          </div>
        </div>

        {/* Badges & Gamification */}
        <div className="mb-12">
          <h2 className="text-3xl font-kalam font-bold mb-6 flex items-center gap-2 text-pencil rotate-1">
            <Award className="text-marker-red" /> Huy hiệu & Thành tựu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil -rotate-1">
              <div className="w-14 h-14 border-[3px] border-pencil bg-marker-red flex items-center justify-center text-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] shrink-0 rotate-3">
                <Award size={28} />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Người Mới Bắt Đầu</h3>
                <p className="text-sm text-pencil/70 mt-1 font-patrick font-bold">Tạo con tem đầu tiên của bạn.</p>
                {stampCount >= 1 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">Chưa mở khóa</div>
                )}
              </div>
            </div>

            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil rotate-2 transition-opacity ${stampCount >= 5 ? 'opacity-100' : 'opacity-70'}`}>
              <div className="w-14 h-14 border-[3px] border-pencil bg-marker-blue flex items-center justify-center text-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] shrink-0 -rotate-3">
                <MapPin size={28} />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Nhà Thám Hiểm</h3>
                <p className="text-sm text-pencil/70 mt-1 font-patrick font-bold">Tạo tem ở 5 địa điểm khác.</p>
                {stampCount >= 5 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">{Math.min(stampCount, 5)} / 5</div>
                )}
              </div>
            </div>

            <div className="bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil -rotate-2 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 border-[3px] border-pencil bg-postit flex items-center justify-center text-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] shrink-0 rotate-6">
                <Heart size={28} />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Truyền Cảm Hứng</h3>
                <p className="text-sm text-pencil/70 mt-1 font-patrick font-bold">Nhận được 100 lượt thích.</p>
                <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">0 / 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Stamps */}
        <h2 className="text-3xl font-kalam font-bold mb-6 text-pencil -rotate-1">Tem gần đây</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stamps.map((stamp) => (
            <StampCard 
              key={stamp.id} 
              stamp={stamp} 
              showOptions={true}
              onDelete={handleDeleteStamp}
              onEdit={handleEditStampClick}
            />
          ))}
          {stamps.length === 0 && (
            <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
              Bạn chưa có tem nào. Hãy tạo con tem đầu tiên nhé!
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-paper border-[4px] border-pencil wobbly-border-md w-full max-w-2xl overflow-hidden shadow-pencil flex flex-col max-h-[90vh] rotate-1">
            <div className="p-6 border-b-[3px] border-pencil border-dashed flex items-center justify-between bg-white/50">
              <h2 className="text-3xl font-kalam font-bold text-pencil">Chỉnh sửa hồ sơ</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 border-[3px] border-transparent hover:border-pencil hover:bg-muted-paper wobbly-border transition-all">
                <X size={24} className="text-pencil" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white/30">
              {/* Banner Edit */}
              <div className="space-y-3">
                <label className="text-lg font-bold font-patrick text-pencil">Ảnh bìa (Banner)</label>
                <div 
                  className="h-32 wobbly-border bg-cover bg-center border-[3px] border-dashed border-pencil relative group overflow-hidden bg-muted-paper"
                  style={{ backgroundImage: editBannerUrl ? `url(${editBannerUrl})` : "none" }}
                >
                  <div className="absolute inset-0 bg-pencil/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 bg-white border-[3px] border-pencil px-4 py-2 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] text-pencil text-lg font-bold font-patrick hover:bg-muted-paper hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                      <Camera size={20} /> Thay đổi
                    </button>
                    <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
                  </div>
                </div>
              </div>

              {/* Avatar Edit */}
              <div className="space-y-3">
                <label className="text-lg font-bold font-patrick text-pencil">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 overflow-hidden border-[3px] border-pencil wobbly-border bg-white shadow-pencil -rotate-2">
                    <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()} className="px-6 py-2 border-[3px] border-pencil bg-white wobbly-border shadow-pencil font-bold font-patrick text-lg text-pencil hover:bg-muted-paper hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1">
                    Tải ảnh lên
                  </button>
                  <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Vị trí (Location)</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Tiểu sử (Bio)</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d] resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t-[3px] border-pencil border-dashed flex justify-end gap-4 bg-white/50">
              <button onClick={() => setIsEditing(false)} className="px-6 py-3 border-[3px] border-pencil bg-white wobbly-border shadow-pencil font-bold font-patrick text-lg text-pencil hover:bg-muted-paper hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all -rotate-1">
                Hủy
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-3 border-[3px] border-pencil bg-postit wobbly-border shadow-pencil font-bold font-patrick text-lg text-pencil hover:bg-marker-blue hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1 flex items-center gap-2"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stamp Modal */}
      {editingStamp && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-paper border-[4px] border-pencil wobbly-border-md w-full max-w-lg overflow-hidden shadow-pencil flex flex-col max-h-[90vh] -rotate-1">
            <div className="p-6 border-b-[3px] border-pencil border-dashed flex items-center justify-between bg-white/50">
              <h2 className="text-3xl font-kalam font-bold text-pencil">Chỉnh sửa Tem</h2>
              <button onClick={() => setEditingStamp(null)} className="p-2 border-[3px] border-transparent hover:border-pencil hover:bg-muted-paper wobbly-border transition-all">
                <X size={24} className="text-pencil" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/30">
              <div className="flex justify-center mb-6">
                <div className="w-32 bg-white border-[3px] border-pencil p-2 wobbly-border shadow-pencil rotate-2">
                  <img src={editingStamp.imageUrl} alt="Stamp" className="w-full h-auto drop-shadow-sm" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Tên tem</label>
                  <input 
                    type="text" 
                    value={editStampTitle}
                    onChange={(e) => setEditStampTitle(e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Địa điểm</label>
                  <input 
                    type="text" 
                    value={editStampLocation}
                    onChange={(e) => setEditStampLocation(e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil">Câu chuyện</label>
                  <textarea 
                    value={editStampStory}
                    onChange={(e) => setEditStampStory(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d] resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t-[3px] border-pencil border-dashed flex justify-end gap-4 bg-white/50">
              <button onClick={() => setEditingStamp(null)} className="px-6 py-3 border-[3px] border-pencil bg-white wobbly-border shadow-pencil font-bold font-patrick text-lg text-pencil hover:bg-muted-paper hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1">
                Hủy
              </button>
              <button 
                onClick={handleSaveStamp}
                disabled={isSaving}
                className="px-6 py-3 border-[3px] border-pencil bg-marker-blue wobbly-border shadow-pencil font-bold font-patrick text-lg text-white hover:bg-marker-blue/90 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all -rotate-1 flex items-center gap-2"
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
