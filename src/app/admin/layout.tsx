"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Users, LayoutDashboard, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== "admin")) {
      router.push("/");
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user || userProfile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 font-patrick">
        <div className="flex flex-col items-center gap-4 text-pencil/50">
          <ShieldAlert size={48} className="animate-pulse" />
          <p className="text-xl font-bold">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col md:flex-row font-patrick">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-pencil shrink-0 flex flex-col">
        <div className="p-6 border-b-[3px] border-pencil/20">
          <Link href="/" className="inline-block hover:-translate-y-1 transition-transform">
            <h1 className="text-3xl font-kalam font-bold text-marker-red -rotate-2">Temsy Admin</h1>
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-muted-paper rounded-full border-2 border-pencil overflow-hidden flex-shrink-0">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-kalam font-bold text-pencil">
                  A
                </div>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-pencil truncate">{userProfile?.name || "Admin"}</span>
              <span className="text-xs font-bold text-marker-blue border border-marker-blue/30 bg-marker-blue/10 px-2 py-0.5 rounded-full inline-block w-max">
                Quản trị viên
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-transparent hover:border-pencil hover:bg-muted-paper transition-all font-bold text-pencil/80 hover:text-pencil"
          >
            <LayoutDashboard size={20} /> Tổng quan
          </Link>
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-pencil bg-muted-paper wobbly-border shadow-[2px_2px_0_0_#2d2d2d] font-bold text-pencil"
          >
            <Users size={20} /> Quản lý người dùng
          </Link>
        </nav>
        
        <div className="p-4 border-t-[3px] border-pencil/20">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-pencil bg-white hover:bg-red-50 text-marker-red font-bold transition-colors wobbly-border text-center justify-center"
          >
            <LogOut size={20} /> Thoát Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[url('/noise.png')]">
        {children}
      </main>
    </div>
  );
}
