"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStampById, deleteStamp, updateStampMetadata, getComments, addComment, CommentData } from "@/lib/stampService";
import { createReport } from "@/lib/reportService";
import { sendMessage } from "@/lib/chatService";
import { ArrowLeft, Trash2, Edit3, Save, X, MapPin, Calendar, Heart, Globe, Lock, Send, MessageCircle, Flag, Reply } from "lucide-react";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import Link from "next/link";

export default function StampDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [stamp, setStamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", location: "", date: "", story: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [userAlbums, setUserAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  
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

    getComments(id).then(setComments);
  }, [id]);

  useEffect(() => {
    if (user?.uid) {
      import("@/lib/albumService").then(({ getUserAlbums }) => {
        getUserAlbums(user.uid).then(albums => {
          setUserAlbums(albums);
          const currentAlbum = albums.find(a => a.stamps?.includes(id));
          if (currentAlbum) {
            setSelectedAlbumId(currentAlbum.id);
          }
        });
      });
    }
  }, [user?.uid, id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setIsSubmittingComment(true);
    try {
      const added = await addComment(id, newComment.trim());
      setComments([added, ...comments]);
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Không thể gửi bình luận");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tem này vĩnh viễn?")) return;
    
    try {
      await deleteStamp(id);
      router.back();
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
      
      if (user?.uid) {
        const { setStampAlbums } = await import("@/lib/albumService");
        await setStampAlbums(user.uid, id, selectedAlbumId ? [selectedAlbumId] : []);
      }
      
      setStamp({ ...stamp, metadata: updatedMetadata });
      setIsEditing(false);
    } catch (err) {
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để báo cáo tem này.");
      return;
    }
    const reason = window.prompt("Vui lòng nhập lý do báo cáo (ví dụ: Nội dung phản cảm, Spam, Vi phạm bản quyền...):");
    if (!reason || reason.trim() === "") return;

    try {
      await createReport(id, user.uid, reason.trim(), stamp.metadata?.title, stamp.imageUrl);
      alert("Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xem xét tem này.");
    } catch (err) {
      alert("Lỗi khi gửi báo cáo. Vui lòng thử lại.");
    }
  };

  const handleSendReply = async () => {
    if (!user || !stamp) return;
    setIsReplying(true);
    try {
      await sendMessage(
        user.uid,
        stamp.userId,
        replyMessage.trim() || `Đã phản hồi tem: ${stamp.metadata?.title || "Không tên"}`,
        stamp.imageUrl,
        stamp.id
      );
      alert("Đã gửi phản hồi thành công!");
      setShowReplyModal(false);
      setReplyMessage("");
    } catch (error) {
      alert("Gửi phản hồi thất bại.");
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-patrick font-bold text-xl text-pencil">Đang tải tem...</div>
      </div>
    );
  }

  if (error || !stamp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-paper p-6">
        <div className="bg-white border-[4px] border-pencil wobbly-border-md p-10 rotate-2 max-w-md w-full text-center shadow-pencil">
          <h1 className="text-4xl font-kalam font-bold text-marker-red mb-4">Lỗi</h1>
          <p className="font-patrick text-xl text-pencil mb-6">{error || "Không tìm thấy tem này."}</p>
          <button onClick={() => router.back()} className="px-6 py-3 border-[3px] border-pencil bg-marker-blue text-white font-bold font-patrick text-xl wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:-translate-y-1 hover:shadow-pencil transition-all -rotate-1">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === stamp.userId;

  return (
    <div className="min-h-screen p-6 md:p-12 pb-32 bg-paper text-pencil">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted-paper transition-all -rotate-1 font-bold font-patrick text-lg">
            <ArrowLeft size={20} />
            Quay lại
          </button>
          
          {isOwner && !isEditing && (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-muted-paper transition-all rotate-1 font-bold font-patrick text-lg text-marker-blue"
              >
                <Edit3 size={18} /> Sửa
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-red-50 transition-all -rotate-1 font-bold font-patrick text-lg text-marker-red"
              >
                <Trash2 size={18} /> Xóa
              </button>
            </div>
          )}
          {!isOwner && user && !stamp.metadata?.isSecret && (
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReplyModal(true)}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-yellow-50 transition-all -rotate-1 font-bold font-patrick text-lg text-marker-blue"
              >
                <Reply size={18} /> Phản hồi
              </button>
              <button 
                onClick={handleReport}
                className="flex items-center gap-2 p-3 bg-white border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-red-50 transition-all rotate-1 font-bold font-patrick text-lg text-marker-red"
              >
                <Flag size={18} /> Báo cáo
              </button>
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Stamp Display */}
          <div className="w-full lg:w-1/2 flex justify-center sticky top-12">
            <div className="w-full max-w-4xl bg-white border-[4px] border-pencil p-4 md:p-6 wobbly-border-md shadow-pencil rotate-1 relative">
              {stamp.metadata?.isSecret && !isOwner ? (
                <div className="w-full aspect-[4/3] bg-muted-paper/50 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-pencil/20">
                  <Lock size={64} className="text-pencil/40 mb-4" />
                  <h3 className="font-kalam font-bold text-3xl text-pencil mb-2">Kho Báu Bị Khóa</h3>
                  <p className="font-patrick text-pencil/70 text-lg">
                    Đây là một Tem Ẩn Định Vị. Bạn chỉ có thể mở khóa nó bằng cách đi đến đúng địa điểm này và mở qua Bản Đồ!
                  </p>
                  <Link href="/map" className="mt-6 px-6 py-2 border-[3px] border-pencil bg-marker-red text-white font-bold font-patrick text-xl wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] hover:-translate-y-1 hover:shadow-pencil transition-all -rotate-1">
                    Mở Bản Đồ
                  </Link>
                </div>
              ) : (
                <img 
                  src={stamp.imageUrl} 
                  alt={stamp.metadata.title}
                  className="w-full h-auto drop-shadow-md"
                />
              )}
            </div>

          </div>

          {/* Metadata / Editor */}
          <div className="w-full lg:w-1/2 bg-white border-[4px] border-pencil p-6 md:p-10 wobbly-border-md shadow-pencil -rotate-1 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-32 h-8 bg-black/10 rotate-3" style={{ clipPath: "polygon(0 0%, 100% 5%, 95% 100%, 5% 95%)" }}></div>
            
            {isEditing ? (
              <div className="space-y-6">
                <h2 className="text-4xl font-kalam font-bold text-marker-red mb-8">Sửa Kỷ Niệm</h2>
                
                <div className="space-y-2">
                  <label className="text-xl font-bold font-patrick">Tiêu đề</label>
                  <input 
                    type="text" 
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="space-y-2 flex-1">
                    <label className="text-xl font-bold font-patrick">Địa điểm</label>
                    <input 
                      type="text" 
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-xl font-bold font-patrick">Ngày tháng</label>
                    <input 
                      type="text" 
                      value={editData.date}
                      onChange={(e) => setEditData({...editData, date: e.target.value})}
                      className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xl font-bold font-patrick">Câu chuyện</label>
                  <textarea 
                    value={editData.story}
                    onChange={(e) => setEditData({...editData, story: e.target.value})}
                    className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50 min-h-[150px] resize-none"
                    placeholder="Viết một câu chuyện..."
                  />
                </div>
                
                {userAlbums.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xl font-bold font-patrick">Bộ sưu tập</label>
                    <select
                      value={selectedAlbumId}
                      onChange={(e) => setSelectedAlbumId(e.target.value)}
                      className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-xl font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                    >
                      <option value="">-- Không chọn bộ sưu tập --</option>
                      {userAlbums.map(album => (
                        <option key={album.id} value={album.id}>{album.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border-[3px] border-pencil bg-white wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] font-bold font-patrick text-xl hover:bg-muted-paper transition-all flex items-center justify-center gap-2"
                  >
                    <X size={20} /> Hủy
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex-1 py-3 border-[3px] border-pencil bg-marker-blue text-white wobbly-border shadow-pencil font-bold font-patrick text-xl hover:-translate-y-1 hover:shadow-pencil-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? "Đang lưu..." : <><Save size={20} /> Lưu lại</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h1 className="text-5xl font-kalam font-bold text-pencil leading-tight break-words">{stamp.metadata.title || "Kỷ niệm không tên"}</h1>
                  
                  <Link href={`/profile/${stamp.userId}`} className="mt-4 flex items-center gap-3 group w-max">
                    <img src={stamp.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"} alt={stamp.userName} className="w-10 h-10 rounded-full border-2 border-pencil object-cover group-hover:scale-110 transition-transform shadow-sm" />
                    <span className="font-kalam text-xl font-bold text-pencil group-hover:text-marker-blue transition-colors">bởi {stamp.userName || "Người dùng ẩn danh"}</span>
                  </Link>
                  
                  <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-xl font-bold font-patrick bg-postit border-2 border-pencil px-4 py-2 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] rotate-1">
                      <MapPin size={20} className="text-marker-red" />
                      {stamp.metadata.location || "Chưa ghim địa điểm"}
                    </div>
                    {stamp.metadata.date && (
                      <div className="flex items-center gap-2 text-xl font-bold font-patrick bg-white border-2 border-pencil px-4 py-2 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1">
                        <Calendar size={20} className="text-marker-blue" />
                        {stamp.metadata.date}
                      </div>
                    )}
                  </div>
                </div>
                
                {stamp.metadata?.isSecret && !isOwner ? (
                  <div className="mt-8 border-l-[4px] border-pencil pl-6 relative">
                    <div className="absolute -left-6 -top-4 text-4xl text-marker-red font-kalam font-bold rotate-12">&quot;</div>
                    <div className="bg-muted-paper/50 border-2 border-dashed border-pencil/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                      <Lock size={20} className="text-pencil/40" />
                      <span className="text-sm font-patrick italic text-pencil/50">Câu chuyện đang bị khóa...</span>
                    </div>
                  </div>
                ) : stamp.metadata.story && (
                  <div className="mt-8 border-l-[4px] border-pencil pl-6 relative">
                    <div className="absolute -left-6 -top-4 text-4xl text-marker-red font-kalam font-bold rotate-12">&quot;</div>
                    <p className="text-2xl font-patrick leading-relaxed text-pencil/90 whitespace-pre-wrap italic">
                      {stamp.metadata.story}
                    </p>
                  </div>
                )}

                {stamp.metadata?.audioData && (!stamp.metadata?.isSecret || isOwner) && (
                  <div className="mt-8 bg-muted-paper border-2 border-pencil rounded-xl p-4 wobbly-border shadow-[4px_4px_0_0_#2d2d2d] flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full border-[3px] border-pencil flex items-center justify-center animate-[spin_10s_linear_infinite]">
                      🎵
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="text-sm font-patrick font-bold text-pencil">Âm thanh kỷ niệm</div>
                      <audio src={stamp.metadata.audioData} controls className="w-full max-w-[250px]" />
                    </div>
                  </div>
                )}
                
                <div className="pt-8 mt-8 border-t-[3px] border-pencil border-dashed grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Phong cách</div>
                    <div className="text-xl font-bold font-kalam text-pencil">{stamp.style}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Trạng thái</div>
                    <div className="text-xl font-bold font-patrick flex items-center gap-2">
                      {stamp.isPublic === false ? <><Lock size={18} className="text-marker-red" /> Riêng tư</> : <><Globe size={18} className="text-marker-blue" /> Công khai</>}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-patrick text-pencil/60 mb-1">Lượt thích</div>
                    <div className="text-xl font-bold font-patrick flex items-center gap-2 text-marker-red">
                      <Heart size={18} className="fill-marker-red" /> {stamp.likes || 0}
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="pt-8 mt-8 border-t-[3px] border-pencil border-dashed">
                  <h3 className="text-2xl font-bold font-kalam text-pencil flex items-center gap-2 mb-6">
                    <MessageCircle className="text-marker-blue" />
                    Bình luận ({comments.length})
                  </h3>
                  
                  {/* New Comment Input */}
                  {user ? (
                    <form onSubmit={handleAddComment} className="mb-8 flex gap-3">
                      <AvatarWithBadge 
                        avatarUrl={userProfile?.photoURL || user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"} 
                        name={userProfile?.displayName || user.displayName || "User"}
                        size="sm"
                        stampCount={(userProfile as any)?.stampCount}
                      />
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Viết bình luận..."
                          className="w-full px-4 py-2 pr-12 border-2 border-pencil bg-white wobbly-border text-lg font-patrick shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                        />
                        <button 
                          type="submit" 
                          disabled={isSubmittingComment || !newComment.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-marker-blue disabled:opacity-50 hover:scale-110 transition-transform"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mb-8 p-4 bg-muted-paper/50 border-2 border-dashed border-pencil/20 rounded-xl text-center">
                      <p className="text-lg font-patrick text-pencil/60">
                        Vui lòng <Link href="/login" className="text-marker-blue font-bold hover:underline">đăng nhập</Link> để bình luận
                      </p>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-6">
                    {comments.map((comment) => {
                      const dateStr = comment.createdAt?.toMillis ? new Date(comment.createdAt.toMillis()).toLocaleDateString('vi-VN') : "Vừa xong";
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <Link href={`/profile/${comment.userId}`} className="flex-shrink-0 group">
                            <div className="group-hover:scale-110 transition-transform">
                              <AvatarWithBadge 
                                avatarUrl={comment.userAvatar} 
                                name={comment.userName}
                                size="sm"
                                stampCount={comment.userStampCount}
                              />
                            </div>
                          </Link>
                          <div>
                            <div className="bg-postit/30 border-2 border-pencil p-3 wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] inline-block">
                              <div className="flex items-baseline gap-2 mb-1">
                                <Link href={`/profile/${comment.userId}`} className="font-bold font-kalam text-lg text-pencil hover:text-marker-blue transition-colors">
                                  {comment.userName}
                                </Link>
                                <span className="text-xs font-patrick text-pencil/50">{dateStr}</span>
                              </div>
                              <p className="font-patrick text-lg text-pencil whitespace-pre-wrap leading-tight">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {comments.length === 0 && (
                      <p className="text-center font-patrick text-lg text-pencil/50 italic py-4">
                        Chưa có bình luận nào. Hãy là người đầu tiên!
                      </p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-[4px] border-pencil wobbly-border-md p-6 max-w-sm w-full font-patrick relative rotate-1 shadow-pencil">
            <button 
              onClick={() => setShowReplyModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-marker-red border-2 border-pencil rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform z-10"
            >
              <X size={16} />
            </button>
            
            <h3 className="font-kalam font-bold text-2xl text-marker-blue mb-4">Phản hồi Tem</h3>
            
            <div className="mb-4 aspect-video rounded border-2 border-pencil overflow-hidden bg-muted-paper flex items-center justify-center">
              <img src={stamp.imageUrl} alt="preview" className="w-full h-full object-cover opacity-80" />
            </div>
            
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              className="w-full p-3 border-2 border-pencil bg-yellow-50 focus:outline-none focus:bg-white resize-none h-24 mb-4 text-lg wobbly-border shadow-sm"
            />
            
            <button
              onClick={handleSendReply}
              disabled={isReplying}
              className="w-full py-3 bg-marker-blue border-2 border-pencil text-white font-bold text-xl shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isReplying ? "Đang gửi..." : <><Send size={20} /> Gửi tin nhắn</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
