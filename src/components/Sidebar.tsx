"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, Image as ImageIcon, Map, User } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { href: "/", icon: Home, label: "Khám phá" },
  { href: "/create", icon: PlusSquare, label: "Tạo Tem" },
  { href: "/collection", icon: ImageIcon, label: "Bộ sưu tập" },
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
];

import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/20 glass p-6 z-40">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-xl bg-pastel-blue flex items-center justify-center text-white font-bold text-xl shadow-inner">
          T
        </div>
        <span className="text-2xl font-bold tracking-tight">Temsy</span>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium",
                isActive
                  ? "bg-pastel-blue text-white shadow-md shadow-pastel-blue/20"
                  : "hover:bg-black/5 hover:dark:bg-white/5 text-foreground/80 hover:text-foreground"
              )}
            >
              <item.icon size={22} className={cn(isActive ? "stroke-[2.5]" : "stroke-2")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-3">
        {user ? (
          <button onClick={logout} className="flex items-center gap-3 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors text-left w-full">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/40 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cream-dark border border-white/40 shadow-sm" />
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="truncate w-full block">{user.displayName || "User"}</span>
              <span className="text-[10px] opacity-70">Đăng xuất</span>
            </div>
          </button>
        ) : (
          <button onClick={signInWithGoogle} className="flex items-center gap-3 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors w-full text-left">
            <div className="w-8 h-8 rounded-full bg-cream-dark border border-white/40 shadow-sm flex items-center justify-center">
              <User size={16} />
            </div>
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </aside>
  );
}
