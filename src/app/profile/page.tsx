"use client";

import { MOCK_STAMPS, MOCK_ALBUMS } from "@/lib/mockData";
import { Settings, MapPin, Calendar, Heart, Image as ImageIcon, Award, Camera, X, LogOut, Plus, Trash2, Pen, ArrowLeft, ShieldAlert } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserStamps, deleteStamp, updateStampMetadata } from "@/lib/stampService";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/userService";
import { compressImage } from "@/lib/imageUtils";
import { getUserAlbums, createAlbum, deleteAlbum, updateAlbum, addStampToAlbum, removeStampFromAlbum, Album } from "@/lib/albumService";

export default function ProfilePage() {
  const { user, userProfile, loading, logout } = useAuth();
  const router = useRouter();
  const [stampCount, setStampCount] = useState(0);
  const [stamps, setStamps] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Album states
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState<'stamps' | 'albums' | 'album_view'>('stamps');
  const [viewingAlbum, setViewingAlbum] = useState<Album | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");
  
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
      
      getUserAlbums(user.uid).then(data => setAlbums(data));
      
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const maxWidth = type === 'avatar' ? 256 : 1024;
      const base64 = await compressImage(file, maxWidth, 0.6);
      if (type === 'avatar') setEditAvatarUrl(base64);
      if (type === 'banner') setEditBannerUrl(base64);
    } catch (error) {
      alert("Lỗi xử lý ảnh.");
    }
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
    try {
      const base64 = await compressImage(file, 1024, 0.6);
      await updateUserProfile(user.uid, { bannerUrl: base64 });
      setProfile({ ...profile, bannerUrl: base64 });
    } catch (error) {
      alert("Lỗi cập nhật ảnh bìa. Kích thước ảnh có thể quá lớn.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
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

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    setIsSaving(true);
    try {
      const newAlbum = await createAlbum(newAlbumTitle.trim());
      setAlbums([newAlbum, ...albums]);
      setNewAlbumTitle("");
      setIsCreatingAlbum(false);
    } catch (error) {
      alert("Lỗi khi tạo bộ sưu tập.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAlbum = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ sưu tập này không? Các tem bên trong vẫn sẽ được giữ lại.")) return;
    try {
      await deleteAlbum(id);
      setAlbums(albums.filter(a => a.id !== id));
      if (viewingAlbum?.id === id) {
        setActiveTab('albums');
        setViewingAlbum(null);
      }
    } catch (error) {
      alert("Lỗi khi xóa bộ sưu tập.");
    }
  };

  const handleEditAlbumClick = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAlbum(album);
    setEditAlbumTitle(album.title);
  };

  const handleSaveAlbum = async () => {
    if (!editingAlbum || !editAlbumTitle.trim()) return;
    setIsSaving(true);
    try {
      await updateAlbum(editingAlbum.id, editAlbumTitle.trim());
      setAlbums(albums.map(a => a.id === editingAlbum.id ? { ...a, title: editAlbumTitle.trim() } : a));
      if (viewingAlbum?.id === editingAlbum.id) {
        setViewingAlbum({ ...viewingAlbum, title: editAlbumTitle.trim() });
      }
      setEditingAlbum(null);
    } catch (error) {
      alert("Lỗi cập nhật tên bộ sưu tập.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStampInAlbum = async (albumId: string, stampId: string, shouldAdd: boolean) => {
    try {
      if (shouldAdd) {
        await addStampToAlbum(albumId, stampId);
        setAlbums(albums.map(a => a.id === albumId ? { ...a, stamps: [...(a.stamps || []), stampId] } : a));
      } else {
        await removeStampFromAlbum(albumId, stampId);
        setAlbums(albums.map(a => a.id === albumId ? { ...a, stamps: (a.stamps || []).filter(id => id !== stampId) } : a));
      }
    } catch (error) {
      alert("Lỗi cập nhật bộ sưu tập.");
    }
  };

  if (loading || (user && !profile)) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-paper relative">


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
            
            <div className="flex flex-wrap justify-end gap-3">
              {(userProfile?.role === "admin" || profile?.role === "admin") && (
                <Link
                  href="/admin"
                  className="px-6 py-3 bg-marker-red border-[3px] border-pencil text-white shadow-pencil wobbly-border font-bold font-patrick text-lg hover:bg-red-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rotate-1 flex items-center gap-2"
                >
                  <ShieldAlert size={20} />
                  <span>Admin</span>
                </Link>
              )}
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
            <span className="text-4xl font-bold font-kalam text-marker-blue">{albums.length}</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><ImageIcon size={16} /> Album</span>
          </div>
          <div className="bg-white border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil rotate-2">
            <span className="text-4xl font-bold font-kalam text-marker-blue">0</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><Heart size={16} /> Lượt thích</span>
          </div>
          <div className="bg-postit border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil -rotate-2">
            <div className="text-pencil mb-1"><Award size={32} /></div>
            <span className="text-lg font-bold font-patrick text-pencil">{profile.title || "Tân binh"}</span>
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

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('stamps')}
            className={`px-6 py-2 font-kalam font-bold text-2xl border-[3px] border-pencil wobbly-border shadow-pencil transition-all ${activeTab === 'stamps' ? 'bg-marker-blue text-white -rotate-2' : 'bg-white text-pencil hover:bg-muted-paper rotate-1'}`}
          >
            Tất cả Tem
          </button>
          <button 
            onClick={() => setActiveTab('albums')}
            className={`px-6 py-2 font-kalam font-bold text-2xl border-[3px] border-pencil wobbly-border shadow-pencil transition-all ${activeTab === 'albums' ? 'bg-marker-red text-white rotate-2' : 'bg-white text-pencil hover:bg-muted-paper -rotate-1'}`}
          >
            Bộ Sưu Tập
          </button>
        </div>

        {/* User's Stamps or Albums */}
        {activeTab === 'stamps' ? (
          <>
            <h2 className="text-3xl font-kalam font-bold mb-6 text-marker-blue -rotate-1">Tem gần đây</h2>
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
          </>
        ) : activeTab === 'albums' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-kalam font-bold text-marker-red rotate-1">Bộ sưu tập của bạn</h2>
              <button 
                onClick={() => setIsCreatingAlbum(true)}
                className="flex items-center gap-2 bg-postit text-pencil px-4 py-2 font-bold font-patrick border-[3px] border-pencil wobbly-border shadow-pencil hover:bg-marker-red hover:text-white hover:-translate-y-1 transition-all -rotate-1"
              >
                <Plus size={20} /> Tạo mới
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {albums.map((album) => (
                <div key={album.id} onClick={() => { setViewingAlbum(album); setActiveTab('album_view'); }} className="bg-white border-[3px] border-pencil p-4 wobbly-border shadow-pencil hover:shadow-pencil-hover transition-all group relative rotate-1 hover:-rotate-1 cursor-pointer">
                  <div className="aspect-square bg-muted-paper border-2 border-pencil border-dashed flex items-center justify-center mb-4 relative overflow-hidden">
                    <ImageIcon className="text-pencil/30" size={48} />
                  </div>
                  <h3 className="font-kalam font-bold text-xl text-pencil truncate">{album.title}</h3>
                  <p className="font-patrick font-bold text-pencil/60">{album.stamps?.length || 0} tem</p>
                  
                  <button 
                    onClick={(e) => handleEditAlbumClick(album, e)}
                    className="absolute top-2 right-12 bg-white border-2 border-pencil text-marker-blue p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marker-blue hover:text-white"
                  >
                    <Pen size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteAlbum(album.id, e)}
                    className="absolute top-2 right-2 bg-white border-2 border-pencil text-marker-red p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marker-red hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {albums.length === 0 && (
                <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white -rotate-1">
                  Bạn chưa có bộ sưu tập nào. Nhấn &quot;Tạo mới&quot; để thêm!
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Album View */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => { setActiveTab('albums'); setViewingAlbum(null); }} className="p-2 border-2 border-pencil bg-white hover:bg-muted-paper wobbly-border -rotate-1 transition-all">
                  <ArrowLeft size={20} className="text-pencil" />
                </button>
                <h2 className="text-3xl font-kalam font-bold text-marker-red rotate-1">{viewingAlbum?.title}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stamps.filter(s => viewingAlbum?.stamps?.includes(s.id)).map((stamp) => (
                <StampCard 
                  key={stamp.id} 
                  stamp={stamp} 
                  showOptions={true}
                  onDelete={handleDeleteStamp}
                  onEdit={handleEditStampClick}
                />
              ))}
              {stamps.filter(s => viewingAlbum?.stamps?.includes(s.id)).length === 0 && (
                <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
                  Bộ sưu tập này chưa có tem nào. Hãy thêm tem từ phần "Tất cả tem"!
                </div>
              )}
            </div>
          </>
        )}
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
                {/* Adding to Album */}
                <div className="space-y-2">
                  <label className="text-lg font-bold font-patrick text-pencil block">Thuộc bộ sưu tập</label>
                  <div className="flex flex-wrap gap-2">
                    {albums.length === 0 ? (
                      <span className="text-sm font-patrick text-pencil/50 italic">Bạn chưa có bộ sưu tập nào.</span>
                    ) : (
                      albums.map(album => {
                        const isSelected = album.stamps?.includes(editingStamp.id);
                        return (
                          <button
                            key={album.id}
                            onClick={() => toggleStampInAlbum(album.id, editingStamp.id, !isSelected)}
                            className={`px-3 py-1 border-2 border-pencil wobbly-border font-patrick font-bold text-sm transition-all ${isSelected ? 'bg-marker-red text-white -rotate-2' : 'bg-white text-pencil hover:bg-muted-paper rotate-1'}`}
                          >
                            {album.title}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

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
      {/* Create Album Modal */}
      {isCreatingAlbum && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-paper border-[4px] border-pencil wobbly-border-md w-full max-w-sm overflow-hidden shadow-pencil flex flex-col rotate-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-kalam font-bold text-marker-red">Tạo Bộ Sưu Tập</h2>
              <button onClick={() => setIsCreatingAlbum(false)} className="p-2 border-[3px] border-transparent hover:border-pencil hover:bg-white wobbly-border transition-all">
                <X size={24} className="text-pencil" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-lg font-bold font-patrick text-pencil block mb-2">Tên bộ sưu tập</label>
                <input 
                  type="text" 
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="Ví dụ: Chuyến đi Đà Lạt"
                  className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  autoFocus
                />
              </div>
            </div>
            
            <button 
              onClick={handleCreateAlbum}
              disabled={isSaving || !newAlbumTitle.trim()}
              className="w-full py-3 border-[3px] border-pencil bg-marker-red wobbly-border shadow-pencil font-bold font-patrick text-xl text-white hover:bg-marker-red/90 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Đang tạo..." : "Xác nhận tạo"}
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Album Modal */}
      {editingAlbum && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-paper border-[4px] border-pencil wobbly-border-md w-full max-w-sm overflow-hidden shadow-pencil flex flex-col -rotate-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-kalam font-bold text-marker-blue">Đổi tên Bộ Sưu Tập</h2>
              <button onClick={() => setEditingAlbum(null)} className="p-2 border-[3px] border-transparent hover:border-pencil hover:bg-white wobbly-border transition-all">
                <X size={24} className="text-pencil" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-lg font-bold font-patrick text-pencil block mb-2">Tên mới</label>
                <input 
                  type="text" 
                  value={editAlbumTitle}
                  onChange={(e) => setEditAlbumTitle(e.target.value)}
                  className="w-full px-4 py-3 border-[3px] border-pencil wobbly-border bg-white text-pencil font-patrick text-lg focus:outline-none focus:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#2d2d2d]"
                  autoFocus
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveAlbum}
              disabled={isSaving || !editAlbumTitle.trim()}
              className="w-full py-3 border-[3px] border-pencil bg-marker-blue wobbly-border shadow-pencil font-bold font-patrick text-xl text-white hover:bg-marker-blue/90 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
