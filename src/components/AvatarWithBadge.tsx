import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Temsy Badges Mapping
// Assuming badges are placed in /public/badges/
export const BADGE_IMAGES: Record<string, string> = {
  "Tân binh": "/badges/explorer.png",
  "Người gỡ rối": "/badges/traveler.png",
  "Chuyên gia": "/badges/adventurer.png",
  "Huyền thoại": "/badges/legend.png",
  // Fallback badge if needed
  "default": "/badges/explorer.png"
};

interface AvatarWithBadgeProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isLocked?: boolean;
}

export default function AvatarWithBadge({
  avatarUrl,
  name,
  title = "Tân binh",
  size = "md",
  isLocked = false
}: AvatarWithBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Map size prop to Tailwind classes for avatar container
  const sizeClasses = {
    sm: "w-10 h-10 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl",
    xl: "w-32 h-32 text-5xl",
  };

  // Map size prop to badge size
  const badgeSizeClasses = {
    sm: "w-6 h-10 -top-2 -left-2",
    md: "w-10 h-16 -top-3 -left-3",
    lg: "w-14 h-24 -top-4 -left-4",
    xl: "w-20 h-32 -top-6 -left-6",
  };

  const badgeImg = BADGE_IMAGES[title] || BADGE_IMAGES["default"];

  return (
    <div className="relative inline-block"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Container */}
      <div className={`${sizeClasses[size]} rounded-full border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] overflow-hidden bg-[#Fdfbf7] flex items-center justify-center font-kalam font-bold text-pencil shrink-0`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{(name || "U").charAt(0)}</span>
        )}
      </div>

      {/* Achievement Badge Overlay */}
      <Link href="/achievements" title="Xem danh hiệu">
        <div 
          className={`absolute ${badgeSizeClasses[size]} z-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isHovered ? 'scale-110' : 'scale-100'}`}
        >
          <div className={`relative w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] ${isLocked ? 'grayscale opacity-70' : ''}`}>
            {/* Using a placeholder for now, ideally next/image */}
            <img src={badgeImg} alt={title} className="w-full h-full object-contain" />
            
            {/* Lock Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pencil drop-shadow-md">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
