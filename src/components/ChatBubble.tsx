"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function ChatBubble() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  // Hide on any chat pages
  if (pathname.startsWith("/chat")) {
    return null;
  }

  return (
    <div className="fixed bottom-40 left-4 md:top-6 md:left-[5.5rem] md:bottom-auto z-50 font-patrick">
      <Link 
        href="/chat"
        className="relative p-3 rounded-full border-[3px] border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] transition-all bg-marker-blue hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#2d2d2d] wobbly-border-sm flex items-center justify-center text-white"
        title="Nhắn tin"
      >
        <MessageCircle size={24} />
      </Link>
    </div>
  );
}
