"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserTitle, deleteUserProfile, createNewUser } from "@/lib/adminService";
import { createPersonalNotification } from "@/lib/notificationService";
import { Search, Edit2, Trash2, UserPlus, X, Save, Key, Shield, Bell, Copy, Check, Gift, Ban, Unlock } from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { Uploader } from "@/components/Uploader";
import { createRewardNotification } from "@/lib/notificationService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  // Add user state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", name: "", role: "user" as "admin" | "user" });
  const [addLoading, setAddLoading] = useState(false);
  
  // View user modal
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  
  // Reward modal
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({ uid: "", name: "", title: "", content: "", badgeTitle: "", badgeImage: "" });
  const [rewardLoading, setRewardLoading] = useState(false);

  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Ban modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({ uid: "", name: "", reason: "", duration: "1_day" });
  const [banLoading, setBanLoading] = useState(false);

  const handleCopyUid = (uid: string) => {
    const shortUid = uid.substring(uid.length - 4);
    navigator.clipboard.writeText(shortUid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime());
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      alert("Lỗi tải danh sách người dùng");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditTitle = async (uid: string) => {
    try {
      await updateUserTitle(uid, editTitle);
      setUsers(users.map(u => u.id === uid ? { ...u, title: editTitle } : u));
      setEditingId(null);
    } catch (err) {
      alert("Lỗi khi cập nhật danh hiệu");
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ của ${name}? Tài khoản đăng nhập của họ sẽ trở thành tài khoản mới hoàn toàn và mất hết liên kết dữ liệu.`)) {
      try {
        await deleteUserProfile(uid);
        setUsers(users.filter(u => u.id !== uid));
      } catch (err) {
        alert("Lỗi khi xóa người dùng");
      }
    }
  };

  const handleSendNotification = async (uid: string, name: string) => {
    const message = window.prompt(`Gửi thông báo riêng cho ${name}:`);
    if (!message || message.trim() === "") return;
    
    try {
      await createPersonalNotification(uid, 'system', 'Thông báo từ Ban Quản Trị', message.trim());
      alert("Đã gửi thông báo thành công!");
    } catch (err) {
      alert("Lỗi khi gửi thông báo.");
    }
  };

  const handleOpenRewardModal = (user: any) => {
    setRewardForm({ uid: user.id, name: user.displayName || user.name, title: "", content: "", badgeTitle: "", badgeImage: "" });
    setShowRewardModal(true);
  };

  const handleSendReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.title || !rewardForm.content) {
      alert("Vui lòng nhập đủ Tiêu đề và Nội dung phần thưởng!");
      return;
    }
    try {
      setRewardLoading(true);
      await createRewardNotification(
        rewardForm.uid,
        rewardForm.title,
        rewardForm.content,
        rewardForm.badgeTitle,
        rewardForm.badgeImage
      );
      alert("Đã gửi phần thưởng thành công!");
      setShowRewardModal(false);
      setRewardForm({ uid: "", name: "", title: "", content: "", badgeTitle: "", badgeImage: "" });
    } catch (err) {
      console.error(err);
      alert("Lỗi gửi phần thưởng.");
    } finally {
      setRewardLoading(false);
    }
  };

  const handleOpenBanModal = (user: any) => {
    setBanForm({ uid: user.id, name: user.displayName || user.name, reason: "", duration: "1_day" });
    setShowBanModal(true);
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banForm.reason) {
      alert("Vui lòng nhập lý do cấm!");
      return;
    }
    
    let banUntil = null;
    const now = Date.now();
    if (banForm.duration === "1_hour") banUntil = now + 60 * 60 * 1000;
    else if (banForm.duration === "1_day") banUntil = now + 24 * 60 * 60 * 1000;
    else if (banForm.duration === "7_days") banUntil = now + 7 * 24 * 60 * 60 * 1000;
    else if (banForm.duration === "30_days") banUntil = now + 30 * 24 * 60 * 60 * 1000;

    try {
      setBanLoading(true);
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", banForm.uid), {
        isBanned: true,
        banReason: banForm.reason,
        banUntil: banUntil
      });
      alert("Đã cấm người dùng thành công!");
      setShowBanModal(false);
      setBanForm({ uid: "", name: "", reason: "", duration: "1_day" });
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cấm người dùng.");
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnbanUser = async (uid: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn mở khóa cho ${name}?`)) return;
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", uid), {
        isBanned: false,
        banReason: null,
        banUntil: null
      });
      alert("Đã mở khóa thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi mở khóa người dùng.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    
    try {
      setAddLoading(true);
      await createNewUser(addForm.email, addForm.password, addForm.name, addForm.role);
      alert("Tạo người dùng thành công!");
      setShowAddModal(false);
      setAddForm({ email: "", password: "", name: "", role: "user" });
      // onSnapshot sẽ tự động cập nhật danh sách
    } catch (err: any) {
      console.error(err);
      alert("Lỗi tạo người dùng: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName || u.name)?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-kalam font-bold text-pencil leading-tight">Quản lý người dùng</h1>
          <p className="font-patrick text-pencil/70 text-lg">Có tổng cộng {users.length} người dùng trên hệ thống</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-marker-red text-white font-bold font-patrick text-lg border-[3px] border-pencil rounded-xl wobbly-border shadow-pencil hover:-translate-y-1 hover:shadow-pencil-hover transition-all"
        >
          <UserPlus size={20} /> Thêm tài khoản mới
        </button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên, email, danh hiệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg font-patrick bg-white border-[3px] border-pencil rounded-xl wobbly-border shadow-[4px_4px_0_0_rgba(45,45,45,0.1)] focus:outline-none focus:shadow-pencil transition-shadow"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pencil/50" size={24} />
      </div>

      {/* Users Table */}
      <div className="bg-white border-[3px] border-pencil rounded-xl overflow-hidden wobbly-border shadow-pencil">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-patrick">
            <thead className="bg-muted-paper border-b-2 border-pencil/20">
              <tr>
                <th className="p-4 font-bold text-pencil text-lg">Người dùng</th>
                <th className="p-4 font-bold text-pencil text-lg text-center">UID</th>
                <th className="p-4 font-bold text-pencil text-lg">Danh hiệu</th>
                <th className="p-4 font-bold text-pencil text-lg">Vai trò</th>
                <th className="p-4 font-bold text-pencil text-lg text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-pencil/50 text-lg font-bold">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-pencil/50 text-lg font-bold">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b-2 border-dashed border-pencil/10 hover:bg-yellow-50/50 transition-colors">
                    <td className="p-4 cursor-pointer hover:bg-yellow-100/30" onClick={() => setViewingUser(user)}>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 flex items-center justify-center font-kalam font-bold">
                          <AvatarWithBadge 
                            avatarUrl={user.photoURL || user.avatar || ""} 
                            name={user.displayName || user.name || "U"}
                            stampCount={user.stampCount}
                            customBadgeTitle={user.customBadgeTitle}
                            customBadgeImage={user.customBadgeImage}
                            size="sm"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-pencil text-lg">{user.displayName || user.name}</div>
                          <div className="text-sm text-pencil/60 flex items-center gap-1">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-pencil text-lg font-mono">
                          {user.id.substring(user.id.length - 4)}
                        </span>
                        <button
                          onClick={() => handleCopyUid(user.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Sao chép UID"
                        >
                          {copiedUid === user.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-pencil/50" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-3 py-1 border-2 border-pencil rounded-lg w-full max-w-[150px] font-bold"
                            autoFocus
                          />
                          <button onClick={() => handleEditTitle(user.id)} className="p-1.5 text-marker-blue bg-blue-50 rounded-lg border border-marker-blue/20">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-pencil/50 hover:bg-muted-paper rounded-lg">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="font-bold text-marker-blue bg-marker-blue/10 border border-marker-blue/20 px-3 py-1 rounded-full text-sm">
                            {user.title || "Tân binh"}
                          </span>
                          <button 
                            onClick={() => { setEditingId(user.id); setEditTitle(user.title || "Tân binh"); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-pencil/50 hover:text-marker-blue transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {user.role === "admin" ? (
                          <span className="flex items-center gap-1 text-marker-red font-bold font-patrick text-sm bg-red-50 border border-red-100 px-3 py-1 rounded-full w-max">
                            <Shield size={14} /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-pencil/60 font-bold font-patrick text-sm bg-gray-50 border border-gray-100 px-3 py-1 rounded-full w-max">
                            Người dùng
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="flex items-center gap-1 text-red-700 font-bold font-patrick text-sm bg-red-100 border border-red-200 px-3 py-1 rounded-full w-max">
                            <Ban size={14} /> Đã bị cấm
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleSendNotification(user.id, user.displayName || user.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent text-pencil/40 hover:text-marker-blue hover:bg-blue-50 hover:border-marker-blue/20 transition-all"
                          title="Gửi thông báo"
                        >
                          <Bell size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenRewardModal(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent text-pencil/40 hover:text-marker-red hover:bg-red-50 hover:border-marker-red/20 transition-all"
                          title="Tặng thưởng"
                        >
                          <Gift size={18} />
                        </button>
                        {user.isBanned ? (
                          <button 
                            onClick={() => handleUnbanUser(user.id, user.displayName || user.name)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent text-pencil/40 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all"
                            title="Mở khóa tài khoản"
                          >
                            <Unlock size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenBanModal(user)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent text-pencil/40 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                            title="Cấm tài khoản"
                          >
                            <Ban size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(user.id, user.displayName || user.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent text-pencil/40 hover:text-marker-red hover:bg-red-50 hover:border-marker-red/20 transition-all"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[4px] border-pencil p-6 rounded-2xl wobbly-border-md shadow-pencil max-w-md w-full relative -rotate-1">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-pencil/50 hover:text-pencil"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-kalam font-bold text-marker-red mb-6">Thêm Tài Khoản</h2>
            
            <form onSubmit={handleAddUser} className="space-y-4 font-patrick">
              <div>
                <label className="block font-bold text-lg text-pencil mb-1">Tên hiển thị</label>
                <input 
                  type="text" 
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                  className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-lg shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                  placeholder="Vd: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block font-bold text-lg text-pencil mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-lg shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block font-bold text-lg text-pencil mb-1">Mật khẩu (ít nhất 6 ký tự)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-lg shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50 pl-10"
                    placeholder="Mật khẩu bí mật"
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/40" size={18} />
                </div>
              </div>
              <div>
                <label className="block font-bold text-lg text-pencil mb-1">Phân quyền</label>
                <select 
                  value={addForm.role}
                  onChange={(e) => setAddForm({...addForm, role: e.target.value as any})}
                  className="w-full px-4 py-3 border-[3px] border-pencil bg-white wobbly-border text-lg shadow-[2px_2px_0px_0px_#2d2d2d] focus:outline-none focus:bg-yellow-50"
                >
                  <option value="user">Người dùng (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              
              <button 
                type="submit"
                disabled={addLoading}
                className="w-full mt-4 py-3 bg-marker-red text-white font-bold text-xl border-[3px] border-pencil wobbly-border shadow-pencil hover:-translate-y-1 hover:shadow-pencil-hover transition-all disabled:opacity-50"
              >
                {addLoading ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-pencil/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[4px] border-pencil p-6 rounded-2xl wobbly-border-md shadow-pencil max-w-md w-full relative rotate-1">
            <button 
              onClick={() => setViewingUser(null)}
              className="absolute top-4 right-4 text-pencil/50 hover:text-pencil"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-kalam font-bold text-marker-blue mb-6 text-center">Trang cá nhân</h2>
            
            <div className="flex flex-col items-center text-center font-patrick">
              <div className="mb-4">
                {viewingUser.photoURL || viewingUser.avatar ? (
                  <AvatarWithBadge 
                    avatarUrl={viewingUser.photoURL || viewingUser.avatar || ""} 
                    name={viewingUser.displayName || viewingUser.name || "U"}
                    stampCount={viewingUser.stampCount}
                    customBadgeTitle={viewingUser.customBadgeTitle}
                    customBadgeImage={viewingUser.customBadgeImage}
                    size="lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-[3px] border-pencil overflow-hidden bg-muted-paper shadow-sm flex items-center justify-center font-kalam font-bold text-4xl">
                    {(viewingUser.displayName || viewingUser.name)?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-pencil mb-1">{viewingUser.displayName || viewingUser.name}</h3>
              <p className="text-pencil/60 mb-2">{viewingUser.email}</p>
              
              <span className="font-bold text-marker-blue bg-marker-blue/10 border border-marker-blue/20 px-3 py-1 rounded-full text-sm mb-4">
                {viewingUser.title || "Tân binh"}
              </span>

              {viewingUser.bio && (
                <p className="text-pencil mb-4 italic text-lg px-4">&quot;{viewingUser.bio}&quot;</p>
              )}
              
              <div className="flex flex-wrap justify-center gap-4 text-pencil/70 font-bold mb-6 text-sm">
                {viewingUser.location && <span>📍 {viewingUser.location}</span>}
                <span>📅 Tham gia Temsy</span>
              </div>
              
              <Link href={`/profile/${viewingUser.id}`} className="w-full py-3 bg-postit text-pencil font-bold text-xl border-[3px] border-pencil wobbly-border shadow-pencil hover:-translate-y-1 hover:shadow-pencil-hover transition-all flex items-center justify-center gap-2">
                Xem toàn bộ hồ sơ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg border-[4px] border-pencil rounded-xl shadow-pencil overflow-hidden animate-in fade-in zoom-in duration-300 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowRewardModal(false)}
              className="absolute top-4 right-4 p-2 text-pencil hover:bg-muted-paper rounded-full transition-colors z-10 bg-white/50"
            >
              <X size={24} />
            </button>
            
            <div className="p-6 bg-pastel-blue text-white border-b-[4px] border-pencil">
              <h3 className="text-3xl font-kalam font-bold flex items-center gap-3">
                <Gift className="fill-white" size={28} />
                Tặng thưởng cho {rewardForm.name}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSendReward} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-pencil text-lg">Tiêu đề phần thưởng *</label>
                  <input 
                    type="text"
                    value={rewardForm.title}
                    onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                    placeholder="VD: Quà tặng tri ân đặc biệt!"
                    className="w-full px-4 py-3 bg-muted-paper border-2 border-pencil rounded-xl font-patrick text-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#2d2d2d] transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-pencil text-lg">Nội dung lời chúc *</label>
                  <textarea 
                    value={rewardForm.content}
                    onChange={(e) => setRewardForm({...rewardForm, content: e.target.value})}
                    placeholder="VD: Chúc mừng bạn đã có những tem rất đẹp!"
                    className="w-full px-4 py-3 bg-muted-paper border-2 border-pencil rounded-xl font-patrick text-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#2d2d2d] transition-all resize-none h-24"
                    required
                  />
                </div>
                
                <div className="pt-4 border-t-2 border-dashed border-pencil/20">
                  <h4 className="font-kalam font-bold text-xl text-marker-red mb-2">Tùy chọn phong tặng Huy Hiệu</h4>
                  <p className="text-sm text-pencil/70 font-patrick mb-4">Bạn có thể đính kèm một danh hiệu và hình ảnh huy hiệu đặc biệt vào phần thưởng này. Nếu bỏ trống, phần thưởng sẽ chỉ có thông báo chữ.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold text-pencil text-lg">Danh hiệu phong tặng (Tùy chọn)</label>
                      <input 
                        type="text"
                        value={rewardForm.badgeTitle}
                        onChange={(e) => setRewardForm({...rewardForm, badgeTitle: e.target.value})}
                        placeholder="VD: Đại sứ Temsy"
                        className="w-full px-4 py-3 bg-muted-paper border-2 border-pencil rounded-xl font-patrick text-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#2d2d2d] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-pencil text-lg">Ảnh huy hiệu tròn (Tùy chọn)</label>
                      <div className="bg-muted-paper border-2 border-dashed border-pencil/50 rounded-xl p-4 flex flex-col items-center justify-center">
                        <Uploader 
                          onImageSelected={(url) => setRewardForm({...rewardForm, badgeImage: url})} 
                        />
                        {rewardForm.badgeImage && (
                          <div className="mt-4 p-2 border-2 border-pencil rounded-xl bg-white flex flex-col items-center gap-2">
                            <span className="text-sm font-bold text-pencil">Ảnh đã chọn:</span>
                            <div className="w-24 h-24 rounded-full border-2 border-pencil overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
                              <img src={rewardForm.badgeImage} alt="Preview Badge" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={rewardLoading}
                  className="w-full mt-4 bg-marker-red text-white py-4 rounded-xl font-bold font-patrick text-2xl border-[3px] border-pencil shadow-[4px_4px_0px_0px_#2d2d2d] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all active:translate-y-2 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rewardLoading ? "Đang gửi..." : <><Gift size={24} /> Gửi Phần Thưởng Bất Ngờ</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md border-[4px] border-pencil rounded-xl shadow-pencil overflow-hidden animate-in fade-in zoom-in duration-300 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowBanModal(false)}
              className="absolute top-4 right-4 p-2 text-pencil hover:bg-muted-paper rounded-full transition-colors z-10 bg-white/50"
            >
              <X size={24} />
            </button>
            
            <div className="p-6 bg-red-600 text-white border-b-[4px] border-pencil">
              <h3 className="text-3xl font-kalam font-bold flex items-center gap-3">
                <Ban className="fill-red-800" size={28} />
                Cấm tài khoản
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="font-patrick text-pencil/80 mb-4 text-lg">
                Bạn đang thực hiện cấm tài khoản: <strong>{banForm.name}</strong>
              </p>
              <form onSubmit={handleBanUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-pencil text-lg">Lý do cấm *</label>
                  <input 
                    type="text"
                    value={banForm.reason}
                    onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                    placeholder="VD: Vi phạm tiêu chuẩn cộng đồng"
                    className="w-full px-4 py-3 bg-red-50 border-2 border-red-300 rounded-xl font-patrick text-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#2d2d2d] transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-pencil text-lg">Thời hạn cấm</label>
                  <select 
                    value={banForm.duration}
                    onChange={(e) => setBanForm({...banForm, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-red-50 border-2 border-red-300 rounded-xl font-patrick text-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#2d2d2d] transition-all"
                  >
                    <option value="1_hour">1 Giờ</option>
                    <option value="1_day">1 Ngày</option>
                    <option value="7_days">7 Ngày</option>
                    <option value="30_days">30 Ngày</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>
                
                <button 
                  type="submit"
                  disabled={banLoading}
                  className="w-full mt-4 bg-red-600 text-white py-4 rounded-xl font-bold font-patrick text-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#2d2d2d] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all active:translate-y-2 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {banLoading ? "Đang xử lý..." : <><Ban size={24} /> Khóa tài khoản</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
