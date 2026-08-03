"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, UserProfile } from "@/lib/userService";
import { getChatId, subscribeToMessages, sendMessage, Message } from "@/lib/chatService";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ChatRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const friendId = params.id as string;
  
  const [friend, setFriend] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch friend profile
    getUserProfile(friendId).then((profile) => {
      setFriend(profile);
      setLoading(false);
    });

    // Subscribe to messages
    const chatId = getChatId(user.uid, friendId);
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user, friendId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(user.uid, friendId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-kalam font-bold text-pencil mb-2">Chưa đăng nhập</h2>
        <button onClick={() => router.push("/login")} className="px-6 py-3 bg-marker-blue text-white font-patrick font-bold text-xl border-[3px] border-pencil shadow-pencil wobbly-border -rotate-1 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-paper font-sans">
      {/* Header */}
      <div className="bg-white border-b-[3px] border-pencil p-4 sticky top-0 z-20 shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/chat" className="p-2 border-2 border-transparent hover:border-pencil hover:bg-yellow-50 rounded-full transition-all text-pencil">
            <ArrowLeft size={24} />
          </Link>
          
          {loading ? (
            <div className="flex-1 animate-pulse h-8 bg-gray-200 rounded"></div>
          ) : friend ? (
            <Link href={`/profile/${friend.uid}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full border-2 border-pencil overflow-hidden">
                <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-kalam font-bold text-pencil truncate">
                {friend.displayName}
              </h1>
            </Link>
          ) : (
            <h1 className="text-xl font-kalam font-bold text-pencil">Không tìm thấy người dùng</h1>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 font-patrick text-pencil/50 italic bg-white/50 border-[2px] border-pencil border-dashed rounded-lg">
              Hãy gửi lời chào đầu tiên!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user.uid;
              const showAvatar = !isMine && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);
              
              return (
                <div key={msg.id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2`}>
                  {!isMine && (
                    <div className="w-8 h-8 shrink-0 mb-1">
                      {showAvatar && friend && (
                        <img src={friend.photoURL} alt="avatar" className="w-full h-full rounded-full border-2 border-pencil object-cover" />
                      )}
                    </div>
                  )}
                  <div 
                    className={`max-w-[75%] p-3 border-[3px] border-pencil shadow-[2px_2px_0_0_#2d2d2d] text-base font-patrick
                      ${isMine 
                        ? "bg-marker-blue text-white rounded-t-xl rounded-l-xl" 
                        : "bg-white text-pencil rounded-t-xl rounded-r-xl"
                      }`}
                  >
                    {msg.imageUrl && (
                      <div className="mb-2">
                        {msg.stampId ? (
                          <Link href={`/stamp/${msg.stampId}`} className="block overflow-hidden rounded-lg border-2 border-pencil hover:opacity-90">
                            <img src={msg.imageUrl} alt="stamp" className="w-full h-auto object-cover max-h-[200px]" />
                            <div className="bg-pencil text-white text-xs p-1 text-center font-bold">Xem tem</div>
                          </Link>
                        ) : (
                          <img src={msg.imageUrl} alt="attached" className="w-full h-auto rounded-lg border-2 border-pencil object-cover max-h-[200px]" />
                        )}
                      </div>
                    )}
                    {msg.text && <div>{msg.text}</div>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-[3px] border-pencil p-4 shrink-0 pb-safe">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhắn tin..." 
            className="flex-1 px-4 py-3 bg-paper border-[3px] border-pencil shadow-[2px_2px_0_0_#2d2d2d] font-patrick text-lg text-pencil focus:outline-none focus:bg-white transition-colors rounded-xl"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-marker-yellow text-pencil border-[3px] border-pencil shadow-[2px_2px_0_0_#2d2d2d] rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_#2d2d2d]"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
