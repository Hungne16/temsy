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
  stampCount?: number;
  size?: "sm" | "md" | "lg" | "xl";
  isLocked?: boolean;
  customBadgeTitle?: string;
  customBadgeImage?: string;
}

export default function AvatarWithBadge({
  avatarUrl,
  name,
  title,
  stampCount,
  size = "md",
  isLocked = false,
  customBadgeTitle,
  customBadgeImage
}: AvatarWithBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Compute title if stampCount is provided
  let computedTitle = customBadgeTitle || title || "Tân binh";
  if (!customBadgeTitle && stampCount !== undefined) {
    if (stampCount >= 50) computedTitle = "Huyền thoại";
    else if (stampCount >= 25) computedTitle = "Nhà lữ hành";
    else if (stampCount >= 10) computedTitle = "Chuyên gia";
    else if (stampCount >= 5) computedTitle = "Người gỡ rối";
    else computedTitle = "Tân binh";
  }

  // Map size prop to Tailwind classes for avatar container
  const sizeClasses = {
    sm: "w-10 h-10 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl",
    xl: "w-32 h-32 text-5xl",
  };

  // Map size prop to badge size
  // Increased sizes slightly to make the badges stand out more as requested
  const badgeSizeClasses = {
    sm: "w-8 h-12 -top-2 -left-2",
    md: "w-12 h-20 -top-3 -left-3",
    lg: "w-16 h-28 -top-4 -left-4",
    xl: "w-24 h-40 -top-8 -left-8",
  };

  const badgeImg = customBadgeImage || BADGE_IMAGES[computedTitle] || BADGE_IMAGES["default"];
  const isCustom = !!customBadgeImage;

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

    </div>
  );
}
