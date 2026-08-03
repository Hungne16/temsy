"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertCircle, MessageCircle, X, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToNotifications, markNotificationAsRead, NotificationData, updateNotificationStatus } from "@/lib/notificationService";
import { addFriend } from "@/lib/friendService";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      // Lọc bỏ thông báo chat vì đã hiển thị ở ChatBubble
      setNotifications(data.filter(n => n.type !== 'chat'));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter(n => {
    if (n.recipientId === "ALL") {
      return !n.readBy?.includes(user.uid);
    }
    return !n.isRead;
  }).length;

  const handleNotificationClick = async (notification: NotificationData) => {
    // Không chuyển trang nếu là friend_request đang pending
    if (notification.type === 'friend_request' && notification.status === 'pending') {
      return;
    }

    const isGlobal = notification.recipientId === "ALL";
    const isUnread = isGlobal ? !notification.readBy?.includes(user.uid) : !notification.isRead;

    if (isUnread && notification.id) {
      await markNotificationAsRead(notification.id, isGlobal, user.uid);
    }

    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const handleAcceptFriend = async (e: React.MouseEvent, notification: NotificationData) => {
    e.stopPropagation();
    if (!notification.id || !notification.senderId || !user) return;
    
    try {
      await addFriend(user.uid, notification.senderId);
      await updateNotificationStatus(notification.id, 'accepted');
      alert("Đã thêm bạn bè thành công!");
    } catch (error: any) {
      alert(error.message || "Lỗi khi đồng ý kết bạn");
    }
  };

  const handleRejectFriend = async (e: React.MouseEvent, notification: NotificationData) => {
    e.stopPropagation();
    if (!notification.id) return;
    try {
      await updateNotificationStatus(notification.id, 'rejected');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed bottom-24 left-4 md:top-6 md:left-6 md:bottom-auto z-50 font-patrick" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-full border-[3px] border-pencil shadow-[2px_2px_0px_0px_#2d2d2d] transition-all
          ${isOpen ? "bg-muted-paper translate-y-[2px] shadow-none" : "bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#2d2d2d]"}
          wobbly-border-sm flex items-center justify-center
        `}
      >
        <Bell className="text-pencil" size={24} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-marker-red text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-pencil animate-bounce shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 md:bottom-auto md:top-16 left-0 w-80 sm:w-96 bg-white border-[4px] border-pencil wobbly-border shadow-[4px_4px_0px_0px_#2d2d2d] overflow-hidden flex flex-col max-h-[70vh]">
          <div className="bg-muted-paper border-b-[3px] border-pencil p-4 flex justify-between items-center relative">
            <div className="absolute top-1 left-2 w-10 h-3 bg-black/10 -rotate-3" style={{ clipPath: "polygon(0 0%, 100% 10%, 95% 100%, 5% 95%)" }}></div>
            <h3 className="font-kalam font-bold text-2xl text-pencil pl-2">Thông báo</h3>
            <button onClick={() => setIsOpen(false)} className="text-pencil/50 hover:text-marker-red transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 bg-[url('/noise.png')]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Bell size={48} className="text-pencil/20 mb-2" />
                <p className="text-pencil/50 font-bold text-lg">Bạn chưa có thông báo nào!</p>
              </div>
            ) : (
              <div className="divide-y-[3px] divide-pencil/10">
                {notifications.map((notification) => {
                  const isGlobal = notification.recipientId === "ALL";
                  const isUnread = isGlobal ? !notification.readBy?.includes(user.uid) : !notification.isRead;
                  const dateStr = notification.createdAt?.toMillis ? new Date(notification.createdAt.toMillis()).toLocaleString('vi-VN') : "Vừa xong";
                  
                  return (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 transition-colors cursor-pointer flex gap-3 
                        ${isUnread ? 'bg-yellow-50/80 hover:bg-yellow-100' : 'bg-white hover:bg-gray-50'}
                      `}
                    >
                      <div className="mt-1 shrink-0">
                        {notification.type === 'system' ? (
                          <div className="w-10 h-10 bg-red-100 rounded-full border-2 border-pencil flex items-center justify-center text-marker-red">
                            <AlertCircle size={20} />
                          </div>
                        ) : notification.type === 'friend_request' ? (
                          <div className="w-10 h-10 bg-green-100 rounded-full border-2 border-pencil flex items-center justify-center text-green-600">
                            <UserPlus size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-pencil flex items-center justify-center text-marker-blue">
                            <MessageCircle size={20} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-lg ${isUnread ? 'text-pencil' : 'text-pencil/70'}`}>
                            {notification.title}
                          </h4>
                          {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-marker-red shrink-0 mt-2"></span>}
                        </div>
                        <p className={`text-md ${isUnread ? 'text-pencil/90' : 'text-pencil/60'} leading-tight`}>
                          {notification.message}
                        </p>
                        {notification.imageUrl && (
                          <div className="mt-2 w-full max-w-[200px] h-24 rounded-lg border-2 border-pencil overflow-hidden">
                            <img src={notification.imageUrl} alt="Notification Image" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        {notification.type === 'friend_request' && (
                          <div className="mt-3 flex gap-2">
                            {notification.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={(e) => handleAcceptFriend(e, notification)}
                                  className="flex-1 px-3 py-1.5 bg-marker-blue text-white font-bold rounded-lg border-2 border-pencil shadow-[2px_2px_0_0_#2d2d2d] active:shadow-none active:translate-y-[2px] transition-all"
                                >
                                  Đồng ý
                                </button>
                                <button 
                                  onClick={(e) => handleRejectFriend(e, notification)}
                                  className="flex-1 px-3 py-1.5 bg-white text-pencil font-bold rounded-lg border-2 border-pencil shadow-[2px_2px_0_0_#2d2d2d] hover:bg-gray-50 active:shadow-none active:translate-y-[2px] transition-all"
                                >
                                  Từ chối
                                </button>
                              </>
                            ) : notification.status === 'accepted' ? (
                              <div className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-md border-2 border-green-200">
                                <Check size={16} /> Đã kết bạn
                              </div>
                            ) : (
                              <div className="text-pencil/50 font-bold text-sm bg-gray-100 px-2 py-1 rounded-md border-2 border-gray-200 inline-block">
                                Đã từ chối
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-pencil/40 mt-2 italic font-bold">
                          {dateStr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
