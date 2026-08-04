/* eslint-disable */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { subscribeToNotifications, NotificationData, markNotificationAsRead } from "@/lib/notificationService";
import { useRouter } from "next/navigation";

export function ChatBubble() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatNotifications, setChatNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      const chatNotifs = data.filter(n => n.type === 'chat' && !n.isRead);
      setChatNotifications(chatNotifs);
      setUnreadCount(chatNotifs.length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (!user) return null;

  // Hide on any chat pages
  if (pathname.startsWith("/chat")) {
    return null;
  }

  const handleClick = async () => {
    // Mark all chat notifications as read
    try {
      await Promise.all(
        chatNotifications.map(n => n.id ? markNotificationAsRead(n.id, false, user.uid) : Promise.resolve())
      );
    } catch (e) {
      console.error(e);
    }
    router.push("/chat");
  };

  return (
    <div className="fixed bottom-40 left-4 md:top-6 md:left-[5.5rem] md:bottom-auto z-50 font-patrick">
      <button 
        onClick={handleClick}
        className="relative p-3 rounded-full border-[3px] border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] transition-all bg-marker-blue hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#2d2d2d] wobbly-border-sm flex items-center justify-center text-white"
        title="Nhắn tin"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-marker-red text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-pencil animate-bounce shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

