"use client";

import { MapPin, Calendar, Heart, Image as ImageIcon, Award, ArrowLeft, Lock, Globe, UserPlus, Check } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { getUserStamps } from "@/lib/stampService";
import { getUserProfile, UserProfile } from "@/lib/userService";
import { getUserAlbums, Album } from "@/lib/albumService";
import { useAuth } from "@/context/AuthContext";
import { createFriendRequestNotification } from "@/lib/notificationService";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const { user, userProfile: viewerProfile } = useAuth();
  
  const [stampCount, setStampCount] = useState(0);
  const [stamps, setStamps] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Album states
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState<'stamps' | 'albums' | 'album_view'>('stamps');
  const [viewingAlbum, setViewingAlbum] = useState<Album | null>(null);
  
  useEffect(() => {
    if (userId) {
      Promise.all([
        getUserProfile(userId),
        getUserStamps(userId),
        getUserAlbums(userId)
      ]).then(([userProfile, userStamps, userAlbums]) => {
        if (userProfile) {
          setProfile(userProfile);
        } else {
          // If no explicit profile found, just display generic
          setProfile({
            uid: userId,
            displayName: "Người dùng ẩn danh",
            photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
            bio: "Nhà sưu tầm tem Temsy.",
            location: "Chưa rõ",
            bannerUrl: ""
          });
        }

        // Only show public stamps for other users
        const publicStamps = userStamps.filter((s: any) => s.isPublic !== false);
        setStamps(publicStamps);
        setStampCount(publicStamps.length);
        
        setAlbums(userAlbums);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [userId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-patrick text-xl">Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-paper relative">
        <div className="bg-white border-[3px] border-pencil wobbly-border-md shadow-pencil p-10 max-w-md w-full relative z-10 rotate-1">
          <h1 className="text-4xl font-kalam font-bold mb-4 text-pencil">Không tìm thấy</h1>
          <p className="text-pencil/70 mb-8 font-patrick text-lg">Hồ sơ người dùng này không tồn tại hoặc đã bị xóa.</p>
          <Link href="/" className="w-full bg-postit text-pencil py-3 border-[3px] border-pencil wobbly-border shadow-pencil font-bold font-patrick text-xl hover:bg-marker-blue hover:text-white transition-all inline-block -rotate-2">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const handleSendFriendRequest = async () => {
    if (!user || !profile || !viewerProfile) return;
    setIsSaving(true);
    try {
      await createFriendRequestNotification(
        user.uid,
        profile.uid, // profile is the person being viewed
        viewerProfile.displayName || "Người dùng",
        viewerProfile.photoURL
      );
      alert("Đã gửi lời mời kết bạn! Vui lòng chờ phản hồi.");
    } catch (error: any) {
      alert(error.message || "Lỗi khi gửi lời mời kết bạn.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !profile) return;
    if (!confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${profile.displayName}?`)) return;
    setIsSaving(true);
    try {
      const { removeFriend } = await import("@/lib/friendService");
      await removeFriend(user.uid, profile.uid);
      alert("Đã hủy kết bạn!");
      window.location.reload(); 
    } catch (error: any) {
      alert("Lỗi khi hủy kết bạn.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-10 bg-paper relative font-sans">
      {/* Cover Photo */}
      <div 
        className="h-48 md:h-64 bg-muted-paper w-full relative bg-cover bg-center border-b-[3px] border-pencil"
        style={{ backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}
      >
        {!profile.bannerUrl && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>}
        
        <Link href="/" className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-pencil px-4 py-2 wobbly-border text-pencil font-bold font-patrick hover:bg-white shadow-[2px_2px_0px_0px_#2d2d2d] transition-all -rotate-1 active:rotate-0">
          <ArrowLeft size={18} />
          Trang chủ
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Profile Info Header */}
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row gap-6 md:items-end mb-10">
          <div className="relative z-10 flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 border-[4px] border-pencil overflow-hidden bg-white shadow-pencil wobbly-border -rotate-2">
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            </div>
            {/* Badge overlay */}
            <div className="absolute -top-4 -left-4 w-12 h-12 md:w-16 md:h-16 z-20 hover:scale-110 transition-transform duration-300 rotate-3">
              <img src={`/badges/${stampCount >= 50 ? 'legend' : stampCount >= 25 ? 'voyager' : stampCount >= 10 ? 'adventurer' : stampCount >= 5 ? 'traveler' : 'explorer'}.png`} alt="Badge" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md border-[3px] border-pencil p-4 wobbly-border shadow-pencil rotate-1 relative">
              <h1 className="text-4xl font-kalam font-bold text-pencil pr-10">{profile.displayName}</h1>
              <p className="text-pencil/80 mt-1 font-patrick text-lg">{profile.bio}</p>
              <div className="flex gap-4 mt-2 text-sm text-pencil/70 font-patrick font-bold">
                <span className="flex items-center gap-1"><MapPin size={16} /> {profile.location}</span>
                <span className="flex items-center gap-1"><Calendar size={16} /> Thành viên Temsy</span>
              </div>
            </div>

            {/* Friend Action */}
            {user && user.uid !== profile.uid && (
              <div className="flex flex-wrap justify-end gap-3">
                {viewerProfile?.friends?.includes(profile.uid) ? (
                  <button 
                    onClick={handleRemoveFriend} 
                    disabled={isSaving} 
                    className="px-6 py-3 bg-red-50 border-[3px] border-pencil text-marker-red shadow-[2px_2px_0_0_#2d2d2d] wobbly-border font-bold font-patrick text-lg hover:bg-red-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rotate-1 flex items-center gap-2 group"
                  >
                    <Check size={20} className="group-hover:hidden" />
                    <span className="hidden group-hover:inline-block rotate-45 text-xl font-kalam">+</span>
                    <span className="hidden sm:inline group-hover:hidden">{isSaving ? "Đang xử lý..." : "Bạn bè"}</span>
                    <span className="hidden sm:hidden group-hover:inline">{isSaving ? "Đang xử lý..." : "Hủy kết bạn"}</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleSendFriendRequest} 
                    disabled={isSaving} 
                    className="px-6 py-3 bg-postit border-[3px] border-pencil text-pencil shadow-pencil wobbly-border font-bold font-patrick text-lg hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pencil-hover active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all -rotate-1 flex items-center gap-2"
                  >
                    <UserPlus size={20} />
                    <span className="hidden sm:inline">{isSaving ? "Đang gửi..." : "Thêm bạn bè"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border-[3px] border-pencil p-4 flex flex-col items-center justify-center text-center wobbly-border shadow-pencil rotate-1">
            <span className="text-4xl font-bold font-kalam text-marker-blue">{stampCount}</span>
            <span className="text-sm font-bold font-patrick text-pencil/70 flex items-center gap-1 mt-1"><ImageIcon size={16} /> Tem công khai</span>
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
            <span className="text-lg font-bold font-patrick text-pencil">Người sưu tầm</span>
          </div>
        </div>

        {/* Badges & Gamification */}
        <div className="mb-12">
          <h2 className="text-3xl font-kalam font-bold mb-6 flex items-center gap-2 text-pencil rotate-1">
            <Award className="text-marker-red" /> Huy hiệu & Thành tựu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Explorer */}
            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil -rotate-1 transition-opacity ${stampCount >= 1 ? 'opacity-100' : 'opacity-70 grayscale'}`}>
              <div className="w-16 h-16 shrink-0 relative rotate-2">
                <img src="/badges/explorer.png" alt="Explorer" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Tân binh</h3>
                {stampCount >= 1 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">Chưa mở khóa</div>
                )}
              </div>
            </div>

            {/* Traveler */}
            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil rotate-2 transition-opacity ${stampCount >= 5 ? 'opacity-100' : 'opacity-70 grayscale'}`}>
              <div className="w-16 h-16 shrink-0 relative -rotate-3">
                <img src="/badges/traveler.png" alt="Traveler" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Nhà Thám Hiểm</h3>
                {stampCount >= 5 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">{Math.min(stampCount, 5)} / 5 tem</div>
                )}
              </div>
            </div>

            {/* Adventurer */}
            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil -rotate-2 transition-opacity ${stampCount >= 10 ? 'opacity-100' : 'opacity-70 grayscale'}`}>
              <div className="w-16 h-16 shrink-0 relative rotate-3">
                <img src="/badges/adventurer.png" alt="Adventurer" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Kẻ Mạo Hiểm</h3>
                {stampCount >= 10 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">{Math.min(stampCount, 10)} / 10 tem</div>
                )}
              </div>
            </div>

            {/* Voyager */}
            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil rotate-1 transition-opacity ${stampCount >= 25 ? 'opacity-100' : 'opacity-70 grayscale'}`}>
              <div className="w-16 h-16 shrink-0 relative -rotate-2">
                <img src="/badges/voyager.png" alt="Voyager" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Nhà Lữ Hành</h3>
                {stampCount >= 25 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-2 py-1 border-2 border-marker-blue wobbly-border inline-block -rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">{Math.min(stampCount, 25)} / 25 tem</div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className={`bg-white border-[3px] border-pencil p-4 flex items-start gap-4 wobbly-border shadow-pencil -rotate-3 transition-opacity ${stampCount >= 50 ? 'opacity-100' : 'opacity-70 grayscale'}`}>
              <div className="w-16 h-16 shrink-0 relative rotate-1">
                <img src="/badges/legend.png" alt="Legend" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold font-patrick text-xl text-pencil">Huyền Thoại</h3>
                {stampCount >= 50 ? (
                  <div className="mt-2 text-sm font-bold font-patrick text-marker-red bg-red-50 px-2 py-1 border-2 border-marker-red wobbly-border inline-block rotate-2">Đã mở khóa</div>
                ) : (
                  <div className="mt-2 text-sm font-bold font-patrick text-pencil/50 bg-muted-paper px-2 py-1 border-2 border-pencil/30 wobbly-border inline-block">{Math.min(stampCount, 50)} / 50 tem</div>
                )}
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
            <h2 className="text-3xl font-kalam font-bold mb-6 text-marker-blue -rotate-1">Bộ sưu tập tem</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stamps.map((stamp) => (
                <StampCard 
                  key={stamp.id} 
                  stamp={stamp} 
                  showOptions={false}
                />
              ))}
              {stamps.length === 0 && (
                <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
                  Người dùng này chưa có con tem công khai nào.
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'albums' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-kalam font-bold text-marker-red rotate-1">Bộ sưu tập</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {albums.map((album) => {
                // For public profile, only count public stamps in album
                const publicStampsInAlbum = album.stamps?.filter(stampId => stamps.some(s => s.id === stampId)) || [];
                return (
                  <div key={album.id} onClick={() => { setViewingAlbum(album); setActiveTab('album_view'); }} className="bg-white border-[3px] border-pencil p-4 wobbly-border shadow-pencil hover:shadow-pencil-hover transition-all group relative rotate-1 hover:-rotate-1 cursor-pointer">
                    <div className="aspect-square bg-muted-paper border-2 border-pencil border-dashed flex items-center justify-center mb-4 relative overflow-hidden">
                      <ImageIcon className="text-pencil/30" size={48} />
                    </div>
                    <h3 className="font-kalam font-bold text-xl text-pencil truncate">{album.title}</h3>
                    <p className="font-patrick font-bold text-pencil/60">{publicStampsInAlbum.length} tem công khai</p>
                  </div>
                );
              })}
              {albums.length === 0 && (
                <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white -rotate-1">
                  Người dùng này chưa có bộ sưu tập nào.
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
                  showOptions={false}
                />
              ))}
              {stamps.filter(s => viewingAlbum?.stamps?.includes(s.id)).length === 0 && (
                <div className="col-span-4 p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
                  Không có tem công khai nào trong bộ sưu tập này.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
