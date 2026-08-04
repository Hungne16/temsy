"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LogOut } from "lucide-react";

export function BannedPopup() {
  const { userProfile, logout } = useAuth();

  if (!userProfile?.isBanned) {
    return null;
  }

  // Double check if expired
  if (userProfile.banUntil && Date.now() >= userProfile.banUntil) {
    return null;
  }

  const formatBanTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      dateStyle: "full",
      timeStyle: "medium"
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-red-600/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-20"></div>
        
        <div className="mx-auto bg-red-100 w-24 h-24 rounded-full flex items-center justify-center border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>

        <h2 className="text-3xl font-kalam font-bold text-black mb-2">Tài khoản bị đình chỉ</h2>
        <p className="font-patrick text-xl text-gray-700 mb-6">
          Rất tiếc, tài khoản của bạn hiện đang bị hạn chế quyền truy cập vào hệ thống.
        </p>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8 text-left rotate-1">
          <div className="mb-3">
            <span className="block text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Lý do:</span>
            <span className="font-patrick text-lg text-red-900 bg-white/50 px-2 py-1 rounded inline-block w-full border border-red-100">
              {userProfile.banReason || "Vi phạm tiêu chuẩn cộng đồng"}
            </span>
          </div>
          <div>
            <span className="block text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Thời hạn đến:</span>
            <span className="font-patrick text-lg text-red-900 bg-white/50 px-2 py-1 rounded inline-block w-full border border-red-100">
              {userProfile.banUntil ? formatBanTime(userProfile.banUntil) : "Vĩnh viễn"}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold font-kalam text-xl py-3 px-6 rounded-xl border-2 border-black hover:bg-gray-800 hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
