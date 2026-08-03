"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserTitle, deleteUserProfile, createNewUser } from "@/lib/adminService";
import { Search, Edit2, Trash2, UserPlus, X, Save, Key, Shield } from "lucide-react";

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      // Sort by join date descending
      data.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert("Lỗi tạo người dùng: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
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
                <th className="p-4 font-bold text-pencil text-lg">Danh hiệu</th>
                <th className="p-4 font-bold text-pencil text-lg">Vai trò</th>
                <th className="p-4 font-bold text-pencil text-lg text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-pencil/50 text-lg font-bold">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-pencil/50 text-lg font-bold">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b-2 border-dashed border-pencil/10 hover:bg-yellow-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-pencil overflow-hidden bg-muted-paper shrink-0 flex items-center justify-center font-kalam font-bold">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-pencil text-lg">{user.name}</div>
                          <div className="text-sm text-pencil/60 flex items-center gap-1">
                            {user.email}
                          </div>
                        </div>
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
                      {user.role === "admin" ? (
                        <span className="flex items-center gap-1 text-marker-red font-bold font-patrick text-sm bg-red-50 border border-red-100 px-3 py-1 rounded-full w-max">
                          <Shield size={14} /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-pencil/60 font-bold font-patrick text-sm bg-gray-50 border border-gray-100 px-3 py-1 rounded-full w-max">
                          Người dùng
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
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
    </div>
  );
}
