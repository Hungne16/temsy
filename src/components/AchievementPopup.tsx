/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/userService";
import { X, Award, PartyPopper } from "lucide-react";
import Image from "next/image";

export function AchievementPopup() {
  const { userProfile, setUserProfile } = useAuth();
  const [isRendered, setIsRendered] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (userProfile?.hasUnseenBadge && !isRendered) {
      setIsRendered(true);
      setClosing(false);
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFC107', '#FF9800', '#F44336', '#4CAF50', '#2196F3']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFC107', '#FF9800', '#F44336', '#4CAF50', '#2196F3']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [userProfile?.hasUnseenBadge, isRendered]);

  const handleClose = async () => {
    setClosing(true);
    
    setTimeout(async () => {
      setIsRendered(false);
      try {
        // Update local state
        setUserProfile((prev: any) => ({ ...prev, hasUnseenBadge: false }));
        // Update Firestore
        if (userProfile?.uid) {
          await updateUserProfile(userProfile.uid, { hasUnseenBadge: false });
        }
      } catch (err) {
        console.error("Lỗi khi tắt huy hiệu:", err);
      }
    }, 300);
  };

  if (!isRendered || !userProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-paper border-[4px] border-pencil wobbly-border-md shadow-pencil p-6 md:p-10 max-w-md w-full flex flex-col items-center text-center transform transition-all duration-300 ${closing ? 'scale-90 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'}`}>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-pencil/50 hover:text-pencil bg-muted-paper rounded-full p-2 border-2 border-transparent hover:border-pencil transition-all"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-marker-red/10 rounded-full flex items-center justify-center mb-4 border-2 border-marker-red border-dashed">
          <PartyPopper size={40} className="text-marker-red animate-bounce" />
        </div>

        <h2 className="text-4xl font-kalam font-bold text-pencil mb-2 -rotate-1">Chúc mừng!</h2>
        <p className="text-xl font-patrick text-pencil/80 mb-6">Bạn vừa nhận được một danh hiệu mới từ hệ thống Temsy.</p>

        <div className="bg-white border-[3px] border-pencil p-6 wobbly-border shadow-[4px_4px_0_0_rgba(45,45,45,0.1)] w-full flex flex-col items-center gap-4 mb-8 rotate-1">
          {userProfile.customBadgeImage ? (
            <div className="relative w-24 h-24">
              <Image 
                src={userProfile.customBadgeImage} 
                alt="Badge" 
                fill
                className="object-contain drop-shadow-md"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-pastel-yellow/30 rounded-full border-[3px] border-pencil border-dashed flex items-center justify-center text-pencil/50">
              <Award size={40} />
            </div>
          )}
          
          <div className="text-2xl font-bold font-patrick text-marker-blue bg-pastel-blue/20 px-4 py-2 border-2 border-pencil rounded-xl wobbly-border-sm -rotate-2">
            {userProfile.customBadgeTitle || "Huy hiệu bí ẩn"}
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="w-full py-4 bg-marker-blue text-white font-bold font-patrick text-2xl border-[3px] border-pencil wobbly-border shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-0 active:shadow-[2px_2px_0_0_#2d2d2d] transition-all"
        >
          Tuyệt vời!
        </button>
      </div>
    </div>
  );
}

