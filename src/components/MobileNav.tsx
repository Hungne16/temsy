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
  { href: "/collection", icon: ImageIcon, label: "Bộ sưu tập" },
  { href: "/create", icon: PlusSquare, label: "Tạo Tem", isPrimary: true },
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20 pb-safe z-40">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 bg-pastel-blue text-white rounded-2xl shadow-lg shadow-pastel-blue/30 transform transition-transform active:scale-95"
              >
                <item.icon size={26} className="stroke-[2.5]" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 w-16 h-12 transition-colors",
                isActive ? "text-pastel-blue" : "text-foreground/50 hover:text-foreground/80"
              )}
            >
              <item.icon size={22} className={cn(isActive ? "stroke-[2.5]" : "stroke-2")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
