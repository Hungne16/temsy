"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Bookmark, User as UserIcon, Shield, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function FloatingDock() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/map", icon: Compass, label: "Map" },
    { href: "/create", icon: PlusCircle, label: "Tạo Tem", isPrimary: true },
    { href: "/collection", icon: Bookmark, label: "Bộ Sưu Tập" },
    { href: "/chat", icon: MessageCircle, label: "Nhắn tin" },
    { href: "/profile", icon: UserIcon, label: "Profile" },
  ];

  if (userProfile?.role === "admin" || user?.email === "admin123@gmail.temsy") {
    navItems.push({ href: "/admin", icon: Shield, label: "Admin" });
  }

  // Hide on chat room (e.g. /chat/123) but keep on chat list (/chat)
  if (pathname.startsWith("/chat/") && pathname !== "/chat") {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-gray-200/50 rounded-full px-2 py-2 flex items-center gap-1 md:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative mx-1 md:mx-3"
              >
                <div className="w-14 h-14 bg-pastel-blue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-pastel-blue-dark hover:scale-105 active:scale-95 transition-all duration-300">
                  <Icon size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative p-3 md:p-4 rounded-full transition-all duration-300 ${
                isActive 
                  ? "text-pastel-blue" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100/50"
              }`}
              title={item.label}
            >
              <Icon size={24} className={isActive ? "scale-110" : "scale-100"} />
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-pastel-blue rounded-full"></span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
