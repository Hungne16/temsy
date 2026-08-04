"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, UserProfile } from "@/lib/userService";
import { getActiveChats, ChatSession } from "@/lib/chatService";
import { subscribeToNotifications, NotificationData } from "@/lib/notificationService";
import Link from "next/link";
import { MessageCircle, Users, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch active chats
        const chats = await getActiveChats(user.uid);
        setActiveChats(chats);
        
        const chatUserIds = new Set<string>();
        chats.forEach(chat => {
          chat.participants.forEach(p => {
            if (p !== user.uid) chatUserIds.add(p);
          });
        });

        // Combine friends and chat partners
        const allUserIdsToFetch = new Set<string>([
          ...(userProfile?.friends || []),
          ...Array.from(chatUserIds)
        ]);

        if (allUserIdsToFetch.size > 0) {
          const userPromises = Array.from(allUserIdsToFetch).map((id: string) => getUserProfile(id));
          const usersData = await Promise.all(userPromises);
          setContacts(usersData.filter(Boolean) as UserProfile[]);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to notifications for unread chat badges
    const unsubNotifications = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs.filter(n => n.type === 'chat' && !n.isRead));
    });

    return () => {
      unsubNotifications();
    };
  }, [user, userProfile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <MessageCircle size={64} className="text-pencil/30 mb-4" />
        <h2 className="text-2xl font-kalam font-bold text-pencil mb-2">Chưa đăng nhập</h2>
        <p className="font-patrick text-pencil/70 mb-6">Bạn cần đăng nhập để sử dụng tính năng nhắn tin.</p>
        <button onClick={() => router.push("/login")} className="px-6 py-3 bg-marker-blue text-white font-patrick font-bold text-xl border-[3px] border-pencil shadow-pencil wobbly-border -rotate-1 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const filteredContacts = contacts.filter(contact => 
    contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper font-sans pb-32">
      {/* Header */}
      <div className="bg-white border-b-[3px] border-pencil p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 border-2 border-transparent hover:border-pencil hover:bg-yellow-50 rounded-full transition-all text-pencil">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-kalam font-bold text-pencil flex items-center gap-2">
              <MessageCircle className="text-marker-blue" />
              Tin nhắn
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="mb-6 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bạn bè..." 
            className="w-full px-12 py-4 bg-white border-[3px] border-pencil shadow-[2px_2px_0_0_#2d2d2d] wobbly-border font-patrick text-lg text-pencil focus:outline-none focus:bg-yellow-50 transition-colors"
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pencil/50" />
        </div>

        {loading ? (
          <div className="text-center py-10 font-patrick text-pencil/50 animate-pulse">
            Đang tải danh sách...
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 bg-white/50 border-[3px] border-pencil border-dashed wobbly-border rotate-1">
                <Users size={48} className="mx-auto text-pencil/30 mb-4" />
                <h3 className="font-kalam font-bold text-xl text-pencil mb-2">Chưa có ai để trò chuyện</h3>
                <p className="font-patrick text-pencil/60">Hãy kết bạn hoặc nhắn tin để bắt đầu nhé!</p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                // Find if there's an active chat to show last message
                const chatId = [user.uid, contact.uid].sort().join("_");
                const activeChat = activeChats.find(c => c.id === chatId);
                
                // Check if there are unread messages from this contact
                const hasUnread = notifications.some(n => n.link === `/chat/${contact.uid}`);
                
                const isStranger = !(userProfile?.friends || []).includes(contact.uid);
                
                return (
                  <Link 
                    href={`/chat/${contact.uid}`} 
                    key={contact.uid}
                    className="block bg-white border-[3px] border-pencil p-4 flex items-center gap-4 wobbly-border shadow-[2px_2px_0_0_#2d2d2d] hover:shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 transition-all group relative"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-pencil overflow-hidden shrink-0 relative">
                      <img src={contact.photoURL} alt={contact.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-kalam font-bold text-xl text-pencil truncate group-hover:text-marker-blue transition-colors flex items-center gap-2">
                        {contact.displayName}
                        {isStranger && (
                          <span title="Người lạ" className="w-5 h-5 flex items-center justify-center bg-marker-red text-white text-[10px] rounded-full font-bold">!</span>
                        )}
                        {hasUnread && (
                          <span className="w-3 h-3 bg-marker-red rounded-full inline-block animate-pulse"></span>
                        )}
                      </h3>
                      {activeChat?.lastMessage ? (
                        <p className={`text-sm font-patrick truncate mt-1 ${hasUnread ? "text-pencil font-bold" : "text-pencil/70"}`}>
                          {activeChat.lastMessage}
                        </p>
                      ) : (
                        <p className="text-sm font-patrick text-pencil/40 italic truncate mt-1">
                          Bắt đầu cuộc trò chuyện...
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
