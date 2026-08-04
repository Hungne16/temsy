"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationData } from "@/lib/notificationService";
import { updateUserProfile } from "@/lib/userService";
import confetti from "canvas-confetti";
import { Gift, X, Check, XCircle } from "lucide-react";

export function RewardPopup() {
  const { user } = useAuth();
  const [rewardNotif, setRewardNotif] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen for pending reward notifications
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      where("type", "==", "reward"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Show the first pending reward
        const notif = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as NotificationData;
        setRewardNotif(notif);
        
        // Trigger fireworks
        triggerFireworks();
      } else {
        setRewardNotif(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const triggerFireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleAction = async (action: 'accepted' | 'rejected') => {
    if (!rewardNotif?.id || !user) return;
    
    try {
      setLoading(true);
      // 1. Update notification status
      const notifRef = doc(db, "notifications", rewardNotif.id);
      await updateDoc(notifRef, {
        status: action,
        isRead: true
      });

      // 2. If accepted and it has a badge, update user profile
      if (action === 'accepted' && rewardNotif.rewardData?.badgeTitle) {
        await updateUserProfile(user.uid, {
          customBadgeTitle: rewardNotif.rewardData.badgeTitle,
          customBadgeImage: rewardNotif.rewardData.badgeImage || ""
        });
      }
      
      setRewardNotif(null);
    } catch (error) {
      console.error("Lỗi xử lý phần thưởng:", error);
      alert("Đã xảy ra lỗi, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (!rewardNotif) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg border-[4px] border-pencil rounded-xl shadow-pencil overflow-hidden animate-in fade-in zoom-in duration-500 relative flex flex-col">
        
        {/* Header pattern */}
        <div className="h-32 bg-pastel-blue w-full relative flex items-center justify-center overflow-hidden">
          {/* Animated gift icon background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <Gift size={80} className="text-white relative z-10 animate-bounce" />
        </div>

        <div className="p-8 flex flex-col items-center text-center -mt-8 relative z-20">
          
          {/* Custom Badge Avatar (if any) */}
          {rewardNotif.rewardData?.badgeImage ? (
            <div className="w-28 h-28 bg-white rounded-full border-[4px] border-pencil p-1 shadow-md mb-4 flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-pencil border-dashed flex items-center justify-center">
                <img src={rewardNotif.rewardData.badgeImage} alt="Reward Badge" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 bg-white rounded-full border-[4px] border-pencil p-1 shadow-md mb-4 flex items-center justify-center flex-shrink-0">
              <Gift size={40} className="text-marker-red" />
            </div>
          )}

          {/* Reward Title & Badge Name */}
          <h2 className="text-3xl font-kalam font-bold text-marker-red mb-2">
            {rewardNotif.title}
          </h2>
          
          {rewardNotif.rewardData?.badgeTitle && (
            <div className="bg-yellow-100 border-2 border-pencil rounded-full px-4 py-1 mb-4 shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-2">
              <span className="font-bold font-patrick text-xl text-pencil">
                Danh hiệu: {rewardNotif.rewardData.badgeTitle}
              </span>
            </div>
          )}

          <p className="text-xl font-patrick text-pencil/80 mb-8 whitespace-pre-wrap">
            {rewardNotif.rewardData?.content}
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              className="flex-1 py-3 px-4 border-[3px] border-pencil rounded-xl font-bold font-patrick text-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={20} />
              Từ chối
            </button>
            <button
              onClick={() => handleAction('accepted')}
              disabled={loading}
              className="flex-1 py-3 px-4 border-[3px] border-pencil rounded-xl bg-pastel-blue text-white font-bold font-patrick text-xl flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#2d2d2d] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all disabled:opacity-50"
            >
              <Check size={20} />
              Nhận Quà!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
