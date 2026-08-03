"use client";

import { useState, useEffect } from "react";
import { Stamp } from "@/lib/mockData";
import { StampCard } from "@/components/StampCard";
import { Search, SlidersHorizontal, Plus, CheckSquare, Trash2, X, Image as ImageIcon, Pen, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserStamps, deleteStamp, updateStampMetadata } from "@/lib/stampService";
import { getUserAlbums, createAlbum, deleteAlbum, updateAlbum, addStampToAlbum, removeStampFromAlbum, Album } from "@/lib/albumService";

export default function CollectionPage() {
  const { user, loading } = useAuth();
  
  // Data states
  const [stamps, setStamps] = useState<any[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<"all" | "albums" | "album_view">("all");
  const [viewingAlbum, setViewingAlbum] = useState<Album | null>(null);

  // Album Edit/Create states
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");

  // Stamp Selection states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stamp Edit State
  const [editingStamp, setEditingStamp] = useState<any>(null);
  const [editStampTitle, setEditStampTitle] = useState("");
  const [editStampLocation, setEditStampLocation] = useState("");
  const [editStampStory, setEditStampStory] = useState("");

  useEffect(() => {
    if (!user) {
      setIsFetching(false);
      return;
    }
    
    Promise.all([
      getUserStamps(user.uid),
      getUserAlbums(user.uid)
    ]).then(([stampsData, albumsData]) => {
      setStamps(stampsData);
      setAlbums(albumsData);
      setIsFetching(false);
    });
  }, [user]);

  // --- STAMP SELECTION & DELETE ---
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tem đã chọn?`)) return;
    
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteStamp(id);
      }
      setStamps(prev => prev.filter(stamp => !selectedIds.includes(stamp.id)));
      setIsSelectMode(false);
      setSelectedIds([]);
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa tem.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleStamp = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tem này không?")) return;
    try {
      await deleteStamp(id);
      setStamps(stamps.filter(s => s.id !== id));
    } catch (error) {
      alert("Lỗi khi xóa tem.");
    }
  };

  // --- STAMP EDIT ---
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

  // --- ALBUM CRUD ---
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

  if (loading || isFetching) {
    return <div className="min-h-screen flex items-center justify-center font-patrick font-bold text-xl text-pencil">Đang tải bộ sưu tập...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-paper">
        <div className="bg-white border-[3px] border-pencil wobbly-border-md shadow-pencil p-10 max-w-md w-full rotate-1">
          <h1 className="text-4xl font-kalam font-bold mb-4 text-pencil">Bộ sưu tập</h1>
          <p className="text-pencil/70 font-patrick text-lg">Vui lòng đăng nhập để xem và quản lý bộ sưu tập của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 pb-40 bg-paper">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-kalam font-bold text-pencil">Kho tàng Tem</h1>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/40" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm tem..." 
                className="pl-10 pr-4 py-2 border-[3px] border-pencil bg-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] text-pencil font-patrick font-bold focus:outline-none focus:bg-yellow-50 w-full md:w-64"
              />
            </div>
            
            {activeTab === "all" && (
              <button 
                onClick={toggleSelectMode}
                className={`p-2.5 border-[3px] border-pencil wobbly-border transition-all ${isSelectMode ? 'bg-marker-red text-white shadow-none translate-x-[2px] translate-y-[2px] rotate-2' : 'bg-white shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted-paper -rotate-1'}`}
                title="Chọn nhiều tem"
              >
                <CheckSquare size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 font-kalam font-bold text-2xl border-[3px] border-pencil wobbly-border shadow-pencil transition-all ${activeTab === 'all' ? 'bg-marker-blue text-white -rotate-2' : 'bg-white text-pencil hover:bg-muted-paper rotate-1'}`}
          >
            Tất cả Tem ({stamps.length})
          </button>
          <button 
            onClick={() => setActiveTab('albums')}
            className={`px-6 py-2 font-kalam font-bold text-2xl border-[3px] border-pencil wobbly-border shadow-pencil transition-all ${activeTab === 'albums' ? 'bg-marker-red text-white rotate-2' : 'bg-white text-pencil hover:bg-muted-paper -rotate-1'}`}
          >
            Album ({albums.length})
          </button>
        </div>

        {activeTab === "all" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {stamps.map((stamp) => (
              <StampCard 
                key={stamp.id} 
                stamp={stamp} 
                isSelectionMode={isSelectMode}
                isSelected={selectedIds.includes(stamp.id)}
                onToggleSelect={handleToggleSelect}
                showOptions={!isSelectMode}
                onDelete={handleDeleteSingleStamp}
                onEdit={handleEditStampClick}
              />
            ))}
            {stamps.length === 0 && (
              <div className="col-span-full p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
                Bạn chưa có tem nào. Hãy tạo con tem đầu tiên nhé!
              </div>
            )}
          </div>
        ) : activeTab === "albums" ? (
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
                <div className="col-span-full p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white -rotate-1">
                  Bạn chưa có bộ sưu tập nào. Nhấn "Tạo mới" để thêm!
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
                  onDelete={handleDeleteSingleStamp}
                  onEdit={handleEditStampClick}
                />
              ))}
              {stamps.filter(s => viewingAlbum?.stamps?.includes(s.id)).length === 0 && (
                <div className="col-span-full p-10 text-center font-bold font-patrick text-xl text-pencil/50 border-[3px] border-dashed border-pencil wobbly-border bg-white rotate-1">
                  Bộ sưu tập này chưa có tem nào. Hãy thêm tem từ phần "Tất cả tem"!
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Bar for Multiple Selection */}
      {isSelectMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white border-[3px] border-pencil wobbly-border shadow-pencil px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 -rotate-1">
          <span className="font-bold font-patrick text-lg text-pencil">{selectedIds.length} tem đã chọn</span>
          <div className="flex gap-2">
            <button 
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isDeleting}
              className={`flex items-center gap-2 px-4 py-2 border-[3px] border-pencil wobbly-border font-bold font-patrick transition-all ${selectedIds.length > 0 ? 'bg-marker-red hover:bg-marker-red/90 text-white shadow-[2px_2px_0px_0px_#2d2d2d] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]' : 'bg-muted-paper text-pencil/40 cursor-not-allowed'}`}
            >
              {isDeleting ? "Đang xóa..." : <><Trash2 size={16} /> Xóa</>}
            </button>
            <button 
              onClick={toggleSelectMode}
              className="p-2 border-[3px] border-pencil bg-white hover:bg-muted-paper wobbly-border text-pencil transition-colors"
            >
              <X size={18} />
            </button>
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
    </div>
  );
}
