import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kalam, Patrick_Hand } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { FloatingDock } from "@/components/FloatingDock";
import { NotificationBell } from "@/components/NotificationBell";
import { ChatBubble } from "@/components/ChatBubble";
import { RewardPopup } from "@/components/RewardPopup";
import { BannedPopup } from "@/components/BannedPopup";
import { AchievementPopup } from "@/components/AchievementPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  variable: "--font-kalam",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick-hand",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbfbf9",
};

export const metadata: Metadata = {
  title: "Temsy - Biến ảnh thành tem kỷ niệm",
  description: "Ứng dụng sưu tầm tem kỹ thuật số, biến mỗi khoảnh khắc thành một con tem lưu giữ.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Temsy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} ${patrickHand.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-patrick">
        <AuthProvider>
          <SplashScreen>
            <main className="w-full max-w-7xl mx-auto pb-32">
              {children}
            </main>
            <NotificationBell />
            <ChatBubble />
            <BannedPopup />
            <RewardPopup />
            <AchievementPopup />
            <FloatingDock />
          </SplashScreen>
        </AuthProvider>
      </body>
    </html>
  );
}
